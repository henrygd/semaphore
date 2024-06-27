[size-image]: https://img.shields.io/github/size/henrygd/semaphore/dist/index.min.js?style=flat
[license-image]: https://img.shields.io/github/license/henrygd/bigger-picture?style=flat&color=%2349ac0c
[license-url]: /LICENSE

# @henrygd/semaphore

[![File Size][size-image]](https://github.com/henrygd/semaphore/blob/main/dist/index.min.js) [![MIT license][license-image]][license-url] [![JSR Score 100%](https://jsr.io/badges/@henrygd/semaphore/score)](https://jsr.io/@henrygd/semaphore)

The fastest javascript inline semaphores and mutexes. See [comparisons and benchmarks](#comparisons-and-benchmarks).

A semaphore is used to control access to a shared resource among multiple async tasks. For example: writing to a cache / database / file. It can also be used more generally to limit the number of concurrent executions of async jobs.

Works with: <img alt="browsers" title="This package works with browsers." height="16px" src="https://jsr.io/logos/browsers.svg" /> <img alt="Deno" title="This package works with Deno." height="16px" src="https://jsr.io/logos/deno.svg" /> <img alt="Node.js" title="This package works with Node.js" height="16px" src="https://jsr.io/logos/node.svg" /> <img alt="Cloudflare Workers" title="This package works with Cloudflare Workers." height="16px" src="https://jsr.io/logos/cloudflare-workers.svg" /> <img alt="Bun" title="This package works with Bun." height="16px" src="https://jsr.io/logos/bun.svg" />

## Usage

Create or retrieve a semaphore by calling the `getSemaphore` function with optional key and maximum concurrency.

```js
const sem = getSemaphore('key', 1)
```

Use the `acquire` and `release` methods to limit access.

```js
await sem.acquire()
// access here is limited to one task at a time
sem.release()
```

## Example

In this example, we'll use semaphores to prevent multiple requests to an API for the same resource.

The first calls to `fetchPokemon` will acquire access to the protected code. Subsequent calls will wait for the first to finish, then return the data from the cache.

We use a key to allow access based on the pokemon name. This allows immediate access to both `ditto` and `snorlax`, while queueing subsequent calls for the same name.

<!-- prettier-ignore -->
```js
import { getSemaphore } from '@henrygd/semaphore'

const cache = new Map()

for (let i = 0; i < 5; i++) {
    fetchPokemon('ditto')
    fetchPokemon('snorlax')
}

async function fetchPokemon(name) {
    // get semaphore with key based on name
    const sem = getSemaphore(name)
    // acquire access from the semaphore
    await sem.acquire()
    try {
        // return data from cache if available
        if (cache.has(name)) {
            console.log('Cache hit:', name)
            return cache.get(name)
        }
        // otherwise fetch from API
        console.warn('Fetching from API:', name)
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
        const json = await res.json()
        cache.set(name, json)
        return json
    } finally {
        // release access when done
        sem.release()
    }
}
```

## Interface

<!-- prettier-ignore -->
```ts
/**
 * Creates or retrieves existing semaphore with optional key and concurrency level.
 *
 * key - Key used to identify the semaphore. Defaults to `Symbol()`.
 * concurrency - Maximum concurrent tasks allowed access. Defaults to `1`.
 */
function getSemaphore(key?: any, concurrency?: number): Semaphore

interface Semaphore {
    /** Returns a promise that resolves when access is acquired */
    acquire(): Promise<void>
    /** Release access to the semaphore */
    release(): void
    /** Returns the total number of tasks active or waiting for access */
    size(): number
}
```

### Keys and persistence

Keyed semaphores are held in a `Map` and deleted from the `Map` once they've been acquired and fully released (no waiting tasks).

If you need to reuse the same semaphore even after deletion from the `Map`, use an persistent variable instead of calling `getSemaphore` again.

### Concurrency

Concurrency is set for each semaphore on first creation via `getSemaphore`. If you call `getSemaphore` again with the key for an active semaphore, the concurrency argument is ignored and the existing semaphore is returned.

## Comparisons and benchmarks

Note that we're looking at libraries which provide a promise-based locking mechanism. Not callback libraries.

| Library                                                                | Version | Bundle size (B) | Keys | Weekly Downloads |
| :--------------------------------------------------------------------- | :------ | :-------------- | :--- | :--------------- |
| @henrygd/semaphore                                                     | 0.0.1   | 267             | yes  | ¯\\\_(ツ)\_/¯    |
| [async-mutex](https://www.npmjs.com/package/async-mutex)               | 0.5.0   | 4,758           | no   | 1,639,071        |
| [async-sema](https://www.npmjs.com/package/async-sema)                 | 3.1.1   | 3,532           | no   | 1,258,877        |
| [await-semaphore](https://www.npmjs.com/package/await-semaphore)       | 0.1.3   | 1,184           | no   | 60,449           |
| [@shopify/semaphore](https://www.npmjs.com/package/@shopify/semaphore) | 3.1.0   | 604             | no   | 29,089           |

> If there's a library you'd like added to the table or benchmarks, please open an issue.

### Note on benchmarks

All libraries run the same test. Each operation sends 1,000 async functions to a binary semaphore to measure how quickly they pass through.

## Browser benchmark

Coming shortly.

## Node.js benchmark

![@henrygd/queue - 1.65x faster than async-sema. 2.62x async-mutex. 3.01x async-semaphore. 3.37x @shopify/semaphore.](https://henrygd-assets.b-cdn.net/semaphore/node-bench.png)

## Bun benchmark

![@henrygd/queue - 1.95x faster than async-semaphore 2.56x asynsc-mutex. 2.62x async-sema. 3.7x @shopify/semaphore.](https://henrygd-assets.b-cdn.net/semaphore/bun.png)

## Deno benchmark

![@henrygd/queue - 1.69x faster than async-sema. 2.61x async-semaphore. 2.75x async-mutex. 3.6x @shopify/semaphore.](https://henrygd-assets.b-cdn.net/semaphore/deno.png)

## Related

[`@henrygd/queue`](https://github.com/henrygd/queue) - Tiny async queue with concurrency control. Like p-limit or fastq, but smaller and faster.

## License

[MIT license](/LICENSE)
