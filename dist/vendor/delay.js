// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Resolve a Promise after a given amount of milliseconds.
 */
export function delay(ms, options = {}) {
    const { signal } = options;
    if (signal?.aborted)
        return Promise.reject(signal.reason);
    return new Promise((resolve, reject) => {
        const abort = () => {
            clearTimeout(i);
            reject(signal?.reason);
        };
        const done = () => {
            signal?.removeEventListener("abort", abort);
            resolve();
        };
        const i = setTimeout(done, ms);
        signal?.addEventListener("abort", abort, { once: true });
    });
}
