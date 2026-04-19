import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import TripDetail from '../src/lib/components/TripDetail.svelte'

vi.mock('../src/lib/stores/ui.svelte', () => ({
	uiStore: {
		selectedTrip: {
			name: 'Rome',
			year: '2026',
			type: 'Travel_Advanced',
			path: 'Travel/2026/Rome.md',
			frontmatter: { startDate: '2026-03-10', endDate: '2026-03-20', Persons: ['A', 'B'] },
			planning: [{ name: 'Day 1', path: 'p1', frontmatter: { startDate: '2026-03-10', Activities: ['[[Museum]]'] } }],
			activities: [
				{ name: 'Museum', path: 'a1', frontmatter: { startDate: '2026-03-11' } },
				{ name: 'Park', path: 'a2', frontmatter: { startDate: '2026-03-12' } },
			],
		},
		navigate: vi.fn(),
		openCreateItemModal: vi.fn(),
	},
}))

vi.mock('../src/lib/stores/vault.svelte', () => ({
	vaultStore: {
		updateSubItem: vi.fn(),
		findTrip: vi.fn(),
	},
}))

describe('tripDetail', () => {
	it('renders selected advanced trip details', async () => {
		const screen = await render(TripDetail)
		await expect.element(screen.getByText('Rome')).toBeVisible()
		await expect.element(screen.getByText('Advanced Trip', { exact: true })).toBeVisible()
		await expect.element(screen.getByText('A, B')).toBeVisible()
		await expect.element(screen.getByText('Day 1')).toBeVisible()
		// Verify Museum appears in the Activities section (not just in a dropdown)
		const itemNames = document.querySelectorAll('.item-name')
		const museumItem = [...itemNames].find(el => el.textContent === 'Museum')
		expect(museumItem).toBeDefined()
		const assignedItem = document.querySelector('.item-assigned .item-name')
		expect(assignedItem?.textContent).toBe('Museum')
		expect(document.querySelectorAll('.assignment-indicator')).toHaveLength(1)
	})
})
