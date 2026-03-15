import { render } from 'vitest-browser-svelte'
import { describe, expect, test, vi } from 'vitest'

vi.mock('../src/lib/stores/ui.svelte', () => ({
	uiStore: {
		navigate: vi.fn(),
		currentView: 'vault-picker',
	},
}))

vi.mock('../src/lib/stores/vault.svelte', () => ({
	vaultStore: {
		loading: false,
		error: null,
		handle: { name: 'My Vault' },
		reopenVault: vi.fn(async () => false),
		openVault: vi.fn(async () => {}),
	},
}))

import VaultPicker from '../src/lib/components/VaultPicker.svelte'
import { uiStore } from '../src/lib/stores/ui.svelte'

describe('VaultPicker', () => {
	test('renders open vault button and navigates on open', async () => {
		Object.defineProperty(window, 'showDirectoryPicker', {
			configurable: true,
			value: vi.fn(),
		})

		const screen = await render(VaultPicker)
		const button = screen.getByRole('button', { name: 'Open Vault' })
		await expect.element(button).toBeVisible()
		await button.click()

		expect(uiStore.navigate).toHaveBeenCalledWith('travel-list')
	})
})
