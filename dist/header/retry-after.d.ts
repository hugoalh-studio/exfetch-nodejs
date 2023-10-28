/**
 * Parse HTTP header `Retry-After`.
 */
export declare class HTTPHeaderRetryAfter {
    #private;
    /**
     * @param {number | string | Date | Headers | HTTPHeaderRetryAfter | Response} value
     */
    constructor(value: number | string | Date | Headers | HTTPHeaderRetryAfter | Response);
    /**
     * Get `Date`.
     * @returns {Date}
     */
    getDate(): Date;
    /**
     * Get remain time in milliseconds.
     * @returns {number} Remain time in milliseconds.
     */
    getRemainTimeMilliseconds(): number;
    /**
     * Get remain time in seconds.
     * @returns {number} Remain time in seconds.
     */
    getRemainTimeSeconds(): number;
}
export default HTTPHeaderRetryAfter;
//# sourceMappingURL=retry-after.d.ts.map