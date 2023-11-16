/**
 * HTTP header `Link` entry.
 */
export type HTTPHeaderLinkEntry = [
    uri: string,
    parameters: {
        [key: string]: string;
    }
];
/**
 * Handle HTTP header `Link` according to RFC 8288 standard.
 */
export declare class HTTPHeaderLink {
    #private;
    /**
     * @param {string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response} [value]
     */
    constructor(value?: string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response);
    /**
     * Add entries.
     * @param {string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response} value Entries.
     * @returns {this}
     */
    add(value: string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response): this;
    /**
     * Return all of the entries.
     * @returns {HTTPHeaderLinkEntry[]} Entries.
     */
    entries(): HTTPHeaderLinkEntry[];
    /**
     * Get entries by parameter.
     * @param {string} key Key of the parameter.
     * @param {string} value Value of the parameter.
     * @returns {HTTPHeaderLinkEntry[]} Entries.
     */
    getByParameter(key: string, value: string): HTTPHeaderLinkEntry[];
    /**
     * Get entries by parameter `rel`.
     * @param {string} value Value of the parameter `rel`.
     * @returns {HTTPHeaderLinkEntry[]} Entries.
     */
    getByRel(value: string): HTTPHeaderLinkEntry[];
    /**
     * Whether have entries that match parameter.
     * @param {string} key Key of the parameter.
     * @param {string} value Value of the parameter.
     * @returns {boolean} Result.
     */
    hasParameter(key: string, value: string): boolean;
    /**
     * Stringify entries.
     * @returns {string} Stringified entries.
     */
    toString(): string;
    /**
     * Parse HTTP header `Link` according to RFC 8288 standard.
     * @param {string | Headers | HTTPHeaderLink | Response} value
     * @returns {HTTPHeaderLink}
     */
    static parse(value: string | Headers | HTTPHeaderLink | Response): HTTPHeaderLink;
    /**
     * Stringify as HTTP header `Link` according to RFC 8288 standard.
     * @param {HTTPHeaderLinkEntry[]} value
     * @returns {string}
     */
    static stringify(value: HTTPHeaderLinkEntry[]): string;
}
export default HTTPHeaderLink;
//# sourceMappingURL=link.d.ts.map