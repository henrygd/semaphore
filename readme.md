[size-image]: https://img.shields.io/github/size/henrygd/semaphore/dist/index.min.js?style=flat
[license-image]: https://img.shields.io/github/license/henrygd/semaphore?style=flat&color=%2349ac0c
[license-url]: /LICENSE

# @henrygd/semaphore

[![File Size][size-image]](https://github.com/henrygd/semaphore/blob/main/dist/index.min.js) [![MIT license][license-image]][license-url] [![JSR Score 100%](https://jsr.io/badges/@henrygd/semaphore/score?v1)](https://jsr.io/@henrygd/semaphore)

Fast inline semaphores and mutexes. See [comparisons and benchmarks](#comparisons-and-benchmarks).

Semaphores limit simultaneous access to code and resources (e.g. a file) among multiple concurrent tasks.

Works with: <img alt="browsers" title="This package works with browsers." height="16px" src="https://jsr.io/logos/browsers.svg" /> <img alt="Deno" title="This package works with Deno." height="16px" src="https://jsr.io/logos/deno.svg" /> <img alt="Node.js" title="This package works with Node.js" height="16px" src="https://jsr.io/logos/node.svg" /> <img alt="Cloudflare Workers" title="This package works with Cloudflare Workers." height="16px" src="https://jsr.io/logos/cloudflare-workers.svg" /> <img alt="Bun" title="This package works with Bun." height="16px" src="https://jsr.io/logos/bun.svg" />

## Usage

Create or retrieve a semaphore by calling `getSemaphore` with optional key and concurrency limit.

```js
const sem = getSemaphore('key', 1)
```

Use the `acquire` and `release` methods to limit access.

```js
await sem.acquire()
// access here is limited to one task at a time
sem.release()
```

## Full example

We use semaphores here to prevent multiple requests to an API for the same resource.

The first calls to `fetchPokemon` will acquire access to the protected code. Subsequent calls will wait, then return the data from the cache.

We use a key to allow access based on the name. This lets `ditto` and `snorlax` run simultaneously.

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

If you need to reuse the same semaphore even after deletion from the `Map`, use a persistent variable instead of calling `getSemaphore` again.

### Concurrency

Concurrency is set for each semaphore on first creation via `getSemaphore`. If called again using the key for an active semaphore, the concurrency argument is ignored and the existing semaphore is returned.

## Comparisons and benchmarks

Note that we're looking at libraries which provide a promise-based locking mechanism, not callbacks.

| Library                                                                | Version | Bundle size (B) | Keys | Weekly Downloads |
| :--------------------------------------------------------------------- | :------ | :-------------- | :--- | :--------------- |
| @henrygd/semaphore                                                     | 0.0.1   | 267             | yes  | ¯\\\_(ツ)\_/¯    |
| [async-mutex](https://www.npmjs.com/package/async-mutex)               | 0.5.0   | 4,758           | no   | 1,639,071        |
| [async-sema](https://www.npmjs.com/package/async-sema)                 | 3.1.1   | 3,532           | no   | 1,258,877        |
| [await-semaphore](https://www.npmjs.com/package/await-semaphore)       | 0.1.3   | 1,184           | no   | 60,449           |
| [@shopify/semaphore](https://www.npmjs.com/package/@shopify/semaphore) | 3.1.0   | 604             | no   | 29,089           |

> If there's a library you'd like added to the table or benchmarks, please open an issue.

## Benchmarks

All libraries run the same test. Each operation measures how long it takes a binary semaphore with 1,000 queued `acquire` requests to allow and release all requests.

### Browser benchmark

This test was run in Chromium. Chrome and Edge are the same. Safari is more lopsided with Vercel's `async-sema` dropping to third. Firefox, though I love and respect it, seems to be hard capped by slow promise handling, with `async-mutex` not far behind.

You can run or tweak for yourself here: https://jsbm.dev/8bBxR1pBLw0TM

![@henrygd/queue - 13,665 Ops/s. async-sema - 8,077 Ops/s. async-mutex - 5,576 Ops/s. @shopify/semaphore - 4,099 Ops/s.](https://henrygd-assets.b-cdn.net/semaphore/browser.png)

> Note: `await-semaphore` is extremely slow for some reason and I didn't want to include it in the image because it seems excessive. Not sure what's happening there.

### Node.js benchmark

![@henrygd/queue - 1.7x faster than async-sema. 2.66x async-mutex. 3.08x async-semaphore. 3.47x @shopify/semaphore.](https://henrygd-assets.b-cdn.net/semaphore/node.png)

### Bun benchmark

![@henrygd/queue - 2x faster than async-semaphore 2.63x asynsc-mutex. 2.68x async-sema. 3.77x @shopify/semaphore.](https://henrygd-assets.b-cdn.net/semaphore/bun-bench.png)

### Deno benchmark

![@henrygd/queue - 1.7x faster than async-sema. 2.7x async-mutex. 2.72x await-semaphore. 4.01x @shopify/semaphore.](https://henrygd-assets.b-cdn.net/semaphore/deno-bench.png)

### Cloudflare Workers benchmark

Uses [oha](https://github.com/hatoo/oha) to make 1,000 requests to each worker. Each request creates a semaphore and resolves 5,000 acquisitions / releases.

This was run locally using [Wrangler](https://developers.cloudflare.com/workers/get-started/guide/). Wrangler uses the same [workerd](https://github.com/cloudflare/workerd) runtime as workers deployed to Cloudflare, so the relative difference should be accurate. Here's the [repo for this benchmark](https://github.com/henrygd/semaphore-wrangler-benchmark).

| Library            | Requests/sec | Total (sec) | Average | Slowest |
| :----------------- | :----------- | :---------- | :------ | :------ |
| @henrygd/semaphore | 941.8135     | 1.0618      | 0.0521  | 0.0788  |
| async-mutex        | 569.5130     | 1.7559      | 0.0862  | 0.1251  |
| async-sema         | 375.7332     | 2.6615      | 0.1308  | 0.1818  |
| @shopify/semaphore | 167.8239     | 5.9586      | 0.2925  | 0.4063  |
| await-semaphore\*  | n/a          | n/a         | n/a     | n/a     |

> \* `await-semaphore` does not work with concurrent requests.

## Related

[`@henrygd/queue`](https://github.com/henrygd/queue) - Tiny async queue with concurrency control. Like p-limit or fastq, but smaller and faster.

## License

[MIT license](/LICENSE)
