import type { ItemType, SubItem, TemplateDefinition, TravelTree, TripData, TripType } from '../models/types'
import type { TemplateValues } from '../templates/engine'
import { parseFrontmatter } from '../parser/frontmatter'
import { listDirectory, openVault as openVaultPicker, readFile, verifyPermission, writeFile } from '../services/vault'
import { clearVaultHandle, loadVaultHandle, saveVaultHandle } from '../services/vault-store'
import { detectTripTypeFromFile, getTargetPath, getTemplate, loadTemplates, processTemplate } from '../templates/engine'

let vaultHandle = $state<FileSystemDirectoryHandle | null>(null)
let vaultName = $state('')
let travelTree = $state.raw<TravelTree>({})
let templates = $state.raw<TemplateDefinition[]>([])
let loading = $state(false)
let error = $state<string | null>(null)
let hasTravelFolder = $state(false)
let hasTemplatesFolder = $state(false)

async function scanTravelData(root: FileSystemDirectoryHandle): Promise<TravelTree> {
	const tree: TravelTree = {}

	let travelEntries
	try {
		travelEntries = await listDirectory(root, 'Travel')
	}
	catch {
		return tree
	}

	const yearDirs = travelEntries.filter(e => e.kind === 'directory')

	for (const yearDir of yearDirs) {
		const year = yearDir.name
		const yearEntries = await listDirectory(root, yearDir.path)
		const trips: TripData[] = []

		for (const entry of yearEntries) {
			if (entry.kind === 'file' && entry.name.endsWith('.md')) {
				// Simple trip — standalone .md file
				const content = await readFile(root, entry.path)
				const { data, content: body } = parseFrontmatter(content)
				const tripType = detectTripTypeFromFile(body, data)

				trips.push({
					name: entry.name.replace('.md', ''),
					year,
					type: tripType,
					path: entry.path,
					frontmatter: data,
				})
			}
			else if (entry.kind === 'directory') {
				// Advanced or Roadtrip — folder containing main .md file
				const tripName = entry.name
				const tripFilePath = `${entry.path}/${tripName}.md`

				let content: string
				try {
					content = await readFile(root, tripFilePath)
				}
				catch {
					continue
				}

				const { data, content: body } = parseFrontmatter(content)
				const tripType = detectTripTypeFromFile(body, data)

				const trip: TripData = {
					name: tripName,
					year,
					type: tripType,
					path: tripFilePath,
					frontmatter: data,
				}

				// Scan sub-items based on type
				if (tripType === 'Travel_Advanced') {
					trip.activities = await scanSubItems(root, `${entry.path}/Activities`)
					trip.planning = await scanSubItems(root, `${entry.path}/Planning`)
				}
				else if (tripType === 'Travel_Roadtrip') {
					trip.stops = await scanSubItems(root, `${entry.path}/Roadtrip`)
				}

				trips.push(trip)
			}
		}

		if (trips.length > 0) {
			tree[year] = trips.sort((a, b) => {
				const aDate = String(a.frontmatter.startDate ?? '')
				const bDate = String(b.frontmatter.startDate ?? '')
				return aDate.localeCompare(bDate)
			})
		}
	}

	return tree
}

async function scanSubItems(root: FileSystemDirectoryHandle, path: string): Promise<SubItem[]> {
	let entries
	try {
		entries = await listDirectory(root, path)
	}
	catch {
		return []
	}

	const items: SubItem[] = []

	for (const entry of entries) {
		if (entry.kind !== 'file' || !entry.name.endsWith('.md'))
			continue

		const content = await readFile(root, entry.path)
		const { data } = parseFrontmatter(content)

		items.push({
			name: entry.name.replace('.md', ''),
			path: entry.path,
			frontmatter: data,
		})
	}

	return items
}

async function directoryExists(root: FileSystemDirectoryHandle, name: string): Promise<boolean> {
	try {
		await root.getDirectoryHandle(name)
		return true
	}
	catch {
		return false
	}
}

async function loadData() {
	if (!vaultHandle)
return

	loading = true
	error = null

	try {
		hasTravelFolder = await directoryExists(vaultHandle, 'Travel')
		hasTemplatesFolder = await directoryExists(vaultHandle, '_templates')

		if (!hasTravelFolder || !hasTemplatesFolder) {
			const missing = [
				!hasTravelFolder && 'Travel',
				!hasTemplatesFolder && '_templates',
			].filter(Boolean).join(' and ')
			error = `This vault is missing the ${missing} folder. Make sure your Obsidian vault contains both folders.`
			templates = []
			travelTree = {}
			return
		}

		templates = await loadTemplates(vaultHandle)
		travelTree = await scanTravelData(vaultHandle)
	}
	catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load vault data'
	}
	finally {
		loading = false
	}
}

export const vaultStore = {
	get handle() { return vaultHandle },
	get name() { return vaultName },
	get travelTree() { return travelTree },
	get templates() { return templates },
	get loading() { return loading },
	get error() { return error },
	get hasTravelFolder() { return hasTravelFolder },
	get hasTemplatesFolder() { return hasTemplatesFolder },

	async openVault() {
		try {
			const handle = await openVaultPicker()
			vaultHandle = handle
			vaultName = handle.name
			await saveVaultHandle(handle)
			await loadData()
		}
		catch (e) {
			if (e instanceof Error && e.name === 'AbortError')
return
			error = e instanceof Error ? e.message : 'Failed to open vault'
		}
	},

	async reopenVault() {
		try {
			const handle = await loadVaultHandle()
			if (!handle)
return false

			const granted = await verifyPermission(handle)
			if (!granted)
return false

			vaultHandle = handle
			vaultName = handle.name
			await loadData()
			return true
		}
		catch {
			return false
		}
	},

	async createTrip(name: string, type: TripType, year: string, values: TemplateValues) {
		if (!vaultHandle)
return

		const template = getTemplate(templates, type)
		if (!template)
throw new Error(`Template not found for ${type}`)

		const path = getTargetPath(type, null, year, name)
		const content = processTemplate(template, { ...values, tripName: name })

		await writeFile(vaultHandle, path, content)
		await loadData()

		return path
	},

	async createItem(
		tripName: string,
		tripType: TripType,
		year: string,
		itemType: ItemType,
		itemName: string,
		values: TemplateValues,
	) {
		if (!vaultHandle)
return

		const template = getTemplate(templates, itemType)
		if (!template)
throw new Error(`Template not found for ${itemType}`)

		const path = getTargetPath(tripType, itemType, year, tripName, itemName)
		const content = processTemplate(template, { ...values, tripName })

		await writeFile(vaultHandle, path, content)
		await loadData()

		return path
	},

	async closeVault() {
		vaultHandle = null
		vaultName = ''
		travelTree = {}
		templates = []
		error = null
		await clearVaultHandle()
	},

	async reload() {
		await loadData()
	},

	findTrip(path: string): TripData | undefined {
		for (const trips of Object.values(travelTree)) {
			const found = trips.find(t => t.path === path)
			if (found)
return found
		}
		return undefined
	},
}
