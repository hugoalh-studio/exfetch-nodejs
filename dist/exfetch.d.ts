import { HTTPHeaderLink } from "./header/link.js";
/**
 * exFetch HTTP status codes that retryable.
 */
export declare const httpStatusCodesRetryable: readonly number[];
/**
 * exFetch default user agent.
 */
export declare const userAgentDefault: string;
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
    /** @alias maximum */ max?: this["maximum"];
    /** @alias minimum */ min?: this["minimum"];
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
 * Extend `fetch`.
 */
export declare class ExFetch {
    #private;
    /**
     * Create a new extend `fetch` instance.
     * @param {ExFetchOptions} [options={}] Options.
     */
    constructor(options?: ExFetchOptions);
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
    /**
     * Fetch a resource from the network with extend features.
     * @param {string | URL} input URL of the resource.
     * @param {Parameters<typeof fetch>[1]} [init] Custom setting that apply to the request.
     * @returns {Promise<Response>} Response.
     */
    fetch(input: string | URL, init?: Parameters<typeof fetch>[1]): Promise<Response>;
    /**
     * Fetch paginate resources from the network.
     *
     * IMPORTANT: Only support URL paginate.
     * @param {string | URL} input URL of the first page of the resources.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
     * @param {ExFetchPaginateOptions} [optionsOverride={}] Options.
     * @returns {Promise<Response[]>} Responses.
     */
    fetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], optionsOverride?: ExFetchPaginateOptions): Promise<Response[]>;
    /**
     * Fetch a resource from the network.
     * @param {string | URL} input URL of the resource.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
     * @param {ExFetchOptions} [options={}] Options.
     * @returns {Promise<Response>} Response.
     */
    static fetch(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response>;
    /**
     * Fetch paginate resources from the network.
     *
     * IMPORTANT: Only support URL paginate.
     * @param {string | URL} input URL of the first page of the resources.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
     * @param {ExFetchOptions} [options={}] Options.
     * @returns {Promise<Response[]>} Responses.
     */
    static fetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response[]>;
}
export default ExFetch;
/**
 * Fetch a resource from the network.
 * @param {string | URL} input URL of the resource.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response>} Response.
 */
export declare function exFetch(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response>;
/**
 * Fetch paginate resources from the network.
 *
 * IMPORTANT: Only support URL paginate.
 * @param {string | URL} input URL of the first page of the resources.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response[]>} Responses.
 */
export declare function exFetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response[]>;
//# sourceMappingURL=exfetch.d.ts.map