/** Semaphore interface */
interface Semaphore {
    /** Returns a promise that resolves when access is acquired */
    acquire(): Promise<void>;
    /** Release access to the semaphore */
    release(): void;
    /** Returns the total number of tasks active or waiting for access */
    size(): number;
}
/**
 * Creates or retrieves existing semaphore with optional key and concurrency level.
 *
 * @param {any} [key=Symbol()] - Key used to identify the semaphore. Defaults to `Symbol()`.
 * @param {number} [concurrency=1] - Maximum concurrent tasks allowed access. Defaults to `1`.
 */
export declare let getSemaphore: (key?: any, concurrency?: number) => Semaphore;
export {};
