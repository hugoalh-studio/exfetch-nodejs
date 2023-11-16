import { isStringCaseLower } from "@hugoalh/advanced-determine/string/is-case-lower";
import { isStringSingleLine } from "@hugoalh/advanced-determine/string/is-singleline";
const httpHeaderLinkParametersNeedLowerCase = new Set([
    "rel",
    "type"
]);
/**
 * Check URI.
 * @access private
 * @param {string} uri
 * @returns {void}
 */
function checkURI(uri) {
    if (!isStringSingleLine(uri) ||
        /[\s\t]/u.test(uri)) {
        throw new SyntaxError(`${uri} is not a valid URI!`);
    }
}
/**
 * Cursor whitespace skipper.
 * @access private
 * @param {string} value
 * @param {number} cursor
 * @returns {number} Number of moves.
 */
function cursorWhitespaceSkipper(value, cursor) {
    const valueAfterCursor = value.slice(cursor);
    return (valueAfterCursor.length - valueAfterCursor.trimStart().length);
}
/**
 * Handle HTTP header `Link` according to RFC 8288 standard.
 */
export class HTTPHeaderLink {
    #entries = [];
    /**
     * @param {string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response} [value]
     */
    constructor(value) {
        if (typeof value !== "undefined") {
            this.add(value);
        }
    }
    /**
     * Parse HTTP header `Link` from string.
     * @access private
     * @param {string} value
     * @returns {void}
     */
    #parse(value) {
        if (value.length === 0) {
            return;
        }
        const valueResolve = value.replace(/[\uFEFF\u00A0]/gu, ""); // Remove Unicode characters of BOM (Byte Order Mark) and no-break space.
        for (let cursor = 0; cursor < valueResolve.length; cursor += 1) {
            cursor += cursorWhitespaceSkipper(valueResolve, cursor);
            if (valueResolve.charAt(cursor) !== "<") {
                throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect character "<"!`);
            }
            cursor += 1;
            const cursorEndURI = valueResolve.indexOf(">", cursor);
            if (cursorEndURI === -1) {
                throw new SyntaxError(`Missing end of URI delimiter character ">" after position ${cursor}!`);
            }
            if (cursorEndURI === cursor) {
                throw new SyntaxError(`Missing URI at position ${cursor}!`);
            }
            const uriSlice = valueResolve.slice(cursor, cursorEndURI);
            checkURI(uriSlice);
            const uri = decodeURI(uriSlice);
            const parameters = {};
            cursor = cursorEndURI + 1;
            cursor += cursorWhitespaceSkipper(valueResolve, cursor);
            if (cursor === valueResolve.length ||
                valueResolve.charAt(cursor) === ",") {
                this.#entries.push([uri, parameters]);
                continue;
            }
            if (valueResolve.charAt(cursor) !== ";") {
                throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect character ";"!`);
            }
            cursor += 1;
            while (cursor < valueResolve.length) {
                cursor += cursorWhitespaceSkipper(valueResolve, cursor);
                const parameterKey = valueResolve.slice(cursor).match(/^[\w-]+\*?/u)?.[0].toLowerCase();
                if (typeof parameterKey === "undefined") {
                    throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect a valid parameter key!`);
                }
                cursor += parameterKey.length;
                cursor += cursorWhitespaceSkipper(valueResolve, cursor);
                if (cursor === valueResolve.length ||
                    valueResolve.charAt(cursor) === ",") {
                    parameters[parameterKey] = "";
                    break;
                }
                if (valueResolve.charAt(cursor) === ";") {
                    parameters[parameterKey] = "";
                    cursor += 1;
                    continue;
                }
                if (valueResolve.charAt(cursor) !== "=") {
                    throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect character "="!`);
                }
                cursor += 1;
                cursor += cursorWhitespaceSkipper(valueResolve, cursor);
                let parameterValue = "";
                if (valueResolve.charAt(cursor) === "\"") {
                    cursor += 1;
                    while (cursor < valueResolve.length) {
                        if (valueResolve.charAt(cursor) === "\"") {
                            cursor += 1;
                            break;
                        }
                        if (valueResolve.charAt(cursor) === "\\") {
                            cursor += 1;
                        }
                        parameterValue += valueResolve.charAt(cursor);
                        cursor += 1;
                    }
                }
                else {
                    const cursorDiffParameterValue = valueResolve.slice(cursor).search(/[\s;,]/u);
                    if (cursorDiffParameterValue === -1) {
                        parameterValue += valueResolve.slice(cursor);
                        cursor += parameterValue.length;
                    }
                    else {
                        parameterValue += valueResolve.slice(cursor, cursorDiffParameterValue);
                        cursor += cursorDiffParameterValue;
                    }
                }
                parameters[parameterKey] = httpHeaderLinkParametersNeedLowerCase.has(parameterKey) ? parameterValue.toLowerCase() : parameterValue;
                cursor += cursorWhitespaceSkipper(valueResolve, cursor);
                if (cursor === valueResolve.length ||
                    valueResolve.charAt(cursor) === ",") {
                    break;
                }
                if (valueResolve.charAt(cursor) === ";") {
                    cursor += 1;
                    continue;
                }
                throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect character ",", character ";", or end of the string!`);
            }
            this.#entries.push([uri, parameters]);
        }
    }
    /**
     * Add entries.
     * @param {string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response} value Entries.
     * @returns {this}
     */
    add(value) {
        if (value instanceof Headers) {
            this.#parse(value.get("Link") ?? "");
        }
        else if (value instanceof HTTPHeaderLink) {
            this.#entries.push(...value.#entries);
        }
        else if (Array.isArray(value)) {
            for (const entry of value) {
                const [uri, parameters] = entry;
                checkURI(uri);
                Object.entries(parameters).forEach(([parameterKey, parameterValue]) => {
                    if (!isStringCaseLower(parameterKey) ||
                        !(/^[\w-]+\*?$/u.test(parameterKey))) {
                        throw new SyntaxError(`\`${parameterKey}\` is not a valid parameter key!`);
                    }
                    if (httpHeaderLinkParametersNeedLowerCase.has(parameterKey) && !isStringCaseLower(parameterValue)) {
                        throw new SyntaxError(`\`${parameterValue}\` is not a valid parameter value!`);
                    }
                });
                this.#entries.push([uri, { ...parameters }]);
            }
        }
        else if (value instanceof Response) {
            this.#parse(value.headers.get("Link") ?? "");
        }
        else {
            this.#parse(value);
        }
        return this;
    }
    /**
     * Return all of the entries.
     * @returns {HTTPHeaderLinkEntry[]} Entries.
     */
    entries() {
        return this.#entries;
    }
    /**
     * Get entries by parameter.
     * @param {string} key Key of the parameter.
     * @param {string} value Value of the parameter.
     * @returns {HTTPHeaderLinkEntry[]} Entries.
     */
    getByParameter(key, value) {
        if (!isStringCaseLower(key)) {
            throw new SyntaxError(`\`${key}\` is not a valid parameter key!`);
        }
        if (key === "rel") {
            return this.getByRel(value);
        }
        return this.#entries.filter((entry) => {
            return (entry[1][key] === value);
        });
    }
    /**
     * Get entries by parameter `rel`.
     * @param {string} value Value of the parameter `rel`.
     * @returns {HTTPHeaderLinkEntry[]} Entries.
     */
    getByRel(value) {
        if (!isStringCaseLower(value)) {
            throw new SyntaxError(`\`${value}\` is not a valid parameter \`rel\` value!`);
        }
        return this.#entries.filter((entity) => {
            return (entity[1].rel?.toLowerCase() === value);
        });
    }
    /**
     * Whether have entries that match parameter.
     * @param {string} key Key of the parameter.
     * @param {string} value Value of the parameter.
     * @returns {boolean} Result.
     */
    hasParameter(key, value) {
        return (this.getByParameter(key, value).length > 0);
    }
    /**
     * Stringify entries.
     * @returns {string} Stringified entries.
     */
    toString() {
        return this.#entries.map((entry) => {
            const [uri, parameters] = entry;
            let result = `<${encodeURI(uri)}>`;
            for (const [key, value] of Object.entries(parameters)) {
                result += (value.length > 0) ? `; ${key}="${value.replace(/"/g, "\\\"")}"` : `; ${key}`;
            }
            return result;
        }).join(", ");
    }
    /**
     * Parse HTTP header `Link` according to RFC 8288 standard.
     * @param {string | Headers | HTTPHeaderLink | Response} value
     * @returns {HTTPHeaderLink}
     */
    static parse(value) {
        return new this(value);
    }
    /**
     * Stringify as HTTP header `Link` according to RFC 8288 standard.
     * @param {HTTPHeaderLinkEntry[]} value
     * @returns {string}
     */
    static stringify(value) {
        return new this(value).toString();
    }
}
export default HTTPHeaderLink;
