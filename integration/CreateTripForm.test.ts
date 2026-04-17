import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import CreateTripForm from '../src/lib/components/CreateTripForm.svelte'

vi.mock('../src/lib/stores/ui.svelte', () => ({
	uiStore: {
		selectedTrip: null,
		modalOpen: 'create-trip',
		itemTypeToCreate: null,
		closeModal: vi.fn(),
		selectTrip: vi.fn(),
	},
}))

vi.mock('../src/lib/stores/vault.svelte', () => ({
	vaultStore: {
		templates: [{
			type: 'Travel_Simple',
			content: '---\nstartDate: "{{date}}"\nendDate: "{{date}}"\nDone: false\n---',
			frontmatter: { startDate: '{{date}}', endDate: '{{date}}', Done: false },
		}],
		createTrip: vi.fn(async () => 'Travel/2026/Rome.md'),
		findTrip: vi.fn(() => ({
			name: 'Rome',
			year: '2026',
			type: 'Travel_Simple',
			path: 'Travel/2026/Rome.md',
			frontmatter: {},
		})),
	},
}))

describe('createTripForm', () => {
	it('renders and enables save when required fields are valid', async () => {
		const screen = await render(CreateTripForm)

		await expect.element(screen.getByRole('heading', { name: 'New Trip' })).toBeVisible()
		const saveButton = screen.getByRole('button', { name: 'Create Trip' })
		await expect.element(saveButton).toBeDisabled()

		await screen.getByRole('textbox', { name: 'Trip Name' }).fill('Rome')
		await expect.element(saveButton).toBeEnabled()
	})

	it('shows a validation message for an invalid year', async () => {
		const screen = await render(CreateTripForm)

		await screen.getByRole('textbox', { name: 'Trip Name' }).fill('Rome')
		await screen.getByRole('textbox', { name: 'Year' }).fill('26')

		await expect.element(screen.getByText('Use a four-digit year, for example 2026.')).toBeVisible()
		await expect.element(screen.getByRole('button', { name: 'Create Trip' })).toBeDisabled()
	})
})
