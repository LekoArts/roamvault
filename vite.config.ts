import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte()],
	define: {
		// eslint-disable-next-line node/prefer-global/process
		__DEMO__: JSON.stringify(process.env.DEMO === 'true'),
	},
	test: {
		include: ['src/**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			include: ['src/lib/**/*.ts'],
			exclude: ['src/lib/**/*.test.ts', 'src/lib/**/*.d.ts', 'src/lib/components/**', 'src/lib/models/types.ts'],
		},
	},
})
