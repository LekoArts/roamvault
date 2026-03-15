import { render } from 'vitest-browser-svelte'
import { describe, expect, test, vi } from 'vitest'

import TravelList from '../src/lib/components/TravelList.svelte'
import { uiStore } from '../src/lib/stores/ui.svelte'
import { vaultStore } from '../src/lib/stores/vault.svelte'

vi.mock('../src/lib/stores/vault.svelte', async () => {
	const actual = await vi.importActual('../src/lib/stores/vault.svelte') as { vaultStore: typeof vaultStore }
	return {
		...actual,
		vaultStore: {
			...actual.vaultStore,
			name: 'My Vault',
			loading: false,
			error: null,
			handle: { name: 'My Vault' },
			hasTravelFolder: true,
			hasTemplatesFolder: true,
			travelTree: {
				'2026': [
					{ name: 'Rome', year: '2026', type: 'Travel_Simple', path: 'Travel/2026/Rome.md', frontmatter: {} },
				],
			},
			reopenVault: vi.fn(async () => true),
			closeVault: vi.fn(async () => {}),
		},
	}
})

describe('TravelList', () => {
	test('renders vault name and trips', async () => {
		const screen = await render(TravelList)
		await expect.element(screen.getByText('My Vault')).toBeVisible()
		await expect.element(screen.getByText('Rome')).toBeVisible()
	})

	test('opens create trip modal from header button', async () => {
		const screen = await render(TravelList)
		await screen.getByRole('button', { name: 'New Trip' }).click()
		expect(uiStore.modalOpen).toBe('create-trip')
	})
})
