import { del, get, set } from 'idb-keyval'

const VAULT_HANDLE_KEY = 'roamvault-handle'

export async function saveVaultHandle(handle: FileSystemDirectoryHandle): Promise<void> {
	await set(VAULT_HANDLE_KEY, handle)
}

export async function loadVaultHandle(): Promise<FileSystemDirectoryHandle | null> {
	const handle = await get<FileSystemDirectoryHandle>(VAULT_HANDLE_KEY)
	return handle || null
}

export async function clearVaultHandle(): Promise<void> {
	await del(VAULT_HANDLE_KEY)
}
