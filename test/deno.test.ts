import { expect } from 'jsr:@std/expect'
import { getSemaphore as getMutexDev } from '../index.ts'
import { getSemaphore as getMutexDist } from '../dist/index.js'

const test = Deno.test

let getSemaphore: typeof getMutexDev
if (Deno.env.get('DIST')) {
	console.log('using dist files')
	getSemaphore = getMutexDist
} else {
	console.log('using dev files')
	getSemaphore = getMutexDev
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('Simple acquire and release', async () => {
	const sem = getSemaphore()
	expect(sem.size()).toBe(0)
	await sem.acquire()
	expect(sem.size()).toBe(1)
	sem.release()
	expect(sem.size()).toBe(0)
	await sem.acquire()
	expect(sem.size()).toBe(1)
	sem.release()
	expect(sem.size()).toBe(0)
})

test('Releases properly after task', async () => {
	const sem = getSemaphore()
	expect(sem.size()).toBe(0)
	sem
		.acquire()
		.then(async () => await wait(100))
		.finally(() => sem.release())
	expect(sem.size()).toBe(1)
	await wait(50)
	expect(sem.size()).toBe(1)
	await wait(60)
	expect(sem.size()).toBe(0)
})

test('Staggered locks', async () => {
	const sem = getSemaphore('testing', 2)
	let val = 0

	sem
		.acquire()
		.then(() => wait(100))
		.then(() => (val = 20))
		.finally(sem.release)

	sem
		.acquire()
		.then(() => wait(50))
		.then(() => (val = 10))
		.finally(sem.release)

	expect(sem.size()).toBe(2)
	expect(val).toBe(0)

	await sem
		.acquire()
		.then(() => expect(val).toBe(10))
		.finally(sem.release)

	expect(sem.size()).toBe(1)
	// wait for first lock to complete
	await wait(110)
	expect(sem.size()).toBe(0)
})

test('Can reuse same active sem with key', async () => {
	for (let i = 0; i < 5; i++) {
		;(async () => {
			const sem = getSemaphore('reuse-test')
			await sem.acquire()
			await wait(10)
			sem.release()
		})()
	}
	await wait(5)
	const sem = getSemaphore('reuse-test')
	for (let i = 5; i >= 0; i--) {
		expect(sem.size()).toBe(i)
		await wait(10)
	}
})

test('Cannot reuse sem w/o key', async () => {
	for (let i = 0; i < 5; i++) {
		;(async () => {
			const sem = getSemaphore()
			await sem.acquire()
			await wait(10)
			sem.release()
		})()
	}
	await wait(5)
	const sem = getSemaphore()
	for (let i = 5; i >= 0; i--) {
		expect(sem.size()).toBe(0)
		await wait(10)
	}
})

test('Concurrency works', async () => {
	const sem = getSemaphore('concurrency-test', 5)
	for (let i = 0; i < 50; i++) {
		;(async () => {
			await sem.acquire()
			await wait(10)
			sem.release()
		})()
	}
	await wait(5)
	for (let i = 50; i >= 0; i -= 5) {
		expect(sem.size()).toBe(i)
		await wait(10)
	}
})

test("Won't explode if release is called too many times", async () => {
	const semaphore = getSemaphore('testing', 2)
	expect(semaphore.size()).toBe(0)
	semaphore.release()
	expect(semaphore.size()).toBe(0)
	await semaphore.acquire()
	expect(semaphore.size()).toBe(1)
	semaphore.release()
	semaphore.release()
	semaphore.release()
	expect(semaphore.size()).toBe(0)
	await semaphore.acquire()
	expect(semaphore.size()).toBe(1)
	await semaphore.acquire()
	expect(semaphore.size()).toBe(2)
	semaphore.release()
	semaphore.release()
	semaphore.release()
	expect(semaphore.size()).toBe(0)
})
