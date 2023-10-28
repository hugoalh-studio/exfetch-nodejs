export interface DelayOptions {
    /** Signal used to abort the delay. */
    signal?: AbortSignal;
}
/**
 * Resolve a Promise after a given amount of milliseconds.
 */
export declare function delay(ms: number, options?: DelayOptions): Promise<void>;
//# sourceMappingURL=delay.d.ts.map