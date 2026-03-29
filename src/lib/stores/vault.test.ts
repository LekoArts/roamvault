import type { TemplateDefinition } from '../models/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseFrontmatter } from '../parser/frontmatter'

// Mock vault services
vi.mock('../services/vault', () => ({
	openVault: vi.fn(),
	verifyPermission: vi.fn(),
	listDirectory: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
	fileExists: vi.fn(),
}))

vi.mock('../services/vault-store', () => ({
	saveVaultHandle: vi.fn(),
	loadVaultHandle: vi.fn(),
	clearVaultHandle: vi.fn(),
}))

vi.mock('../templates/engine', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../templates/engine')>()
	return {
		...actual,
		loadTemplates: vi.fn(),
		loadTemplatesFromBackend: vi.fn(),
	}
})

// Import mocks for manipulation
const vaultService = await import('../services/vault')
const vaultStoreService = await import('../services/vault-store')
const engineModule = await import('../templates/engine')

function mockDirHandle(name: string): FileSystemDirectoryHandle {
	return {
		kind: 'directory',
		name,
		getDirectoryHandle: vi.fn().mockRejectedValue(new DOMException('Not found', 'NotFoundError')),
	} as unknown as FileSystemDirectoryHandle
}

function mockDirHandleWithFolders(name: string, folders: string[]): FileSystemDirectoryHandle {
	return {
		kind: 'directory',
		name,
		getDirectoryHandle: vi.fn().mockImplementation((dirName: string) => {
			if (folders.includes(dirName)) {
				return Promise.resolve({ kind: 'directory', name: dirName })
			}
			return Promise.reject(new DOMException('Not found', 'NotFoundError'))
		}),
	} as unknown as FileSystemDirectoryHandle
}

const SIMPLE_TEMPLATE_RAW = `---
base: "[[Travel.base]]"
banner:
startDate: "{{date}}"
endDate: "{{date}}"
Persons: []
Done: false
---
## Content`

function makeTemplate(type: string, content: string): TemplateDefinition {
	const { data } = parseFrontmatter(content)
	return { type, content, frontmatter: data }
}

