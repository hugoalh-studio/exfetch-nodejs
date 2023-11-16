import { randomInt } from "node:crypto";
import { HTTPHeaderLink } from "./header/link.js";
import { HTTPHeaderRetryAfter } from "./header/retry-after.js";
/**
 * exFetch HTTP status codes that redirectable.
 */
const httpStatusCodesRedirectable = Object.freeze([
    301,
    302,
    303,
    307,
    308
]);
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
export const userAgentDefault = `NodeJS/${process.versions.node}-${process.platform}-${process.arch} exFetch/0.2.0`;
/**
 * Resolve delay options.
 * @access private
 * @param {string} prefix
 * @param {number | ExFetchDelayOptions} input
 * @param {ExFetchDelayOptionsInternal} original
 * @returns {ExFetchDelayOptionsInternal}
 */
function resolveDelayOptions(prefix, input, original) {
    if (typeof input === "number") {
        if (!(Number.isSafeInteger(input) && input >= 0)) {
            throw new RangeError(`Argument \`${prefix}\` is not a number which is integer, positive, and safe!`);
        }
        return {
            maximum: input,
            minimum: input
        };
    }
    input.maximum ??= input.max;
    input.minimum ??= input.min;
    const optionsResolve = { ...original };
    if (typeof input.maximum !== "undefined") {
        if (!(Number.isSafeInteger(input.maximum) && input.maximum >= 0)) {
            throw new RangeError(`Argument \`${prefix}.maximum\` is not a number which is integer, positive, and safe!`);
        }
        optionsResolve.maximum = input.maximum;
    }
    if (typeof input.minimum !== "undefined") {
        if (!(Number.isSafeInteger(input.minimum) && input.minimum >= 0)) {
            throw new RangeError(`Argument \`${prefix}.minimum\` is not a number which is integer, positive, and safe!`);
        }
        optionsResolve.minimum = input.minimum;
    }
    if (optionsResolve.minimum > optionsResolve.maximum) {
        throw new RangeError(`Argument \`${prefix}.minimum\` is large than argument \`${prefix}.maximum\`!`);
    }
    return optionsResolve;
}
/**
 * Resolve delay time.
 * @access private
 * @param {ExFetchDelayOptionsInternal} param
 * @returns {number} Delay time.
 */
function resolveDelayTime({ maximum, minimum }) {
    if (maximum === minimum) {
        return maximum;
    }
    return randomInt(minimum, maximum);
}
/**
 * @access private
 * @param {string} prefix
 * @param {ExFetchPaginateOptions} input
 * @param {ExFetchPaginateOptionsInternal} original
 * @returns {ExFetchPaginateOptionsInternal}
 */
function resolvePaginateOptions(prefix, input, original) {
    const optionsResolve = { ...original };
    if (typeof input.delay !== "undefined") {
        optionsResolve.delay = resolveDelayOptions(`${prefix}.delay`, input.delay, original.delay);
    }
    if (typeof input.linkUpNextPage !== "undefined") {
        optionsResolve.linkUpNextPage = input.linkUpNextPage;
    }
    if (typeof input.maximum !== "undefined") {
        if (input.maximum !== Infinity && !(Number.isSafeInteger(input.maximum) && input.maximum > 0)) {
            throw new RangeError(`Argument \`${prefix}.maximum\` is not \`Infinity\`, or a number which is integer, safe, and > 0!`);
        }
        optionsResolve.maximum = input.maximum;
    }
    if (typeof input.onEvent !== "undefined") {
        optionsResolve.onEvent = input.onEvent;
    }
    if (typeof input.throwOnInvalidHeaderLink !== "undefined") {
        optionsResolve.throwOnInvalidHeaderLink = input.throwOnInvalidHeaderLink;
    }
    return optionsResolve;
}
/**
 * Start a `Promise` based delay with `AbortSignal`.
 * @param {number} value Time of the delay, by milliseconds. `0` means execute "immediately", or more accurately, the next event cycle.
 * @param {AbortSignal | undefined} [signal] A signal object that allow to communicate with a DOM request and abort it if required via an `AbortController` object.
 * @returns {Promise<void>}
 */
function setDelay(value, signal) {
    if (value <= 0) {
        return Promise.resolve();
    }
    if (signal?.aborted) {
        return Promise.reject(signal.reason);
    }
    return new Promise((resolve, reject) => {
        function abort() {
            clearTimeout(id);
            reject(signal?.reason);
        }
        function done() {
            signal?.removeEventListener("abort", abort);
            resolve();
        }
        const id = setTimeout(done, value);
        signal?.addEventListener("abort", abort, { once: true });
    });
}
/**
 * Extend `fetch`.
 */
