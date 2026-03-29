import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import Modal from '../src/lib/components/Modal.svelte'

describe('modal', () => {
	it('renders title and children when open', async () => {
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

	it('calls onclose when close button is clicked', async () => {
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
