export async function openVault(): Promise<FileSystemDirectoryHandle> {
	const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
	return handle
}

export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
	const opts = { mode: 'readwrite' as const }
	if (await handle.queryPermission(opts) === 'granted')
		return true
	if (await handle.requestPermission(opts) === 'granted')
		return true
	return false
}

async function navigateToDir(
	root: FileSystemDirectoryHandle,
	pathParts: string[],
	create = false,
): Promise<FileSystemDirectoryHandle> {
	let current = root
	for (const part of pathParts) {
		current = await current.getDirectoryHandle(part, { create })
	}
	return current
}

function splitPath(path: string): { dirParts: string[], fileName: string } {
	const parts = path.split('/').filter(Boolean)
	const fileName = parts.pop()!
	return { dirParts: parts, fileName }
}

export async function readFile(root: FileSystemDirectoryHandle, path: string): Promise<string> {
	const { dirParts, fileName } = splitPath(path)
	const dir = await navigateToDir(root, dirParts)
	const fileHandle = await dir.getFileHandle(fileName)
	const file = await fileHandle.getFile()
	return file.text()
}

export async function writeFile(root: FileSystemDirectoryHandle, path: string, content: string): Promise<void> {
	const { dirParts, fileName } = splitPath(path)
	const dir = await navigateToDir(root, dirParts, true)
	const fileHandle = await dir.getFileHandle(fileName, { create: true })
	const writable = await fileHandle.createWritable()
	await writable.write(content)
	await writable.close()
}

export async function fileExists(root: FileSystemDirectoryHandle, path: string): Promise<boolean> {
	try {
		const { dirParts, fileName } = splitPath(path)
		const dir = await navigateToDir(root, dirParts)
		await dir.getFileHandle(fileName)
		return true
	}
	catch {
		return false
	}
}

export interface DirEntry {
	name: string
	kind: 'file' | 'directory'
	path: string
}

export async function listDirectory(
	root: FileSystemDirectoryHandle,
	path = '',
): Promise<DirEntry[]> {
	const parts = path.split('/').filter(Boolean)
	const dir = await navigateToDir(root, parts)
	const entries: DirEntry[] = []

	for await (const entry of dir.values()) {
		entries.push({
			name: entry.name,
			kind: entry.kind,
			path: path ? `${path}/${entry.name}` : entry.name,
		})
	}

	return entries
}

export async function listDirectoryRecursive(
	root: FileSystemDirectoryHandle,
	path = '',
): Promise<DirEntry[]> {
	const entries = await listDirectory(root, path)
	const result: DirEntry[] = []

	for (const entry of entries) {
		result.push(entry)
		if (entry.kind === 'directory') {
			const children = await listDirectoryRecursive(root, entry.path)
			result.push(...children)
		}
	}

	return result
}
