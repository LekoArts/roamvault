import { render } from 'vitest-browser-svelte'
import { describe, expect, test } from 'vitest'

import ItemList from '../src/lib/components/ItemList.svelte'

describe('ItemList', () => {
	test('renders list label and items sorted by start date', async () => {
		const screen = await render(ItemList, {
			props: {
				label: 'Planning',
				items: [
					{ name: 'Day 3', path: 'a', frontmatter: { startDate: '2026-03-20', endDate: '2026-03-20' } },
					{ name: 'Day 1', path: 'b', frontmatter: { startDate: '2026-03-10', endDate: '2026-03-10' } },
				],
			},
		})

		await expect.element(screen.getByRole('heading', { name: 'Planning' })).toBeVisible()
		await expect.element(screen.getByText('Day 1')).toBeVisible()
		await expect.element(screen.getByText('Day 3')).toBeVisible()
	})
})
