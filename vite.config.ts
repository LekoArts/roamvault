import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte()],
	test: {
		include: ['src/**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
	},
})
