import { describe, expect, it, vi } from 'vitest'

// Mock the File System Access API
function createMockFileHandle(content: string): FileSystemFileHandle {
	return {
		kind: 'file',
		name: 'test.md',
		getFile: vi.fn().mockResolvedValue({
			text: () => Promise.resolve(content),
		}),
		createWritable: vi.fn().mockResolvedValue({
			write: vi.fn().mockResolvedValue(undefined),
			close: vi.fn().mockResolvedValue(undefined),
		}),
	} as unknown as FileSystemFileHandle
}

function createMockDirHandle(
	entries: Map<string, FileSystemHandle>,
	name = 'root',
): FileSystemDirectoryHandle {
	const handle = {
		kind: 'directory' as const,
		name,
		getFileHandle: vi.fn().mockImplementation((fileName: string, opts?: { create?: boolean }) => {
			if (entries.has(fileName)) {
				return Promise.resolve(entries.get(fileName))
			}
			if (opts?.create) {
				const fh = createMockFileHandle('')
				entries.set(fileName, fh)
				return Promise.resolve(fh)
			}
			return Promise.reject(new DOMException('Not found', 'NotFoundError'))
		}),
		getDirectoryHandle: vi.fn().mockImplementation((dirName: string, opts?: { create?: boolean }) => {
			if (entries.has(dirName)) {
				return Promise.resolve(entries.get(dirName))
			}
			if (opts?.create) {
				const dh = createMockDirHandle(new Map(), dirName)
				entries.set(dirName, dh)
				return Promise.resolve(dh)
			}
			return Promise.reject(new DOMException('Not found', 'NotFoundError'))
		}),
		values: vi.fn().mockImplementation(() => {
			const iter = entries.values()
			return {
				[Symbol.asyncIterator]() { return this },
				async next() {
					const result = iter.next()
					return result
				},
			}
		}),
	} as unknown as FileSystemDirectoryHandle
	return handle
}

describe('vault service', () => {
	it('readFile reads content from nested path', async () => {
		const { readFile } = await import('./vault')

		const fileHandle = createMockFileHandle('# Hello World')
		const subDir = createMockDirHandle(new Map([['note.md', fileHandle]]), 'sub')
		const root = createMockDirHandle(new Map([['sub', subDir]]))

		const content = await readFile(root, 'sub/note.md')
		expect(content).toBe('# Hello World')
	})

	it('writeFile creates directories and writes content', async () => {
		const { writeFile } = await import('./vault')

		const root = createMockDirHandle(new Map())
		await writeFile(root, 'Travel/2026/trip.md', '# Trip')

		// Verify directories were created with { create: true }
		expect(root.getDirectoryHandle).toHaveBeenCalledWith('Travel', { create: true })
	})

	it('fileExists returns true when file exists', async () => {
		const { fileExists } = await import('./vault')

		const fileHandle = createMockFileHandle('content')
		const root = createMockDirHandle(new Map([['test.md', fileHandle]]))

		expect(await fileExists(root, 'test.md')).toBe(true)
	})

	it('fileExists returns false when file does not exist', async () => {
		const { fileExists } = await import('./vault')

		const root = createMockDirHandle(new Map())
		expect(await fileExists(root, 'missing.md')).toBe(false)
	})

	it('listDirectory returns entries with correct shape', async () => {
		const { listDirectory } = await import('./vault')

		const fileHandle = { kind: 'file', name: 'note.md' } as FileSystemHandle
		const dirHandle = { kind: 'directory', name: 'sub' } as FileSystemHandle
		const root = createMockDirHandle(new Map([
			['note.md', fileHandle],
			['sub', dirHandle],
		]))

		const entries = await listDirectory(root)
		expect(entries).toHaveLength(2)

		const file = entries.find(e => e.name === 'note.md')
		expect(file).toEqual({ name: 'note.md', kind: 'file', path: 'note.md' })

		const dir = entries.find(e => e.name === 'sub')
		expect(dir).toEqual({ name: 'sub', kind: 'directory', path: 'sub' })
	})

	it('listDirectory with path prefix prepends path', async () => {
		const { listDirectory } = await import('./vault')

		const fileHandle = { kind: 'file', name: 'doc.md' } as FileSystemHandle
		const subDir = createMockDirHandle(new Map([['doc.md', fileHandle]]), 'Travel')
		const root = createMockDirHandle(new Map([['Travel', subDir]]))

		const entries = await listDirectory(root, 'Travel')
		expect(entries[0].path).toBe('Travel/doc.md')
	})

	it('verifyPermission returns true when already granted', async () => {
		const { verifyPermission } = await import('./vault')

		const handle = {
			queryPermission: vi.fn().mockResolvedValue('granted'),
			requestPermission: vi.fn(),
		} as unknown as FileSystemDirectoryHandle

		expect(await verifyPermission(handle)).toBe(true)
		expect(handle.requestPermission).not.toHaveBeenCalled()
	})

	it('verifyPermission requests permission when not granted', async () => {
		const { verifyPermission } = await import('./vault')

		const handle = {
			queryPermission: vi.fn().mockResolvedValue('prompt'),
			requestPermission: vi.fn().mockResolvedValue('granted'),
		} as unknown as FileSystemDirectoryHandle

		expect(await verifyPermission(handle)).toBe(true)
		expect(handle.requestPermission).toHaveBeenCalled()
	})

	it('verifyPermission returns false when denied', async () => {
		const { verifyPermission } = await import('./vault')

		const handle = {
			queryPermission: vi.fn().mockResolvedValue('prompt'),
			requestPermission: vi.fn().mockResolvedValue('denied'),
		} as unknown as FileSystemDirectoryHandle

		expect(await verifyPermission(handle)).toBe(false)
	})
})
