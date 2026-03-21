import type { MemoryFS } from './demo-vault'
import type { DirEntry } from './vault'
import { memDirectoryExists, memListDirectory, memReadFile, memWriteFile } from './demo-vault'
import { listDirectory as fsListDirectory, readFile as fsReadFile, writeFile as fsWriteFile } from './vault'

/**
 * Unified backend interface that can be backed by either
 * a real FileSystemDirectoryHandle or an in-memory demo vault.
 */
export interface VaultBackend {
	readonly name: string
	readonly isDemo: boolean
	listDirectory: (path: string) => Promise<DirEntry[]>
	readFile: (path: string) => Promise<string>
	writeFile: (path: string, content: string) => Promise<void>
	directoryExists: (name: string) => Promise<boolean>
}

export function createFSBackend(handle: FileSystemDirectoryHandle): VaultBackend {
	return {
		name: handle.name,
		isDemo: false,
		listDirectory: (path: string) => fsListDirectory(handle, path),
		readFile: (path: string) => fsReadFile(handle, path),
		writeFile: (path: string, content: string) => fsWriteFile(handle, path, content),
		async directoryExists(name: string) {
			try {
				await handle.getDirectoryHandle(name)
				return true
			}
			catch {
				return false
			}
		},
	}
}

export function createDemoBackend(fs: MemoryFS): VaultBackend {
	return {
		name: 'Demo Vault',
		isDemo: true,
		async listDirectory(path: string) {
			return memListDirectory(fs, path)
		},
		async readFile(path: string) {
			return memReadFile(fs, path)
		},
		async writeFile(path: string, content: string) {
			memWriteFile(fs, path, content)
		},
		async directoryExists(name: string) {
			return memDirectoryExists(fs, name)
		},
	}
}
