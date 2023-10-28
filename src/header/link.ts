import { isStringCaseLower } from "@hugoalh/advanced-determine/string/is-case-lower";
const httpHeaderLinkParametersNeedLowerCase: Set<string> = new Set<string>([
	"rel",
	"type"
]);
/**
 * Check URI.
 * @access private
 * @param {string} uri
 * @returns {void}
 */
function checkURI(uri: string): void {
	if (/\r?\n|\s|\t/u.test(uri)) {
		throw new SyntaxError(`Whitespace characters are not allow in URI!`);
	}
}
/**
 * Cursor whitespace skipper.
 * @access private
 * @param {string} value
 * @param {number} cursor
 * @returns {number} Number of moves.
 */
function cursorWhitespaceSkipper(value: string, cursor: number): number {
	const valueAfterCursor: string = value.slice(cursor);
	return (valueAfterCursor.length - valueAfterCursor.trimStart().length);
}
/**
 * HTTP header `Link` entry.
 */
export type HTTPHeaderLinkEntry = [
	uri: string,
	parameters: Record<string, string>
];
/**
 * Parse and stringify as HTTP header `Link` according to RFC 8288 standard.
 */
export class HTTPHeaderLink {
	#entries: HTTPHeaderLinkEntry[] = [];
	/**
	 * @param {string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response} [value]
	 */
	constructor(value?: string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response) {
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
	#parse(value: string): void {
		if (value.length === 0) {
			return;
		}
		const valueResolve: string = value.replace(/[\uFEFF\u00A0]/gu, "");// Remove unicode characters of BOM (Byte Order Mark) and no-break space.
		for (let cursor = 0; cursor < valueResolve.length; cursor += 1) {
			cursor += cursorWhitespaceSkipper(valueResolve, cursor);
			if (valueResolve.charAt(cursor) !== "<") {
				throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect character "<"!`);
			}
			cursor += 1;
			const cursorEndURI: number = valueResolve.indexOf(">", cursor);
			if (cursorEndURI === -1) {
				throw new SyntaxError(`Missing end of URI delimiter character ">" after position ${cursor}!`);
			}
			if (cursorEndURI === cursor) {
				throw new SyntaxError(`Missing URI at position ${cursor}!`);
			}
			const uriSlice: string = valueResolve.slice(cursor, cursorEndURI);
			checkURI(uriSlice);
			const uri: HTTPHeaderLinkEntry[0] = decodeURI(uriSlice);
			const parameters: HTTPHeaderLinkEntry[1] = {};
			cursor = cursorEndURI + 1;
			cursor += cursorWhitespaceSkipper(valueResolve, cursor);
			if (
				cursor === valueResolve.length ||
				valueResolve.charAt(cursor) === ","
			) {
				this.#entries.push([uri, parameters]);
				continue;
			}
			if (valueResolve.charAt(cursor) !== ";") {
				throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect character ";"!`);
			}
			cursor += 1;
			while (cursor < valueResolve.length) {
				cursor += cursorWhitespaceSkipper(valueResolve, cursor);
				const parameterName: string | undefined = valueResolve.slice(cursor).match(/^[\w-]+\*?/u)?.[0].toLowerCase();
				if (typeof parameterName === "undefined") {
					throw new SyntaxError(`Unexpected character "${valueResolve.charAt(cursor)}" at position ${cursor}; Expect a valid parameter name!`);
				}
				cursor += parameterName.length;
				cursor += cursorWhitespaceSkipper(valueResolve, cursor);
				if (
					cursor === valueResolve.length ||
					valueResolve.charAt(cursor) === ","
				) {
					parameters[parameterName] = "";
					break;
				}
				if (valueResolve.charAt(cursor) === ";") {
					parameters[parameterName] = "";
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
				} else {
					const cursorDiffParameterValue: number = valueResolve.slice(cursor).search(/[\s;,]/u);
					if (cursorDiffParameterValue === -1) {
						parameterValue += valueResolve.slice(cursor);
						cursor += parameterValue.length;
					} else {
						parameterValue += valueResolve.slice(cursor, cursorDiffParameterValue);
						cursor += cursorDiffParameterValue;
					}
				}
				parameters[parameterName] = httpHeaderLinkParametersNeedLowerCase.has(parameterName) ? parameterValue.toLowerCase() : parameterValue;
				cursor += cursorWhitespaceSkipper(valueResolve, cursor);
				if (
					cursor === valueResolve.length ||
					valueResolve.charAt(cursor) === ","
				) {
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
	add(value: string | Headers | HTTPHeaderLink | HTTPHeaderLinkEntry[] | Response): this {
		if (value instanceof Headers) {
			this.#parse(value.get("Link") ?? "");
		} else if (value instanceof HTTPHeaderLink) {
			this.#entries.push(...value.#entries);
		} else if (Array.isArray(value)) {
			for (const entry of value) {
				const [uri, parameters] = entry;
				checkURI(uri);
				Object.entries(parameters).forEach(([parameterName, parameterValue]: [string, string]) => {
					if (
						!isStringCaseLower(parameterName) ||
						!(/^[\w-]+\*?$/u.test(parameterName))
					) {
						throw new SyntaxError(`\`${parameterName}\` is not a valid parameter name!`);
					}
					if (httpHeaderLinkParametersNeedLowerCase.has(parameterName) && !isStringCaseLower(parameterValue)) {
						throw new SyntaxError(`\`${parameterValue}\` is not a valid parameter name!`);
					}
				});
				this.#entries.push([uri, { ...parameters }]);
			}
		} else if (value instanceof Response) {
			this.#parse(value.headers.get("Link") ?? "");
		} else {
			this.#parse(value);
		}
		return this;
	}
	/**
	 * Return all of the entries.
	 * @returns {HTTPHeaderLinkEntry[]} Entries.
	 */
	entries(): HTTPHeaderLinkEntry[] {
		return this.#entries;
	}
	/**
	 * Get entries by parameter.
	 * @param {string} name Name of the parameter.
	 * @param {string} value Value of the parameter.
	 * @returns {HTTPHeaderLinkEntry[]} Entries.
	 */
	getByParameter(name: string, value: string): HTTPHeaderLinkEntry[] {
		if (!isStringCaseLower(name)) {
			throw new SyntaxError(`\`${name}\` is not a valid parameter name!`);
		}
		if (name === "rel") {
			return this.getByRel(value);
		}
		return this.#entries.filter((entry: HTTPHeaderLinkEntry): boolean => {
			return (entry[1][name] === value);
		});
	}
	/**
	 * Get entries by parameter `rel`.
	 * @param {string} value Value of the parameter `rel`.
	 * @returns {HTTPHeaderLinkEntry[]} Entries.
	 */
	getByRel(value: string): HTTPHeaderLinkEntry[] {
		if (!isStringCaseLower(value)) {
			throw new SyntaxError(`\`${value}\` is not a valid parameter \`rel\` value!`);
		}
		return this.#entries.filter((entity: HTTPHeaderLinkEntry): boolean => {
			return (entity[1].rel?.toLowerCase() === value);
		});
	}
	/**
	 * Whether have entries that match parameter.
	 * @param {string} name Name of the parameter.
	 * @param {string} value Value of the parameter.
	 * @returns {boolean} Result.
	 */
	hasParameter(name: string, value: string): boolean {
		return (this.getByParameter(name, value).length > 0);
	}
	/**
	 * Stringify entries.
	 * @returns {string} Stringified entries.
	 */
	toString(): string {
		return this.#entries.map((entry: HTTPHeaderLinkEntry): string => {
			const [uri, parameters] = entry;
			let result = `<${encodeURI(uri)}>`;
			for (const [name, value] of Object.entries(parameters)) {
				result += (value.length > 0) ? `; ${name}="${value.replace(/"/g, "\\\"")}"` : `; ${name}`;
			}
			return result;
		}).join(", ");
	}
	/**
	 * Parse HTTP header `Link` according to RFC 8288 standard.
	 * @param {string | Headers | HTTPHeaderLink | Response} value
	 * @returns {HTTPHeaderLink}
	 */
	static parse(value: string | Headers | HTTPHeaderLink | Response): HTTPHeaderLink {
		return new this(value);
	}
	/**
	 * Stringify as HTTP header `Link` according to RFC 8288 standard.
	 * @param {HTTPHeaderLinkEntry[]} value
	 * @returns {string}
	 */
	static stringify(value: HTTPHeaderLinkEntry[]): string {
		return new this(value).toString();
	}
}
export default HTTPHeaderLink;
