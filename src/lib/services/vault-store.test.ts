import { describe, expect, it, vi } from 'vitest'

import { clearVaultHandle, loadVaultHandle, saveVaultHandle } from './vault-store'

// Mock idb-keyval
const store = new Map<string, unknown>()

vi.mock('idb-keyval', () => ({
	get: vi.fn((key: string) => Promise.resolve(store.get(key))),
	set: vi.fn((key: string, val: unknown) => {
		store.set(key, val)
		return Promise.resolve()
	}),
	del: vi.fn((key: string) => {
		store.delete(key)
		return Promise.resolve()
	}),
}))

describe('vault-store', () => {
	it('saveVaultHandle stores handle', async () => {
		const handle = { name: 'my-vault' } as unknown as FileSystemDirectoryHandle
		await saveVaultHandle(handle)
		expect(store.get('roamvault-handle')).toBe(handle)
	})

	it('loadVaultHandle returns stored handle', async () => {
		const handle = { name: 'my-vault' } as unknown as FileSystemDirectoryHandle
		store.set('roamvault-handle', handle)
		const loaded = await loadVaultHandle()
		expect(loaded).toBe(handle)
	})

	it('loadVaultHandle returns null when no handle stored', async () => {
		store.delete('roamvault-handle')
		const loaded = await loadVaultHandle()
		expect(loaded).toBeNull()
	})

	it('clearVaultHandle removes stored handle', async () => {
		store.set('roamvault-handle', { name: 'vault' })
		await clearVaultHandle()
		expect(store.has('roamvault-handle')).toBe(false)
	})
})
