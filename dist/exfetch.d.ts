/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "node:events";
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
 * exFetch event name.
 */
export type ExFetchEventName = "retry";
/**
 * exFetch event "Retry" parameters.
 */
export interface ExFetchEventOnRetryParameters {
    /**
     * Current attempt, begin from `1`.
     */
    attemptCurrent: number;
    /**
     * Maximum amount of attempts.
     */
    attempts: number;
    /**
     * Will retry again after this amount of time, by milliseconds.
     */
    retryAfter: number;
    /**
     * Current response status code.
     */
    statusCode: Response["status"];
    /**
     * Current response status text.
     */
    statusText: Response["statusText"];
}
/**
 * exFetch event options.
 */
export interface ExFetchEventOptions {
    retry?: (param: ExFetchEventOnRetryParameters) => void;
}
/**
 * @access private
 */
interface ExFetchIntervalStatus {
    /**
     * Whether to increment minimum interval time per attempt/retry interval (always disable for other types of interval).
     * @default true
     */
    increment: boolean;
    /**
     * Maximum time per interval, by milliseconds.
     * @default 60000 // 60 seconds / 1 minute
     */
    maximum: number;
    /**
     * Minimum time per interval, by milliseconds.
     * @default 1000 // 1 second
     */
    minimum: number;
}
/**
 * exFetch interval options.
 */
export interface ExFetchIntervalOptions extends Partial<ExFetchIntervalStatus> {
    /** @alias maximum */ max?: this["maximum"];
    /** @alias minimum */ min?: this["minimum"];
}
/**
 * @access private
 */
interface ExFetchPaginateStatus {
    /**
     * Maximum amount of pages to fetch.
     * @default Infinity // Unlimited
     */
    amount: number;
    /**
     * Custom function for correctly link up to the next page, useful for the endpoints which not correctly return an absolute or relative URL.
     * @param {URL} currentURL URL of the current page.
     * @param {HTTPHeaderLink} currentHeaderLink Header link of the current page.
     * @returns {URL} URL of the next page.
     */
    linkUpNextPage?: (currentURL: URL, currentHeaderLink: HTTPHeaderLink) => URL;
    /**
     * Amount of time to interval/pause between pages resource request, by milliseconds.
     * @default {}
     */
    interval: ExFetchIntervalStatus;
    /**
     * Whether to throw an error when the latest page response provide an invalid HTTP header `Link`.
     * @default true
     */
    throwOnInvalidHeaderLink: boolean;
}
/**
 * exFetch paginate options.
 */
export interface ExFetchPaginateOptions extends Partial<Omit<ExFetchPaginateStatus, "interval">> {
    /**
     * Amount of time to interval/pause between pages resource request, by milliseconds.
     * @default 0
     */
    interval?: number | Omit<ExFetchIntervalOptions, "increment">;
    /** @alias amount */ count?: this["amount"];
    /** @alias amount */ limit?: this["amount"];
    /** @alias interval */ pause?: this["interval"];
}
/**
 * @access private
 */
interface ExFetchRetryStatus {
    /**
     * Maximum amount of attempts until failure.
     * @default 4
     */
    attempts: number;
    /**
     * Amount of time to delay/interval/pause between attempts, by milliseconds. This only apply when the endpoint have not provide any retry information in the response.
     * @default {}
     */
    interval: ExFetchIntervalStatus;
}
/**
 * exFetch retry options.
 */
export interface ExFetchRetryOptions extends Partial<Omit<ExFetchRetryStatus, "interval">> {
    /**
     * Amount of time to delay/interval/pause between attempts, by milliseconds. This only apply when the endpoint have not provide any retry information in the response.
     * @default {}
     */
    interval?: number | ExFetchIntervalOptions;
    /** @alias attempts */ attemptsMax?: this["attempts"];
    /** @alias attempts */ attemptsMaximum?: this["attempts"];
    /** @alias attempts */ maxAttempts?: this["attempts"];
    /** @alias attempts */ maximumAttempts?: this["attempts"];
    /** @alias interval */ delay?: this["interval"];
    /** @alias interval */ pause?: this["interval"];
}
/**
 * exFetch options.
 */
export interface ExFetchOptions {
    /**
     * Catch up events:
     *
     * - `"retry"`
     * @default undefined
     */
    event?: EventEmitter | ExFetchEventOptions;
    /**
     * Custom HTTP status codes that retryable.
     *
     * WARNING: This will override the default when defined; To add and/or delete some of the HTTP status codes, use methods `addHTTPStatusCodesRetryable` and/or `deleteHTTPStatusCodesRetryable` instead.
     * @default undefined
     */
    httpStatusCodesRetryable?: number[] | Set<number>;
    /**
     * Paginate options.
     * @default {}
     */
    paginate?: ExFetchPaginateOptions;
    /**
     * Retry options.
     * @default {}
     */
    retry?: ExFetchRetryOptions;
    /**
     * Timeout of the request (include retries), by milliseconds. This only apply when have not provide `AbortSignal` in the request.
     * @default Infinity // (Disable)
     */
    timeout?: number;
    /**
     * Custom HTTP header `User-Agent`.
     * @default `NodeJS/${process.versions.node}-${process.platform}-${process.arch} exFetch/${ExFetch.version}`.
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
     * Add HTTP status codes that retryable.
     * @param {...number} values Values.
     * @returns {this}
     */
    addHTTPStatusCodesRetryable(...values: number[]): this;
    /**
     * Delete HTTP status codes that not retryable.
     * @param {...number} values Values.
     * @returns {this}
     */
    deleteHTTPStatusCodesRetryable(...values: number[]): this;
    /**
     * Fetch a resource from the network with extend features.
     * @param {string | URL} input URL of the resource.
     * @param {Parameters<typeof fetch>[1]} [init] Custom setting that apply to the request.
     * @returns {Promise<Response>} Response.
     */
    fetch(input: string | URL, init?: Parameters<typeof fetch>[1]): Promise<Response>;
    /**
     * Fetch paginate resources from the network with retry attempts; Not support GraphQL.
     * @param {string | URL} input URL of the first page of the resources.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
     * @param {ExFetchPaginateOptions} [optionsOverride={}] Options.
     * @returns {Promise<Response[]>} Responses.
     */
    fetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], optionsOverride?: ExFetchPaginateOptions): Promise<Response[]>;
    /**
     * Fetch a resource from the network with retry attempts.
     * @param {string | URL} input URL of the resource.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
     * @param {ExFetchOptions} [options={}] Options.
     * @returns {Promise<Response>} Response.
     */
    static fetch(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response>;
    /**
     * Fetch paginate resources from the network with retry attempts; Not support GraphQL.
     * @param {string | URL} input URL of the first page of the resources.
     * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
     * @param {ExFetchOptions} [options={}] Options.
     * @returns {Promise<Response[]>} Responses.
     */
    static fetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response[]>;
}
export default ExFetch;
/**
 * Fetch a resource from the network with retry attempts.
 * @param {string | URL} input URL of the resource.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to the request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response>} Response.
 */
export declare function exFetch(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response>;
/**
 * Fetch paginate resources from the network with retry attempts; Not support GraphQL.
 * @param {string | URL} input URL of the first page of the resources.
 * @param {Parameters<typeof fetch>[1]} init Custom setting that apply to each request.
 * @param {ExFetchOptions} [options={}] Options.
 * @returns {Promise<Response[]>} Responses.
 */
export declare function exFetchPaginate(input: string | URL, init?: Parameters<typeof fetch>[1], options?: ExFetchOptions): Promise<Response[]>;
//# sourceMappingURL=exfetch.d.ts.map