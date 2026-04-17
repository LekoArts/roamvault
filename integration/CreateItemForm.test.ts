import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import CreateItemForm from '../src/lib/components/CreateItemForm.svelte'

vi.mock('../src/lib/stores/ui.svelte', () => ({
	uiStore: {
		selectedTrip: {
			name: 'Rome',
			year: '2026',
			type: 'Travel_Advanced',
			path: 'Travel/2026/Rome.md',
			frontmatter: { startDate: '2026-03-10', endDate: '2026-03-20' },
			planning: [],
			activities: [],
		},
		modalOpen: 'create-item',
		itemTypeToCreate: 'Planning',
		closeModal: vi.fn(),
		updateSelectedTrip: vi.fn(),
	},
}))

vi.mock('../src/lib/stores/vault.svelte', () => ({
	vaultStore: {
		templates: [{
			type: 'Planning',
			content: '---\nstartDate: "{{date}}"\nendDate: "{{date}}"\n---',
			frontmatter: { startDate: '{{date}}', endDate: '{{date}}' },
		}],
		createItem: vi.fn(async () => 'Travel/2026/Rome/Planning/Day 1.md'),
		findTrip: vi.fn(() => ({
			name: 'Rome',
			year: '2026',
			type: 'Travel_Advanced',
			path: 'Travel/2026/Rome.md',
			frontmatter: { startDate: '2026-03-10', endDate: '2026-03-20' },
			planning: [{ name: 'Day 1', path: 'x', frontmatter: {} }],
			activities: [],
		})),
	},
}))

describe('createItemForm', () => {
	it('renders and enables save when item name is entered', async () => {
		const screen = await render(CreateItemForm)
		await expect.element(screen.getByRole('heading', { name: 'New Day Plan' })).toBeVisible()

		const saveButton = screen.getByRole('button', { name: 'New Day Plan' })
		await expect.element(saveButton).toBeDisabled()

		await screen.getByRole('textbox', { name: 'Name' }).fill('Day 1')
		await expect.element(saveButton).toBeEnabled()
	})

	it('shows a validation message when end date is before the start date', async () => {
		const screen = await render(CreateItemForm)
		await screen.getByRole('textbox', { name: 'Name' }).fill('Day 1')

		await screen.getByLabelText('Start date').fill('2026-03-15')
		await screen.getByLabelText('End date').fill('2026-03-14')

		await expect.element(screen.getByText('End date must be the same as or later than the start date.')).toBeVisible()
		await expect.element(screen.getByRole('button', { name: 'New Day Plan' })).toBeDisabled()
	})
})
