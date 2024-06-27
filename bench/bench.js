import { run, bench, baseline } from 'mitata'
import { getSemaphore } from '../dist/index.min.js'
import { Semaphore as AsyncSemaphore } from 'async-mutex'
import { Mutex } from 'await-semaphore'
import { Sema } from 'async-sema'
import { Lock } from 'async-await-mutex-lock'
import { Semaphore } from '@shopify/semaphore'

let loops = 1_000

const semaphore = getSemaphore()
const asyncSemaphore = new AsyncSemaphore(1)
const lock = new Lock()
const shopifySemaphore = new Semaphore(1)
const asMutex = new Mutex()
const s = new Sema(1, {
	capacity: loops, // Prealloc space for [loops] tokens
})

function checkEqual(a, b) {
	if (a !== b) {
		throw new Error(`${a} !== ${b}`)
	}
}

baseline('@henrygd/semaphore', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		semaphore.acquire().then(() => {
			++j === loops && resolve()
			semaphore.release()
		})
	}
	await promise
	checkEqual(j, loops)
})

bench('async-await-mutex-lock', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		lock.acquire().then(() => {
			++j === loops && resolve()
			lock.release()
		})
	}
	await promise
	checkEqual(j, loops)
})

bench('vercel/async-sema', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		s.acquire().then(() => {
			++j === loops && resolve()
			s.release()
		})
	}
	await promise
	checkEqual(j, loops)
})

bench('await-semaphore', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		asMutex.acquire().then((release) => {
			++j === loops && resolve()
			release()
		})
	}
	await promise
	checkEqual(j, loops)
})

bench('async-mutex', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		asyncSemaphore.acquire().then(([_, release]) => {
			++j === loops && resolve()
			release()
		})
	}
	await promise
	checkEqual(j, loops)
})

bench('@shopify/semaphore', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		shopifySemaphore.acquire().then((permit) => {
			++j === loops && resolve()
			permit.release()
		})
	}
	await promise
	checkEqual(j, loops)
})

await run()
await run()
