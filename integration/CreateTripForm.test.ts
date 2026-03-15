import { render } from 'vitest-browser-svelte'
import { describe, expect, test, vi } from 'vitest'

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

import CreateTripForm from '../src/lib/components/CreateTripForm.svelte'

describe('CreateTripForm', () => {
	test('renders and enables save when trip name is entered', async () => {
		const screen = await render(CreateTripForm)

		await expect.element(screen.getByRole('heading', { name: 'New Trip' })).toBeVisible()
		const saveButton = screen.getByRole('button', { name: 'Save' })
		await expect.element(saveButton).toBeDisabled()

		await screen.getByRole('textbox', { name: 'Trip Name' }).fill('Rome')
		await expect.element(saveButton).toBeEnabled()
	})
})
