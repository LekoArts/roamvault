import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'

import ItemList from '../src/lib/components/ItemList.svelte'

describe('itemList', () => {
	it('renders items sorted by start date', async () => {
		const screen = await render(ItemList, {
			props: {
				label: 'Planning',
				items: [
					{ name: 'Day 3', path: 'a', frontmatter: { startDate: '2026-03-20', endDate: '2026-03-20' } },
					{ name: 'Day 1', path: 'b', frontmatter: { startDate: '2026-03-10', endDate: '2026-03-10' } },
				],
			},
		})

		await expect.element(screen.getByText('Day 1')).toBeVisible()
		await expect.element(screen.getByText('Day 3')).toBeVisible()
	})

	it('renders activities sorted alphabetically', async () => {
		await render(ItemList, {
			props: {
				label: 'Activities',
				items: [
					{ name: 'Zoo', path: 'a', frontmatter: { startDate: '2026-03-20' } },
					{ name: 'Aquarium', path: 'b', frontmatter: { startDate: '2026-03-10' } },
				],
			},
		})

		const itemNames = Array.from(document.querySelectorAll('.item-name'), node => node.textContent)
		expect(itemNames).toEqual(['Aquarium', 'Zoo'])
	})

	it('shows an indicator for assigned items', async () => {
		await render(ItemList, {
			props: {
				label: 'Activities',
				assignedNames: ['Museum'],
				items: [
					{ name: 'Museum', path: 'a1', frontmatter: { Location: 'Rome' } },
					{ name: 'Park', path: 'a2', frontmatter: { Location: 'Rome' } },
				],
			},
		})

		const assignedItem = document.querySelector('.item-assigned .item-name')
		expect(assignedItem?.textContent).toBe('Museum')
		const indicators = document.querySelectorAll('.assignment-indicator')
		expect(indicators.length).toBe(1)
		expect(indicators[0]?.textContent).toBe('•')
	})

	it('shows empty state when no items', async () => {
		const screen = await render(ItemList, {
			props: {
				label: 'Planning',
				items: [],
			},
		})

		await expect.element(screen.getByText('No planning yet')).toBeVisible()
	})
})
