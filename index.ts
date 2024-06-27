/** List node */
type Node = {
	/** resolve promise */
	res: (value: void | PromiseLike<void>) => void
	/** next node pointer */
	next?: Node
}

/** Semaphore interface */
interface Semaphore {
	/** Returns a promise that resolves when access is acquired */
	acquire(): Promise<void>
	/** Release access to the semaphore */
	release(): void
	/** Returns the total number of tasks active or waiting for access */
	size(): number
}

/** Holds active semaphores by key */
let semaphoreMap = new Map() as Map<any, Semaphore>

/**
 * Creates or retrieves existing semaphore with optional key and concurrency level.
 *
 * @param {any} [key=Symbol()] - Key used to identify the semaphore. Defaults to `Symbol()`.
 * @param {number} [concurrency=1] - Maximum concurrent tasks allowed access. Defaults to `1`.
 */
export let getSemaphore = (key: any = Symbol(), concurrency = 1): Semaphore => {
	// return saved semaphore if exists
	if (semaphoreMap.has(key)) {
		return semaphoreMap.get(key) as Semaphore
	}

	let size = 0
	let head: Node | undefined
	let tail: Node | undefined

	let createPromise = (res: (value: void | PromiseLike<void>) => void) => {
		if (head) {
			tail = tail!.next = { res }
		} else {
			tail = head = { res }
		}
	}

	let semaphore = {
		acquire: () => {
			if (++size <= concurrency) {
				return Promise.resolve()
			}
			return new Promise(createPromise)
		},
		release() {
			head?.res()
			head = head?.next
			// make sure size is not negative
			if (size && !--size) {
				semaphoreMap.delete(key)
			}
		},
		size: () => size,
	}

	semaphoreMap.set(key, semaphore)
	return semaphore
}
