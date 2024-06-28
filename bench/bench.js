import { run, bench, baseline } from 'mitata'
import { getSemaphore } from '../dist/index.min.js'
import { Semaphore as AsyncSemaphore } from 'async-mutex'
import { Semaphore as asSemaphore } from 'await-semaphore'
import { Sema } from 'async-sema'
import { Semaphore } from '@shopify/semaphore'

const loops = 1_000
const concurrency = 1

const semaphore = getSemaphore(concurrency)
const asyncSemaphore = new AsyncSemaphore(concurrency)
const shopifySemaphore = new Semaphore(concurrency)
const asSem = new asSemaphore(concurrency)
const s = new Sema(concurrency, {
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

bench('async-mutex', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		asyncSemaphore.acquire().then(() => {
			++j === loops && resolve()
			asyncSemaphore.release()
		})
	}
	await promise
	checkEqual(j, loops)
})

bench('await-semaphore', async () => {
	let j = 0
	const { promise, resolve } = Promise.withResolvers()
	for (let i = 0; i < loops; i++) {
		asSem.acquire().then((release) => {
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
