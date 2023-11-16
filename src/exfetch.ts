import { randomInt } from "node:crypto";
import { HTTPHeaderLink, type HTTPHeaderLinkEntry } from "./header/link.js";
import { HTTPHeaderRetryAfter } from "./header/retry-after.js";
/**
 * exFetch HTTP status codes that redirectable.
 */
const httpStatusCodesRedirectable: readonly number[] = Object.freeze([
	301,
	302,
	303,
	307,
	308
]);
/**
 * exFetch HTTP status codes that retryable.
 */
export const httpStatusCodesRetryable: readonly number[] = Object.freeze([
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
 * @access private
 */
interface ExFetchDelayOptionsInternal {
	/**
	 * Maximum time per delay, by milliseconds.
	 */
	maximum: number;
	/**
	 * Minimum time per delay, by milliseconds.
	 */
	minimum: number;
}
/**
 * exFetch delay options.
 */
export interface ExFetchDelayOptions extends Partial<ExFetchDelayOptionsInternal> {
	/** @alias maximum */max?: this["maximum"];
	/** @alias minimum */min?: this["minimum"];
}
/**
 * exFetch event common payload.
 * @access private
 */
interface ExFetchEventCommonPayload {
	/**
	 * Status code of the current response.
	 */
	statusCode: Response["status"];
	/**
	 * Status text of the current response.
	 */
	statusText: Response["statusText"];
}
/**
 * exFetch paginate event payload.
 */
export interface ExFetchEventPaginatePayload {
	/**
	 * Current count of the paginates, begin from `1`.
	 */
	countCurrent: number;
	/**
	 * Maximum number of the paginates allowed.
	 */
	countMaximum: number;
	/**
	 * Will paginate to the next page after this amount of time, by milliseconds.
	 */
	paginateAfter: number;
	/**
	 * Will paginate to this URL.
	 */
	paginateURL: URL;
}
/**
 * exFetch redirect event payload.
 */
export interface ExFetchEventRedirectPayload extends ExFetchEventCommonPayload {
	/**
	 * Current count of the redirects, begin from `1`.
	 */
	countCurrent: number;
	/**
	 * Maximum number of the redirects allowed.
	 */
	countMaximum: number;
	/**
	 * Will redirect after this amount of time, by milliseconds.
	 */
	redirectAfter: number;
	/**
	 * Will redirect to this URL.
	 */
	redirectURL: URL;
}
/**
 * exFetch retry event payload.
 */
export interface ExFetchEventRetryPayload extends ExFetchEventCommonPayload {
	/**
	 * Current count of the retries, begin from `1`.
	 */
	countCurrent: number;
	/**
	 * Maximum number of the retries allowed.
	 */
	countMaximum: number;
	/**
	 * Will retry after this amount of time, by milliseconds.
	 */
	retryAfter: number;
	/**
	 * Will retry this URL.
	 */
	retryURL: URL;
}
/**
 * exFetch paginate link up payload.
 */
export interface ExFetchPaginateLinkUpPayload {
	/**
	 * Header link of the current page.
	 */
	currentHeaderLink: HTTPHeaderLink;
	/**
	 * URL of the current page.
	 */
	currentURL: URL;
}
/**
 * @access private
 */
interface ExFetchPaginateOptionsInternal {
	/**
	 * Amount of time to delay between the paginates, by milliseconds.
	 */
	delay: ExFetchDelayOptionsInternal;
	/**
	 * Custom function for correctly link up to the next page, useful for the endpoints which not correctly return an absolute or relative URL.
	 * @param {ExFetchPaginateLinkUpPayload} param Link up payload of the paginate.
	 * @returns {URL | null | undefined} URL of the next page.
	 */
	linkUpNextPage: (param: ExFetchPaginateLinkUpPayload) => URL | null | undefined;
	/**
	 * Maximum amount of paginates to allow.
	 * @default Infinity // Unlimited
	 */
	maximum: number;
	/**
	 * Event listener for the paginates.
	 * @param {ExFetchEventPaginatePayload} param Event payload of the paginate.
	 * @returns {void}
	 */
	onEvent?: (param: ExFetchEventPaginatePayload) => void;
	/**
	 * Whether to throw an error when the latest page response provide an invalid HTTP header `Link`.
	 * @default true
	 */
	throwOnInvalidHeaderLink: boolean;
}
/**
 * exFetch paginate options.
 */
export interface ExFetchPaginateOptions extends Partial<Omit<ExFetchPaginateOptionsInternal, "delay">> {
	/**
	 * Amount of time to delay between the paginates, by milliseconds.
	 * @default 0
	 */
	delay?: number | ExFetchDelayOptions;
}
/**
 * @access private
 */
interface ExFetchRedirectOptionsInternal {
	/**
	 * Amount of time to delay between the redirects, by milliseconds.
	 */
	delay: ExFetchDelayOptionsInternal;
	/**
	 * Maximum amount of redirects to allow.
	 * @default Infinity
	 */
	maximum: number;
	/**
	 * Event listener for the redirects.
	 * @param {ExFetchEventRedirectPayload} param Event payload of the redirect.
	 * @returns {void}
	 */
	onEvent?: (param: ExFetchEventRedirectPayload) => void;
}
/**
 * exFetch redirect options.
 */
export interface ExFetchRedirectOptions extends Partial<Omit<ExFetchRedirectOptionsInternal, "delay">> {
	/**
	 * Amount of time to delay between the redirects, by milliseconds.
	 * @default 0
	 */
	delay?: number | ExFetchDelayOptions;
}
/**
 * @access private
 */
interface ExFetchRetryOptionsInternal {
	/**
	 * Amount of time to delay between the attempts, by milliseconds. This only apply when the endpoint have not provide any retry information in the response.
	 */
	delay: ExFetchDelayOptionsInternal;
	/**
	 * Maximum amount of attempts to allow.
	 * @default 4
	 */
	maximum: number;
	/**
	 * Event listener for the retries.
	 * @param {ExFetchEventRetryPayload} param Event payload of the retry.
	 * @returns {void}
	 */
	onEvent?: (param: ExFetchEventRetryPayload) => void;
}
/**
 * exFetch retry options.
 */
export interface ExFetchRetryOptions extends Partial<Omit<ExFetchRetryOptionsInternal, "delay">> {
	/**
	 * Amount of time to delay between the attempts, by milliseconds. This only apply when the endpoint have not provide any retry information in the response.
	 * @default
	 * {
	 *   maximum: 60000,
	 *   minimum: 1000
	 * }
	 */
	delay?: number | ExFetchDelayOptions;
}
/**
 * exFetch options.
 */
export interface ExFetchOptions {
	/**
	 * Custom HTTP status codes that retryable.
	 * 
	 * WARNING: This will override the default when defined; To add and/or delete some of the HTTP status codes, use methods `addHTTPStatusCodeRetryable` and/or `deleteHTTPStatusCodeRetryable` instead.
	 * @default undefined
	 */
	httpStatusCodesRetryable?: number[] | Set<number>;
	/**
	 * Paginate options.
	 */
	paginate?: ExFetchPaginateOptions;
	/**
	 * Redirect options. This only apply when define property `redirect` as `"follow"` in the request, and define property `maximum` in this option.
	 */
	redirect?: ExFetchRedirectOptions;
	/**
	 * Retry options.
	 */
	retry?: ExFetchRetryOptions;
	/**
	 * Timeout of the request (include the redirects and the retries), by milliseconds. This only apply when have not define property `signal` in the request.
	 * @default Infinity // Disable
	 */
	timeout?: number;
	/**
	 * Custom user agent. This only apply when have not define HTTP header `User-Agent` in the request.
	 * @default `Deno/${Deno.version.deno}-${Deno.build.target} exFetch/${ExFetch.version}`.
	 */
	userAgent?: string;
}
/**
 * Resolve delay options.
 * @access private
 * @param {string} prefix
 * @param {number | ExFetchDelayOptions} input
 * @param {ExFetchDelayOptionsInternal} original
 * @returns {ExFetchDelayOptionsInternal}
 */
function resolveDelayOptions(prefix: string, input: number | ExFetchDelayOptions, original: ExFetchDelayOptionsInternal): ExFetchDelayOptionsInternal {
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
	const optionsResolve: ExFetchDelayOptionsInternal = { ...original };
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
function resolveDelayTime({ maximum, minimum }: ExFetchDelayOptionsInternal): number {
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
function resolvePaginateOptions(prefix: string, input: ExFetchPaginateOptions, original: ExFetchPaginateOptionsInternal): ExFetchPaginateOptionsInternal {
	const optionsResolve: ExFetchPaginateOptionsInternal = { ...original };
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
function setDelay(value: number, signal?: AbortSignal | undefined): Promise<void> {
	if (value <= 0) {
		return Promise.resolve();
	}
	if (signal?.aborted) {
		return Promise.reject(signal.reason);
	}
	return new Promise((resolve, reject): void => {
		function abort(): void {
			clearTimeout(id);
			reject(signal?.reason);
		}
		function done(): void {
			signal?.removeEventListener("abort", abort);
			resolve();
		}
		const id: NodeJS.Timeout = setTimeout(done, value);
		signal?.addEventListener("abort", abort, { once: true });
	});
}
/**
 * Extend `fetch`.
 */
export class ExFetch {
	#httpStatusCodesRetryable: Set<number>;
	#paginate: ExFetchPaginateOptionsInternal = {
		delay: {
			maximum: 0,
			minimum: 0
		},
		linkUpNextPage: ({ currentHeaderLink, currentURL }: ExFetchPaginateLinkUpPayload): URL | null | undefined => {
			const currentHeaderLinkEntryNextPage: HTTPHeaderLinkEntry[] = currentHeaderLink.getByRel("next");
			if (currentHeaderLinkEntryNextPage.length > 0) {
				return new URL(currentHeaderLinkEntryNextPage[0][0], currentURL);
			}
			return;
		},
		maximum: Infinity,
		onEvent: undefined,
		throwOnInvalidHeaderLink: true
	};
	#redirect: ExFetchRedirectOptionsInternal = {
		delay: {
			maximum: 0,
			minimum: 0
		},
		maximum: Infinity,
		onEvent: undefined
	};
	#retry: ExFetchRetryOptionsInternal = {
		delay: {
			maximum: 60000,
			minimum: 1000
		},
		maximum: 4,
		onEvent: undefined
	};
	#timeout = Infinity;
	#userAgent: string = userAgentDefault;
	/**
	 * Create a new extend `fetch` instance.
	 * @param {ExFetchOptions} [options={}] Options.
	 */
	constructor(options: ExFetchOptions = {}) {
		this.#httpStatusCodesRetryable = new Set<number>((typeof options.httpStatusCodesRetryable === "undefined") ? httpStatusCodesRetryable : options.httpStatusCodesRetryable);
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
	/**
	 * Add HTTP status code that retryable.
	 * @param {number} value Value.
	 * @returns {this}
	 */
	addHTTPStatusCodeRetryable(value: number): this;
	/**
	 * Add HTTP status code that retryable.
	 * @param {number[]} values Values.
	 * @returns {this}
	 */
	addHTTPStatusCodeRetryable(values: number[]): this;
	/**
	 * Add HTTP status code that retryable.
	 * @param {...number} values Values.
	 * @returns {this}
	 */
	addHTTPStatusCodeRetryable(...values: number[]): this;
	addHTTPStatusCodeRetryable(...values: number[] | [number[]]): this {
		for (const value of values.flat(Infinity) as number[]) {
			this.#httpStatusCodesRetryable.add(value);
		}
		return this;
	}
	/**
	 * Delete HTTP status code that not retryable.
	 * @param {number} value Value.
	 * @returns {this}
	 */
	deleteHTTPStatusCodeRetryable(value: number): this;
	/**
	 * Delete HTTP status code that not retryable.
	 * @param {number[]} values Values.
	 * @returns {this}
	 */
	deleteHTTPStatusCodeRetryable(values: number[]): this;
	/**
	 * Delete HTTP status code that not retryable.
	 * @param {...number} values Values.
	 * @returns {this}
	 */
	deleteHTTPStatusCodeRetryable(...values: number[]): this;
	deleteHTTPStatusCodeRetryable(...values: number[] | [number[]]): this {
		for (const value of values.flat(Infinity) as number[]) {
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
	async fetch(input: string | URL, init?: Parameters<typeof fetch>[1]): Promise<Response> {
		if (new URL(input).protocol === "file:") {
			return fetch(input, init);
		}
		const requestHeaders: Headers = new Headers(init?.headers);
		if (!requestHeaders.has("User-Agent") && this.#userAgent.length > 0) {
			requestHeaders.set("User-Agent", this.#userAgent);
		}
		const requestRedirectControl: boolean = init?.redirect === "follow" && this.#redirect.maximum !== Infinity;
		let requestSignal: AbortSignal | undefined = init?.signal ?? undefined;
		if (typeof requestSignal === "undefined" && this.#timeout !== Infinity) {
			requestSignal = AbortSignal.timeout(this.#timeout);
		}
		let requestFetchInput: string | URL = input;
		const requestFetchInit: RequestInit = {
			...init,
			headers: requestHeaders,
			redirect: requestRedirectControl ? "manual" : init?.redirect,
			signal: requestSignal
		};
		let redirects = 0;
		let retries = 0;
		let response: Response;
		do {
			response = await fetch(requestFetchInput, requestFetchInit);
			if (response.status === 304) {
				break;
			}
			if (requestRedirectControl && httpStatusCodesRedirectable.includes(response.status)) {
				if (redirects >= this.#redirect.maximum) {
					break;
				}
				const redirectURL: string | null = response.headers.get("Location");
				if (redirectURL === null) {
					break;
				}
				redirects += 1;
				try {
					requestFetchInput = new URL(redirectURL, input);
				} catch {
					break;
				}
				const delayTime: number = resolveDelayTime(this.#redirect.delay);
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
			if (
				response.ok ||
				retries >= this.#retry.maximum ||
				!this.#httpStatusCodesRetryable.has(response.status)
			) {
				break;
			}
			retries += 1;
			let delayTime: number;
			try {
				delayTime = new HTTPHeaderRetryAfter(response).getRemainTimeMilliseconds();
			} catch {
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
	async fetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], optionsOverride: ExFetchPaginateOptions = {}): Promise<Response[]> {
		const options: ExFetchPaginateOptionsInternal = resolvePaginateOptions("optionsOverride", optionsOverride, this.#paginate);
		const responses: Response[] = [];
		for (let page = 1, uri: URL | null | undefined = new URL(input); page <= options.maximum && typeof uri !== "undefined" && uri !== null; page += 1) {
			if (page > 1) {
				const delayTime: number = resolveDelayTime(options.delay);
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
			const uriLookUp: URL = uri;
			uri = undefined;
			const response: Response = await this.fetch(uriLookUp, init);
			responses.push(response);
			if (response.ok) {
				let responseHeaderLink: HTTPHeaderLink;
				try {
					responseHeaderLink = HTTPHeaderLink.parse(response);
				} catch (error) {
					if (options.throwOnInvalidHeaderLink) {
						throw new SyntaxError(`[${uriLookUp.toString()}] ${error?.message ?? error}`);
					}
				}
				if (typeof responseHeaderLink! !== "undefined") {
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
	static fetch(input: string | URL, init?: Parameters<typeof fetch>[1], options: ExFetchOptions = {}): Promise<Response> {
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
	static fetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], options: ExFetchOptions = {}): Promise<Response[]> {
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
export function exFetch(input: string | URL, init?: Parameters<typeof fetch>[1], options: ExFetchOptions = {}): Promise<Response> {
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
export function exFetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], options: ExFetchOptions = {}): Promise<Response[]> {
	return new ExFetch(options).fetchPaginate(input, init);
}
