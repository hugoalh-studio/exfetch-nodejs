import { randomInt } from "node:crypto";
import { EventEmitter } from "node:events";
import { HTTPHeaderLink } from "./header/link.js";
import { HTTPHeaderRetryAfter } from "./header/retry-after.js";
import { delay } from "./vendor/delay.js";
/**
 * exFetch HTTP status codes that retryable.
 */
export const httpStatusCodesRetryable = Object.freeze([
    408,
    429,
    500,
    502,
    503,
    504,
    506,
    507,
    508
]);
/**
 * exFetch default user agent.
 */
export const userAgentDefault = `NodeJS/${process.versions.node}-${process.platform}-${process.arch} exFetch/0.1.1`;
/**
 * @access private
 * @param {ExFetchIntervalOptions} input
 * @param {string} inputArgumentPrefix
 * @param {ExFetchIntervalStatus} original
 * @returns {ExFetchIntervalStatus}
 */
function resolveIntervalOptions(input, inputArgumentPrefix, original) {
    input.maximum ??= input.max;
    input.minimum ??= input.min;
    const optionsResolve = {
        ...original,
        increment: input.increment ?? original.increment
    };
    if (typeof input.maximum !== "undefined") {
        if (!(Number.isSafeInteger(input.maximum) && input.maximum >= 0)) {
            throw new RangeError(`Argument \`${inputArgumentPrefix}.maximum\` is not a number which is integer, positive, and safe!`);
        }
        optionsResolve.maximum = input.maximum;
    }
    if (typeof input.minimum !== "undefined") {
        if (!(Number.isSafeInteger(input.minimum) && input.minimum >= 0)) {
            throw new RangeError(`Argument \`${inputArgumentPrefix}.minimum\` is not a number which is integer, positive, and safe!`);
        }
        optionsResolve.minimum = input.minimum;
    }
    if (optionsResolve.maximum < optionsResolve.minimum) {
        throw new RangeError(`Argument \`${inputArgumentPrefix}.minimum\` is large than argument \`${inputArgumentPrefix}.maximum\`!`);
    }
    return optionsResolve;
}
/**
 * @access private
 * @param {ExFetchPaginateOptions} input
 * @param {string} inputArgumentPrefix
 * @param {ExFetchPaginateStatus} original
 * @returns {ExFetchPaginateStatus}
 */
function resolvePaginateOptions(input, inputArgumentPrefix, original) {
    input.amount ??= input.count ?? input.limit;
    input.interval ??= input.pause;
    const optionsResolve = {
        ...original,
        linkUpNextPage: input.linkUpNextPage ?? original.linkUpNextPage,
        throwOnInvalidHeaderLink: input.throwOnInvalidHeaderLink ?? original.throwOnInvalidHeaderLink
    };
    if (typeof input.amount !== "undefined") {
        if (input.amount !== Infinity && !(Number.isSafeInteger(input.amount) && input.amount > 0)) {
            throw new RangeError(`Argument \`${inputArgumentPrefix}.amount\` is not \`Infinity\`, or a number which is integer, safe, and > 0!`);
        }
        optionsResolve.amount = input.amount;
    }
    if (typeof input.interval === "number") {
        optionsResolve.interval = resolveIntervalOptions({
            maximum: input.interval,
            minimum: input.interval
        }, `${inputArgumentPrefix}.interval`, optionsResolve.interval);
    }
    else if (typeof input.interval !== "undefined") {
        optionsResolve.interval = resolveIntervalOptions({ ...input.interval, increment: false }, `${inputArgumentPrefix}.interval`, optionsResolve.interval);
    }
    return optionsResolve;
}
/**
 * Resolve interval time.
 * @access private
 * @param {ExFetchIntervalResolveTimeParameters} param
 * @returns {number} Interval time.
 */
function resolveIntervalTime({ attemptCurrent, attempts, increment, maximum, minimum }) {
    if (maximum === minimum) {
        return maximum;
    }
    if (increment) {
        const incrementMinimum = minimum + ((maximum - minimum) * attemptCurrent / attempts);
        return randomInt(incrementMinimum, maximum);
    }
    return randomInt(minimum, maximum);
}
/**
 * Extend `fetch`.
 */
