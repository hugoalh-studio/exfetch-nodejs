/**
 * Handle HTTP header `Retry-After` according to RFC 9110 standard.
 */
export class HTTPHeaderRetryAfter {
    #timestamp;
    /**
     * @param {number | string | Date | Headers | HTTPHeaderRetryAfter | Response} value
     */
    constructor(value) {
        if (typeof value === "number") {
            if (!(value >= 0)) {
                throw new RangeError(`Argument \`value\` is not a number which is positive!`);
            }
            this.#timestamp = new Date(Date.now() + value * 1000);
        }
        else if (value instanceof Date) {
            this.#timestamp = new Date(value);
        }
        else if (value instanceof HTTPHeaderRetryAfter) {
            this.#timestamp = new Date(value.#timestamp);
        }
        else {
            let valueRaw;
            if (value instanceof Headers) {
                valueRaw = value.get("Retry-After") ?? "";
            }
            else if (value instanceof Response) {
                valueRaw = value.headers.get("Retry-After") ?? "";
            }
            else {
                valueRaw = value;
            }
            if (/^[A-Z][a-z][a-z], \d\d [A-Z][a-z][a-z] \d\d\d\d \d\d:\d\d:\d\d GMT$/u.test(valueRaw)) {
                this.#timestamp = new Date(valueRaw);
            }
            else if (/^\d+$/u.test(valueRaw)) {
                this.#timestamp = new Date(Date.now() + Number(valueRaw) * 1000);
            }
            else {
                throw new SyntaxError(`\`${valueRaw}\` is not a valid HTTP header \`Retry-After\` syntax!`);
            }
        }
    }
    /**
     * Get `Date`.
     * @returns {Date}
     */
    getDate() {
        return this.#timestamp;
    }
    /**
     * Get remain time in milliseconds.
     * @returns {number} Remain time in milliseconds.
     */
    getRemainTimeMilliseconds() {
        const remainMilliseconds = this.#timestamp.valueOf() - Date.now();
        return ((remainMilliseconds >= 0) ? remainMilliseconds : 0);
    }
    /**
     * Get remain time in seconds.
     * @returns {number} Remain time in seconds.
     */
    getRemainTimeSeconds() {
        return (this.getRemainTimeMilliseconds() / 1000);
    }
}
export default HTTPHeaderRetryAfter;