describe('vaultStore', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('starts with null handle and empty state', async () => {
		// Re-import to get fresh state — but since it's module-level $state,
		// we test via the exported store object
		const { vaultStore } = await import('./vault.svelte')
		// closeVault resets everything
		await vaultStore.closeVault()

		expect(vaultStore.handle).toBeNull()
		expect(vaultStore.name).toBe('')
		expect(vaultStore.travelTree).toEqual({})
		expect(vaultStore.templates).toEqual([])
		expect(vaultStore.loading).toBe(false)
		expect(vaultStore.error).toBeNull()
	})

	describe('openVault', () => {
		it('opens vault and loads data when folders exist', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('my-vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([
				makeTemplate('Travel_Simple', SIMPLE_TEMPLATE_RAW),
			])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()

			expect(vaultStore.handle).not.toBeNull()
			expect(vaultStore.name).toBe('my-vault')
			expect(vaultStore.hasTravelFolder).toBe(true)
			expect(vaultStore.hasTemplatesFolder).toBe(true)
			expect(vaultStoreService.saveVaultHandle).toHaveBeenCalledWith(handle)
		})

		it('sets error when vault has missing folders', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandle('empty-vault')
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)

			await vaultStore.openVault()

			expect(vaultStore.error).toContain('Travel')
			expect(vaultStore.error).toContain('_templates')
			expect(vaultStore.templates).toEqual([])
			expect(vaultStore.travelTree).toEqual({})
		})

		it('sets error when only _templates is missing', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('half-vault', ['Travel'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)

			await vaultStore.openVault()

			expect(vaultStore.hasTravelFolder).toBe(true)
			expect(vaultStore.hasTemplatesFolder).toBe(false)
			expect(vaultStore.error).toContain('_templates')
		})

		it('ignores AbortError when user cancels picker', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const abortErr = new Error('Aborted')
			abortErr.name = 'AbortError'
			vi.mocked(vaultService.openVault).mockRejectedValue(abortErr)

			await vaultStore.openVault()

			expect(vaultStore.handle).toBeNull()
			expect(vaultStore.error).toBeNull()
		})

		it('sets error for non-abort failures', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			vi.mocked(vaultService.openVault).mockRejectedValue(new Error('Permission denied'))

			await vaultStore.openVault()

			expect(vaultStore.error).toBe('Permission denied')
		})
	})

	describe('reopenVault', () => {
		it('returns false when no saved handle', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			vi.mocked(vaultStoreService.loadVaultHandle).mockResolvedValue(null)

			const result = await vaultStore.reopenVault()
			expect(result).toBe(false)
		})

		it('returns false when permission not granted', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandle('vault')
			vi.mocked(vaultStoreService.loadVaultHandle).mockResolvedValue(handle)
			vi.mocked(vaultService.verifyPermission).mockResolvedValue(false)

			const result = await vaultStore.reopenVault()
			expect(result).toBe(false)
		})

		it('reopens vault when permission granted', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('saved-vault', ['Travel', '_templates'])
			vi.mocked(vaultStoreService.loadVaultHandle).mockResolvedValue(handle)
			vi.mocked(vaultService.verifyPermission).mockResolvedValue(true)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			const result = await vaultStore.reopenVault()
			expect(result).toBe(true)
			expect(vaultStore.handle).not.toBeNull()
			expect(vaultStore.name).toBe('saved-vault')
		})

		it('returns false on unexpected error', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			vi.mocked(vaultStoreService.loadVaultHandle).mockRejectedValue(new Error('IDB fail'))

			const result = await vaultStore.reopenVault()
			expect(result).toBe(false)
		})
	})

	describe('createTrip', () => {
		it('creates a simple trip file', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			// Set up vault
			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([
				makeTemplate('Travel_Simple', SIMPLE_TEMPLATE_RAW),
			])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])
			vi.mocked(vaultService.writeFile).mockResolvedValue(undefined)

			await vaultStore.openVault()

			const path = await vaultStore.createTrip('London', 'Travel_Simple', '2026', {
				startDate: '2026-07-20',
				endDate: '2026-07-24',
			})

			expect(path).toBe('Travel/2026/London.md')
			expect(vaultService.writeFile).toHaveBeenCalled()

			const [, writePath, content] = vi.mocked(vaultService.writeFile).mock.calls[0]
			expect(writePath).toBe('Travel/2026/London.md')
			expect(content).toContain('startDate: 2026-07-20')
		})

		it('does nothing when no vault handle', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const result = await vaultStore.createTrip('Trip', 'Travel_Simple', '2026', {})
			expect(result).toBeUndefined()
			expect(vaultService.writeFile).not.toHaveBeenCalled()
		})

		it('throws when template not found', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()

			await expect(vaultStore.createTrip('Trip', 'Travel_Advanced', '2026', {}))
				.rejects
				.toThrow('Template not found for Travel_Advanced')
		})
	})

	describe('createItem', () => {
		const ACTIVITY_TEMPLATE_RAW = `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[TODO]]"
Location:
Done: false
---
`

		it('creates an item file in the correct path', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([
				makeTemplate('Activity', ACTIVITY_TEMPLATE_RAW),
			])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])
			vi.mocked(vaultService.writeFile).mockResolvedValue(undefined)

			await vaultStore.openVault()

			const path = await vaultStore.createItem(
				'Summer Vacation',
				'Travel_Advanced',
				'2026',
				'Activity',
				'Visit Museum',
				{ Location: 'Seoul' },
			)

			expect(path).toBe('Travel/2026/Summer Vacation/Activities/Visit Museum.md')
			expect(vaultService.writeFile).toHaveBeenCalled()

			const [, , content] = vi.mocked(vaultService.writeFile).mock.calls[0]
			expect(content).toContain('backlink: "[[Summer Vacation]]"')
			expect(content).toContain('Location: Seoul')
		})

		it('does nothing when no vault handle', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const result = await vaultStore.createItem('Trip', 'Travel_Advanced', '2026', 'Activity', 'Item', {})
			expect(result).toBeUndefined()
		})

		it('throws when template not found', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()

			await expect(
				vaultStore.createItem('Trip', 'Travel_Advanced', '2026', 'Stop', 'Place', {}),
			).rejects.toThrow('Template not found for Stop')
		})
	})

	describe('closeVault', () => {
		it('resets all state and clears stored handle', async () => {
			const { vaultStore } = await import('./vault.svelte')

			// Open a vault first
			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()
			expect(vaultStore.handle).not.toBeNull()

			await vaultStore.closeVault()

			expect(vaultStore.handle).toBeNull()
			expect(vaultStore.name).toBe('')
			expect(vaultStore.travelTree).toEqual({})
			expect(vaultStore.templates).toEqual([])
			expect(vaultStore.error).toBeNull()
			expect(vaultStoreService.clearVaultHandle).toHaveBeenCalled()
		})
	})

	describe('findTrip', () => {
		it('finds a trip by path', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])

			// Mock travel data with a simple trip
			vi.mocked(vaultService.listDirectory).mockImplementation((_root, path) => {
				if (path === 'Travel') {
					return Promise.resolve([
						{ name: '2026', kind: 'directory', path: 'Travel/2026' },
					])
				}
				if (path === 'Travel/2026') {
					return Promise.resolve([
						{ name: 'London.md', kind: 'file', path: 'Travel/2026/London.md' },
					])
				}
				return Promise.resolve([])
			})
			vi.mocked(vaultService.readFile).mockResolvedValue(`---
base: "[[Other]]"
startDate: 2026-07-20
endDate: 2026-07-24
Done: false
---
# London`)

			await vaultStore.openVault()

			const trip = vaultStore.findTrip('Travel/2026/London.md')
			expect(trip).toBeDefined()
			expect(trip!.name).toBe('London')
			expect(trip!.year).toBe('2026')
		})

		it('returns undefined for non-existent path', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const result = vaultStore.findTrip('Travel/2026/NonExistent.md')
			expect(result).toBeUndefined()
		})
	})

	describe('reload', () => {
		it('does nothing when no vault handle', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			// reload with no handle should just return without error
			await vaultStore.reload()
			expect(vaultStore.loading).toBe(false)
		})

		it('reloads data from vault', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()

			// Reload should call loadTemplates again
			vi.mocked(engineModule.loadTemplatesFromBackend).mockClear()
			await vaultStore.reload()
			expect(engineModule.loadTemplatesFromBackend).toHaveBeenCalled()
		})
	})

	describe('scanTravelData (via openVault)', () => {
		it('scans advanced trip with activities and planning sub-items', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])

			vi.mocked(vaultService.listDirectory).mockImplementation((_root, path) => {
				if (path === 'Travel') {
					return Promise.resolve([
						{ name: '2026', kind: 'directory', path: 'Travel/2026' },
					])
				}
				if (path === 'Travel/2026') {
					return Promise.resolve([
						{ name: 'Japan', kind: 'directory', path: 'Travel/2026/Japan' },
					])
				}
				if (path === 'Travel/2026/Japan/Activities') {
					return Promise.resolve([
						{ name: 'Sushi.md', kind: 'file', path: 'Travel/2026/Japan/Activities/Sushi.md' },
					])
				}
				if (path === 'Travel/2026/Japan/Planning') {
					return Promise.resolve([
						{ name: 'Day 1.md', kind: 'file', path: 'Travel/2026/Japan/Planning/Day 1.md' },
					])
				}
				return Promise.resolve([])
			})

			vi.mocked(vaultService.readFile).mockImplementation((_root, path) => {
				if (path === 'Travel/2026/Japan/Japan.md') {
					return Promise.resolve(`---
base: "[[Travel.base]]"
startDate: 2026-05-01
endDate: 2026-05-15
Done: false
---
## Itinerary
![[Planning.base]]
## Activities
![[Activities.base]]`)
				}
				if (path === 'Travel/2026/Japan/Activities/Sushi.md') {
					return Promise.resolve(`---
base: "[[Activities.base]]"
backlink: "[[Japan]]"
Location: Tokyo
Done: false
---`)
				}
				if (path === 'Travel/2026/Japan/Planning/Day 1.md') {
					return Promise.resolve(`---
base: "[[Planning.base]]"
backlink: "[[Japan]]"
startDate: 2026-05-01
endDate: 2026-05-02
---`)
				}
				return Promise.reject(new Error('not found'))
			})

			await vaultStore.openVault()

			const trips2026 = vaultStore.travelTree['2026']
			expect(trips2026).toHaveLength(1)

			const japan = trips2026[0]
			expect(japan.name).toBe('Japan')
			expect(japan.type).toBe('Travel_Advanced')
			expect(japan.activities).toHaveLength(1)
			expect(japan.activities![0].name).toBe('Sushi')
			expect(japan.planning).toHaveLength(1)
			expect(japan.planning![0].name).toBe('Day 1')
		})

		it('scans roadtrip with stops', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])

			vi.mocked(vaultService.listDirectory).mockImplementation((_root, path) => {
				if (path === 'Travel') {
					return Promise.resolve([
						{ name: '2026', kind: 'directory', path: 'Travel/2026' },
					])
				}
				if (path === 'Travel/2026') {
					return Promise.resolve([
						{ name: 'Albania', kind: 'directory', path: 'Travel/2026/Albania' },
					])
				}
				if (path === 'Travel/2026/Albania/Roadtrip') {
					return Promise.resolve([
						{ name: 'Tirana.md', kind: 'file', path: 'Travel/2026/Albania/Roadtrip/Tirana.md' },
					])
				}
				return Promise.resolve([])
			})

			vi.mocked(vaultService.readFile).mockImplementation((_root, path) => {
				if (path === 'Travel/2026/Albania/Albania.md') {
					return Promise.resolve(`---
base: "[[Travel.base]]"
startDate: 2026-09-17
endDate: 2026-09-25
Done: false
---
![[Roadtrip.base]]`)
				}
				if (path === 'Travel/2026/Albania/Roadtrip/Tirana.md') {
					return Promise.resolve(`---
base: "[[Roadtrip.base]]"
backlink: "[[Albania]]"
startDate: 2026-09-17
endDate: 2026-09-17
---`)
				}
				return Promise.reject(new Error('not found'))
			})

			await vaultStore.openVault()

			const trips = vaultStore.travelTree['2026']
			expect(trips).toHaveLength(1)
			expect(trips[0].type).toBe('Travel_Roadtrip')
			expect(trips[0].stops).toHaveLength(1)
			expect(trips[0].stops![0].name).toBe('Tirana')
		})

		it('skips trip folders without main .md file', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])

			vi.mocked(vaultService.listDirectory).mockImplementation((_root, path) => {
				if (path === 'Travel') {
					return Promise.resolve([
						{ name: '2026', kind: 'directory', path: 'Travel/2026' },
					])
				}
				if (path === 'Travel/2026') {
					return Promise.resolve([
						{ name: 'Empty', kind: 'directory', path: 'Travel/2026/Empty' },
					])
				}
				return Promise.resolve([])
			})

			vi.mocked(vaultService.readFile).mockRejectedValue(new Error('not found'))

			await vaultStore.openVault()

			expect(vaultStore.travelTree).toEqual({})
		})

		it('sorts trips by startDate within a year', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])

			vi.mocked(vaultService.listDirectory).mockImplementation((_root, path) => {
				if (path === 'Travel') {
					return Promise.resolve([
						{ name: '2026', kind: 'directory', path: 'Travel/2026' },
					])
				}
				if (path === 'Travel/2026') {
					return Promise.resolve([
						{ name: 'Zulu.md', kind: 'file', path: 'Travel/2026/Zulu.md' },
						{ name: 'Alpha.md', kind: 'file', path: 'Travel/2026/Alpha.md' },
					])
				}
				return Promise.resolve([])
			})

			vi.mocked(vaultService.readFile).mockImplementation((_root, path) => {
				if (path === 'Travel/2026/Zulu.md') {
					return Promise.resolve(`---
base: "[[Other]]"
startDate: 2026-12-01
endDate: 2026-12-05
---`)
				}
				if (path === 'Travel/2026/Alpha.md') {
					return Promise.resolve(`---
base: "[[Other]]"
startDate: 2026-01-01
endDate: 2026-01-05
---`)
				}
				return Promise.reject(new Error('not found'))
			})

			await vaultStore.openVault()

			const trips = vaultStore.travelTree['2026']
			expect(trips).toHaveLength(2)
			expect(trips[0].name).toBe('Alpha')
			expect(trips[1].name).toBe('Zulu')
		})

		it('handles listDirectory Travel failure gracefully', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])

			// Travel exists (directoryExists passes) but listDirectory throws
			vi.mocked(vaultService.listDirectory).mockRejectedValue(new Error('Read error'))

			await vaultStore.openVault()

			// scanTravelData catches the error and returns empty tree
			expect(vaultStore.travelTree).toEqual({})
			expect(vaultStore.error).toBeNull()
		})

		it('handles errors in scanTravelData gracefully', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockRejectedValue(new Error('Disk error'))

			await vaultStore.openVault()

			expect(vaultStore.error).toBe('Disk error')
			expect(vaultStore.loading).toBe(false)
		})
	})

	describe('updateSubItem', () => {
		it('updates frontmatter and persists to file', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()

			// Set up readFile to return a planning item with Activities
			vi.mocked(vaultService.readFile).mockResolvedValueOnce(`---
base: "[[Planning.base]]"
backlink: "[[Japan]]"
startDate: 2026-05-01
Activities:
  - "[[Sushi]]"
  - "[[Temple]]"
---
# Day 1`)

			await vaultStore.updateSubItem(
				'Travel/2026/Japan/Planning/Day 1.md',
				(data) => {
					data.Activities = (data.Activities as string[]).filter(
						(link: string) => link !== '[[Temple]]',
					)
				},
			)

			expect(vaultService.writeFile).toHaveBeenCalled()
			const [, , written] = vi.mocked(vaultService.writeFile).mock.calls.at(-1)!
			expect(written).toContain('[[Sushi]]')
			expect(written).not.toContain('[[Temple]]')
			expect(written).toContain('# Day 1')
		})

		it('applies contentUpdater to body when provided', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()

			vi.mocked(vaultService.readFile).mockResolvedValueOnce(`---
base: "[[Planning.base]]"
Activities:
  - "[[Sushi]]"
---

## 01.05.2026

### Activities

- [[Sushi]]`)

			await vaultStore.updateSubItem(
				'Travel/2026/Japan/Planning/Day 1.md',
				(data) => {
					const arr = Array.isArray(data.Activities) ? data.Activities as string[] : []
					arr.push('[[Ramen]]')
					data.Activities = arr
				},
				content => content.replace('- [[Sushi]]', '- [[Sushi]]\n- [[Ramen]]'),
			)

			expect(vaultService.writeFile).toHaveBeenCalled()
			const [, , written] = vi.mocked(vaultService.writeFile).mock.calls.at(-1)!
			expect(written).toContain('[[Ramen]]')
			expect(written).toContain('[[Sushi]]')
		})

		it('reloads data after update', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			const handle = mockDirHandleWithFolders('vault', ['Travel', '_templates'])
			vi.mocked(vaultService.openVault).mockResolvedValue(handle)
			vi.mocked(engineModule.loadTemplatesFromBackend).mockResolvedValue([])
			vi.mocked(vaultService.listDirectory).mockResolvedValue([])

			await vaultStore.openVault()

			vi.mocked(vaultService.readFile).mockResolvedValueOnce(`---
base: "[[Planning.base]]"
Activities: []
---`)

			vi.mocked(engineModule.loadTemplatesFromBackend).mockClear()

			await vaultStore.updateSubItem(
				'Travel/2026/Japan/Planning/Day 1.md',
				(data) => {
					data.Activities = ['[[New Activity]]']
				},
			)

			// loadData triggers loadTemplatesFromBackend
			expect(engineModule.loadTemplatesFromBackend).toHaveBeenCalled()
		})

		it('does nothing when no vault is open', async () => {
			const { vaultStore } = await import('./vault.svelte')
			await vaultStore.closeVault()

			// Should not throw
			await vaultStore.updateSubItem(
				'Travel/2026/Japan/Planning/Day 1.md',
				(data) => {
					data.Activities = []
				},
			)

			expect(vaultService.readFile).not.toHaveBeenCalled()
			expect(vaultService.writeFile).not.toHaveBeenCalled()
		})
	})
})