export class ExFetch {
    #event;
    #httpStatusCodesRetryable;
    #paginate = {
        amount: Infinity,
        interval: {
            increment: false,
            maximum: 0,
            minimum: 0
        },
        throwOnInvalidHeaderLink: true
    };
    #retry = {
        attempts: 4,
        interval: {
            increment: true,
            maximum: 60000,
            minimum: 1000
        }
    };
    #timeout = Infinity;
    #userAgent = userAgentDefault;
    /**
     * Create a new extend `fetch` instance.
     * @param {ExFetchOptions} [options={}] Options.
     */
    constructor(options = {}) {
        options.retry ??= {};
        options.retry.attempts ??= options.retry.attemptsMaximum ?? options.retry.attemptsMax ?? options.retry.maximumAttempts ?? options.retry.maxAttempts;
        options.retry.interval ??= options.retry.delay ?? options.retry.pause;
        if (options.event instanceof EventEmitter) {
            this.#event = options.event;
        }
        else {
            this.#event = new EventEmitter();
            if (typeof options.event !== "undefined") {
                if (typeof options.event.retry !== "undefined") {
                    this.#event.on("retry", options.event.retry);
                }
            }
        }
        this.#httpStatusCodesRetryable = new Set((typeof options.httpStatusCodesRetryable === "undefined") ? httpStatusCodesRetryable : options.httpStatusCodesRetryable);
        this.#paginate = resolvePaginateOptions(options.paginate ?? {}, "options.paginate", this.#paginate);
        if (typeof options.retry.attempts !== "undefined") {
            if (!(Number.isSafeInteger(options.retry.attempts) && options.retry.attempts >= 0)) {
                throw new RangeError(`Argument \`options.retry.attempts\` is not a number which is integer, positive, and safe!`);
            }
            this.#retry.attempts = options.retry.attempts;
        }
        if (typeof options.timeout !== "undefined") {
            if (options.timeout !== Infinity && !(Number.isSafeInteger(options.timeout) && options.timeout > 0)) {
                throw new RangeError(`Argument \`options.timeout\` is not a number which is integer, positive, safe, and > 0!`);
            }
            this.#timeout = options.timeout;
        }
        if (typeof options.userAgent !== "undefined") {
            this.#userAgent = options.userAgent;
        }
    }
    /**
     * Add HTTP status codes that retryable.
     * @param {...number} values Values.
     * @returns {this}
     */
    addHTTPStatusCodesRetryable(...values) {
        for (const value of values) {
            this.#httpStatusCodesRetryable.add(value);
        }
        return this;
    }
    /**
     * Delete HTTP status codes that not retryable.
     * @param {...number} values Values.
     * @returns {this}
     */
    deleteHTTPStatusCodesRetryable(...values) {
        for (const value of values) {
            this.#httpStatusCodesRetryable.delete(value);
        }
        return this;
    }
    /**
     * Fetch a resource from the network with extend features.
     * @param {string | URL} input URL of the resource.
     * @param {Parameters<typeof fetch>[1]} [init] Custom setting that apply to the request.
     * @returns {Promise<Response>} Response.
     */
    async fetch(input, init) {
        const requestForFetchHeaders = new Headers(init?.headers);
        if (!requestForFetchHeaders.has("User-Agent") && this.#userAgent.length > 0) {
            requestForFetchHeaders.set("User-Agent", this.#userAgent);
        }
        let requestForFetchSignal = init?.signal ?? undefined;
        if (typeof requestForFetchSignal === "undefined" && this.#timeout !== Infinity) {
            requestForFetchSignal = AbortSignal.timeout(this.#timeout);
        }
        const requestForFetch = new Request(input, {
            ...init,
            headers: requestForFetchHeaders,
            signal: requestForFetchSignal
        });
        let attempt = 1;
        let response;
        do {
            response = await fetch(requestForFetch);
            if (response.ok ||
                attempt >= this.#retry.attempts ||
                !this.#httpStatusCodesRetryable.has(response.status)) {
                break;
            }
            let intervalTime = undefined;
            try {
                intervalTime = new HTTPHeaderRetryAfter(response).getRemainTimeMilliseconds();
            }
            catch {
                // Continue on error.
            }
            intervalTime ??= resolveIntervalTime({
                ...this.#retry.interval,
                attemptCurrent: attempt,
                attempts: this.#retry.attempts
            });
            const eventRetryPayload = {
                attemptCurrent: attempt,
                attempts: this.#retry.attempts,
                retryAfter: intervalTime,
                statusCode: response.status,
                statusText: response.statusText
            };
            this.#event.emit("retry", eventRetryPayload);
            await delay(intervalTime, { signal: requestForFetchSignal });
            attempt += 1;
        } while (attempt <= this.#retry.attempts);
        return response;
    }
    /**
     * Fetch paginate resources from the network with retry attempts; Not support GraphQL.
     * @param {string | URL} input URL of the first page of the resources.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
     * @param {ExFetchPaginateOptions} [optionsOverride={}] Options.
     * @returns {Promise<Response[]>} Responses.
     */
    async fetchPaginate(input, init, optionsOverride = {}) {
        const options = resolvePaginateOptions(optionsOverride, "optionsOverride", this.#paginate);
        const responses = [];
        for (let page = 1, uri = new URL(input); page <= options.amount && uri instanceof URL; page += 1) {
            if (page > 1) {
                const intervalTime = resolveIntervalTime({
                    ...options.interval,
                    attemptCurrent: 1,
                    attempts: Number.MAX_SAFE_INTEGER
                });
                if (intervalTime > 0) {
                    await delay(intervalTime, { signal: init?.signal ?? undefined });
                }
            }
            const uriLookUp = uri;
            uri = undefined;
            const response = await this.fetch(uriLookUp, init);
            responses.push(response);
            if (response.ok) {
                try {
                    const responseHeaderLink = HTTPHeaderLink.parse(response);
                    if (typeof options.linkUpNextPage === "function") {
                        uri = options.linkUpNextPage(uriLookUp, responseHeaderLink);
                    }
                    else {
                        const responseHeaderLinkNextPage = responseHeaderLink.getByRel("next");
                        if (responseHeaderLinkNextPage.length > 0) {
                            uri = new URL(responseHeaderLinkNextPage[0][0], uriLookUp);
                        }
                    }
                }
                catch (error) {
                    if (options.throwOnInvalidHeaderLink) {
                        throw new SyntaxError(`[${uriLookUp.toString()}] ${error?.message ?? error}`);
                    }
                }
            }
        }
        return responses;
    }
    /**
     * Fetch a resource from the network with retry attempts.
     * @param {string | URL} input URL of the resource.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
     * @param {ExFetchOptions} [options={}] Options.
     * @returns {Promise<Response>} Response.
     */
    static fetch(input, init, options = {}) {
        return new this(options).fetch(input, init);
    }
    /**
     * Fetch paginate resources from the network with retry attempts; Not support GraphQL.
     * @param {string | URL} input URL of the first page of the resources.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
     * @param {ExFetchOptions} [options={}] Options.
     * @returns {Promise<Response[]>} Responses.
     */
    static fetchPaginate(input, init, options = {}) {
        return new this(options).fetchPaginate(input, init);
    }
}
export default ExFetch;
/**
 * Fetch a resource from the network with retry attempts.
 * @param {string | URL} input URL of the resource.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response>} Response.
 */
export function exFetch(input, init, options = {}) {
    return new ExFetch(options).fetch(input, init);
}
/**
 * Fetch paginate resources from the network with retry attempts; Not support GraphQL.
 * @param {string | URL} input URL of the first page of the resources.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response[]>} Responses.
 */
export function exFetchPaginate(input, init, options = {}) {
    return new ExFetch(options).fetchPaginate(input, init);
}
