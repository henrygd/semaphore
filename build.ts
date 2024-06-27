import { build } from 'esbuild'

await build({
	entryPoints: ['index.ts'],
	mangleProps: /^res$|^rej$|^next$/,
	format: 'esm',
	outfile: './dist/index.js',
})

await build({
	entryPoints: ['index.ts'],
	minify: true,
	mangleProps: /^res$|^rej$|^next$/,
	format: 'esm',
	outfile: './dist/index.min.js',
})

await build({
	entryPoints: ['index.ts'],
	mangleProps: /^res$|^rej$|^next$/,
	format: 'cjs',
	outfile: './dist/index.cjs',
})