export class ExFetch {
    #httpStatusCodesRetryable;
    #paginate = {
        delay: {
            maximum: 0,
            minimum: 0
        },
        linkUpNextPage: ({ currentHeaderLink, currentURL }) => {
            const currentHeaderLinkEntryNextPage = currentHeaderLink.getByRel("next");
            if (currentHeaderLinkEntryNextPage.length > 0) {
                return new URL(currentHeaderLinkEntryNextPage[0][0], currentURL);
            }
            return;
        },
        maximum: Infinity,
        onEvent: undefined,
        throwOnInvalidHeaderLink: true
    };
    #redirect = {
        delay: {
            maximum: 0,
            minimum: 0
        },
        maximum: Infinity,
        onEvent: undefined
    };
    #retry = {
        delay: {
            maximum: 60000,
            minimum: 1000
        },
        maximum: 4,
        onEvent: undefined
    };
    #timeout = Infinity;
    #userAgent = userAgentDefault;
    /**
     * Create a new extend `fetch` instance.
     * @param {ExFetchOptions} [options={}] Options.
     */
    constructor(options = {}) {
        this.#httpStatusCodesRetryable = new Set((typeof options.httpStatusCodesRetryable === "undefined") ? httpStatusCodesRetryable : options.httpStatusCodesRetryable);
        this.#paginate = resolvePaginateOptions("options.paginate", options.paginate ?? {}, this.#paginate);
        if (typeof options.redirect?.delay !== "undefined") {
            this.#redirect.delay = resolveDelayOptions("options.redirect.delay", options.redirect.delay, this.#redirect.delay);
        }
        if (typeof options.redirect?.maximum !== "undefined") {
            if (!(Number.isSafeInteger(options.redirect.maximum) && options.redirect.maximum >= 0)) {
                throw new RangeError(`Argument \`options.redirect.maximum\` is not a number which is integer, positive, and safe!`);
            }
            this.#redirect.maximum = options.redirect.maximum;
        }
        this.#redirect.onEvent = options.redirect?.onEvent;
        if (typeof options.retry?.delay !== "undefined") {
            this.#retry.delay = resolveDelayOptions("options.retry.delay", options.retry.delay, this.#retry.delay);
        }
        if (typeof options.retry?.maximum !== "undefined") {
            if (!(Number.isSafeInteger(options.retry.maximum) && options.retry.maximum >= 0)) {
                throw new RangeError(`Argument \`options.retry.maximum\` is not a number which is integer, positive, and safe!`);
            }
            this.#retry.maximum = options.retry.maximum;
        }
        this.#retry.onEvent = options.retry?.onEvent;
        if (typeof options.timeout !== "undefined") {
            if (options.timeout !== Infinity && !(Number.isSafeInteger(options.timeout) && options.timeout > 0)) {
                throw new RangeError(`Argument \`options.timeout\` is not \`Infinity\`, or a number which is integer, positive, safe, and > 0!`);
            }
            this.#timeout = options.timeout;
        }
        if (typeof options.userAgent !== "undefined") {
            this.#userAgent = options.userAgent;
        }
    }
    addHTTPStatusCodeRetryable(...values) {
        for (const value of values.flat(Infinity)) {
            this.#httpStatusCodesRetryable.add(value);
        }
        return this;
    }
    deleteHTTPStatusCodeRetryable(...values) {
        for (const value of values.flat(Infinity)) {
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
        if (new URL(input).protocol === "file:") {
            return fetch(input, init);
        }
        const requestHeaders = new Headers(init?.headers);
        if (!requestHeaders.has("User-Agent") && this.#userAgent.length > 0) {
            requestHeaders.set("User-Agent", this.#userAgent);
        }
        const requestRedirectControl = init?.redirect === "follow" && this.#redirect.maximum !== Infinity;
        let requestSignal = init?.signal ?? undefined;
        if (typeof requestSignal === "undefined" && this.#timeout !== Infinity) {
            requestSignal = AbortSignal.timeout(this.#timeout);
        }
        let requestFetchInput = input;
        const requestFetchInit = {
            ...init,
            headers: requestHeaders,
            redirect: requestRedirectControl ? "manual" : init?.redirect,
            signal: requestSignal
        };
        let redirects = 0;
        let retries = 0;
        let response;
        do {
            response = await fetch(requestFetchInput, requestFetchInit);
            if (response.status === 304) {
                break;
            }
            if (requestRedirectControl && httpStatusCodesRedirectable.includes(response.status)) {
                if (redirects >= this.#redirect.maximum) {
                    break;
                }
                const redirectURL = response.headers.get("Location");
                if (redirectURL === null) {
                    break;
                }
                redirects += 1;
                try {
                    requestFetchInput = new URL(redirectURL, input);
                }
                catch {
                    break;
                }
                const delayTime = resolveDelayTime(this.#redirect.delay);
                if (typeof this.#redirect.onEvent !== "undefined") {
                    void this.#redirect.onEvent({
                        countCurrent: redirects,
                        countMaximum: this.#redirect.maximum,
                        redirectAfter: delayTime,
                        redirectURL: new URL(requestFetchInput),
                        statusCode: response.status,
                        statusText: response.statusText
                    });
                }
                await setDelay(delayTime, requestSignal);
                continue;
            }
            if (response.ok ||
                retries >= this.#retry.maximum ||
                !this.#httpStatusCodesRetryable.has(response.status)) {
                break;
            }
            retries += 1;
            let delayTime;
            try {
                delayTime = new HTTPHeaderRetryAfter(response).getRemainTimeMilliseconds();
            }
            catch {
                delayTime = resolveDelayTime(this.#retry.delay);
            }
            if (typeof this.#retry.onEvent !== "undefined") {
                void this.#retry.onEvent({
                    countCurrent: retries,
                    countMaximum: this.#retry.maximum,
                    retryAfter: delayTime,
                    retryURL: new URL(requestFetchInput),
                    statusCode: response.status,
                    statusText: response.statusText
                });
            }
            await setDelay(delayTime, requestSignal);
        } while (retries <= this.#retry.maximum);
        return response;
    }
    /**
     * Fetch paginate resources from the network.
     *
     * IMPORTANT: Only support URL paginate.
     * @param {string | URL} input URL of the first page of the resources.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
     * @param {ExFetchPaginateOptions} [optionsOverride={}] Options.
     * @returns {Promise<Response[]>} Responses.
     */
    async fetchPaginate(input, init, optionsOverride = {}) {
        const options = resolvePaginateOptions("optionsOverride", optionsOverride, this.#paginate);
        const responses = [];
        for (let page = 1, uri = new URL(input); page <= options.maximum && typeof uri !== "undefined" && uri !== null; page += 1) {
            if (page > 1) {
                const delayTime = resolveDelayTime(options.delay);
                if (typeof options.onEvent !== "undefined") {
                    void options.onEvent({
                        countCurrent: page,
                        countMaximum: options.maximum,
                        paginateAfter: delayTime,
                        paginateURL: new URL(uri)
                    });
                }
                await setDelay(delayTime, init?.signal ?? undefined);
            }
            const uriLookUp = uri;
            uri = undefined;
            const response = await this.fetch(uriLookUp, init);
            responses.push(response);
            if (response.ok) {
                let responseHeaderLink;
                try {
                    responseHeaderLink = HTTPHeaderLink.parse(response);
                }
                catch (error) {
                    if (options.throwOnInvalidHeaderLink) {
                        throw new SyntaxError(`[${uriLookUp.toString()}] ${error?.message ?? error}`);
                    }
                }
                if (typeof responseHeaderLink !== "undefined") {
                    uri = options.linkUpNextPage({
                        currentHeaderLink: responseHeaderLink,
                        currentURL: uriLookUp
                    });
                }
            }
        }
        return responses;
    }
    /**
     * Fetch a resource from the network.
     * @param {string | URL} input URL of the resource.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
     * @param {ExFetchOptions} [options={}] Options.
     * @returns {Promise<Response>} Response.
     */
    static fetch(input, init, options = {}) {
        return new this(options).fetch(input, init);
    }
    /**
     * Fetch paginate resources from the network.
     *
     * IMPORTANT: Only support URL paginate.
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
 * Fetch a resource from the network.
 * @param {string | URL} input URL of the resource.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response>} Response.
 */
export function exFetch(input, init, options = {}) {
    return new ExFetch(options).fetch(input, init);
}
/**
 * Fetch paginate resources from the network.
 *
 * IMPORTANT: Only support URL paginate.
 * @param {string | URL} input URL of the first page of the resources.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response[]>} Responses.
 */
export function exFetchPaginate(input, init, options = {}) {
    return new ExFetch(options).fetchPaginate(input, init);
}
