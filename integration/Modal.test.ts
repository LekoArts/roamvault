import { render } from 'vitest-browser-svelte'
import { describe, expect, test, vi } from 'vitest'

import Modal from '../src/lib/components/Modal.svelte'

describe('Modal', () => {
	test('renders title and children when open', async () => {
		const onclose = vi.fn()
		const screen = await render(Modal, {
			props: {
				open: true,
				title: 'Create trip',
				onclose,
				children: () => 'Modal body',
			},
		})

		await expect.element(screen.getByText('Create trip')).toBeVisible()
	})

	test('calls onclose when close button is clicked', async () => {
		const onclose = vi.fn()
		const screen = await render(Modal, {
			props: {
				open: true,
				title: 'Create trip',
				onclose,
				children: () => 'Body',
			},
		})

		await screen.getByRole('button', { name: 'Close' }).click()
		expect(onclose).toHaveBeenCalledTimes(1)
	})
})
