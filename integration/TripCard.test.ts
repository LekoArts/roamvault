import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import TripCard from '../src/lib/components/TripCard.svelte'
import { uiStore } from '../src/lib/stores/ui.svelte'

vi.mock('../src/lib/stores/ui.svelte', () => ({
	uiStore: {
		selectTrip: vi.fn(),
	},
}))

describe('tripCard', () => {
	it('renders trip info and calls selectTrip on click', async () => {
		const trip = {
			name: 'Rome',
			year: '2026',
			type: 'Travel_Advanced' as const,
			path: 'Travel/2026/Rome.md',
			frontmatter: {
				startDate: '2026-03-10',
				endDate: '2026-03-20',
				banner: 'https://example.com/banner.jpg',
			},
			planning: [{ name: 'Day 1', path: 'p', frontmatter: {} }],
			activities: [{ name: 'Colosseum', path: 'a', frontmatter: {} }],
		}

		const screen = await render(TripCard, { props: { trip } })
		await expect.element(screen.getByText('Rome')).toBeVisible()
		await expect.element(screen.getByText('Advanced')).toBeVisible()

		await screen.getByRole('button').click()
		expect(uiStore.selectTrip).toHaveBeenCalledWith(trip)
	})
})
