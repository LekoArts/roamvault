import type { ItemType, SubItem, TemplateDefinition, TravelTree, TripData, TripType } from '../models/types'
import type { VaultBackend } from '../services/vault-backend'
import type { TemplateValues } from '../templates/engine'
import { parseFrontmatter, serializeFrontmatter } from '../parser/frontmatter'
import { createDemoVault } from '../services/demo-vault'
import { openVault as openVaultPicker, verifyPermission } from '../services/vault'
import { createDemoBackend, createFSBackend } from '../services/vault-backend'
import { clearVaultHandle, loadVaultHandle, saveVaultHandle } from '../services/vault-store'
import { detectTripClassification, getTargetPath, getTemplate, loadTemplatesFromBackend, processTemplate } from '../templates/engine'

let backend = $state<VaultBackend | null>(null)
let vaultName = $state('')
let travelTree = $state.raw<TravelTree>({})
let templates = $state.raw<TemplateDefinition[]>([])
let loading = $state(false)
let error = $state<string | null>(null)
let hasTravelFolder = $state(false)
let hasTemplatesFolder = $state(false)
let isDemo = $state(false)

async function scanTravelData(b: VaultBackend): Promise<TravelTree> {
	const tree: TravelTree = {}

	let travelEntries
	try {
		travelEntries = await b.listDirectory('Travel')
	}
	catch {
		return tree
	}

	const yearDirs = travelEntries.filter(e => e.kind === 'directory')

	for (const yearDir of yearDirs) {
		const year = yearDir.name
		const yearEntries = await b.listDirectory(yearDir.path)
		const trips: TripData[] = []

		for (const entry of yearEntries) {
			if (entry.kind === 'file' && entry.name.endsWith('.md')) {
				// Simple trip — standalone .md file
				const content = await b.readFile(entry.path)
				const { data, content: body } = parseFrontmatter(content)
				const classificationMetadata = detectTripClassification(body, data)

				trips.push({
					name: entry.name.replace('.md', ''),
					year,
					type: classificationMetadata.matchedType,
					path: entry.path,
					frontmatter: data,
					classificationMetadata,
				})
			}
			else if (entry.kind === 'directory') {
				// Advanced or Roadtrip — folder containing main .md file
				const tripName = entry.name
				const tripFilePath = `${entry.path}/${tripName}.md`

				let content: string
				try {
					content = await b.readFile(tripFilePath)
				}
				catch {
					continue
				}

				const { data, content: body } = parseFrontmatter(content)
				const classificationMetadata = detectTripClassification(body, data)

				const trip: TripData = {
					name: tripName,
					year,
					type: classificationMetadata.matchedType,
					path: tripFilePath,
					frontmatter: data,
					classificationMetadata,
				}

				// Scan sub-items based on type
				if (classificationMetadata.matchedType === 'Travel_Advanced') {
					trip.activities = await scanSubItems(b, `${entry.path}/Activities`)
					trip.planning = await scanSubItems(b, `${entry.path}/Planning`)
				}
				else if (classificationMetadata.matchedType === 'Travel_Roadtrip') {
					trip.stops = await scanSubItems(b, `${entry.path}/Roadtrip`)
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

async function scanSubItems(b: VaultBackend, path: string): Promise<SubItem[]> {
	let entries
	try {
		entries = await b.listDirectory(path)
	}
	catch {
		return []
	}

	const items: SubItem[] = []

	for (const entry of entries) {
		if (entry.kind !== 'file' || !entry.name.endsWith('.md'))
			continue

		const raw = await b.readFile(entry.path)
		const { data, content } = parseFrontmatter(raw)

		items.push({
			name: entry.name.replace('.md', ''),
			path: entry.path,
			frontmatter: data,
			content,
		})
	}

	return items
}

async function loadData() {
	if (!backend)
		return

	loading = true
	error = null

	try {
		hasTravelFolder = await backend.directoryExists('Travel')
		hasTemplatesFolder = await backend.directoryExists('_templates')

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

		templates = await loadTemplatesFromBackend(backend)
		travelTree = await scanTravelData(backend)
	}
	catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load vault data'
	}
	finally {
		loading = false
	}
}

export const vaultStore = {
	get handle() { return backend },
	get name() { return vaultName },
	get travelTree() { return travelTree },
	get templates() { return templates },
	get loading() { return loading },
	get error() { return error },
	get hasTravelFolder() { return hasTravelFolder },
	get hasTemplatesFolder() { return hasTemplatesFolder },
	get isDemo() { return isDemo },

	async openVault() {
		try {
			const handle = await openVaultPicker()
			backend = createFSBackend(handle)
			vaultName = handle.name
			isDemo = false
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

			backend = createFSBackend(handle)
			vaultName = handle.name
			isDemo = false
			await loadData()
			return true
		}
		catch {
			return false
		}
	},

	async openDemoVault() {
		const fs = createDemoVault()
		backend = createDemoBackend(fs)
		vaultName = 'Demo Vault'
		isDemo = true
		await loadData()
	},

	async createTrip(name: string, type: TripType, year: string, values: TemplateValues) {
		if (!backend)
			return

		const template = getTemplate(templates, type)
		if (!template)
			throw new Error(`Template not found for ${type}`)

		const path = getTargetPath(type, null, year, name)
		const content = processTemplate(template, { ...values, tripName: name })

		await backend.writeFile(path, content)
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
		if (!backend)
			return

		const template = getTemplate(templates, itemType)
		if (!template)
			throw new Error(`Template not found for ${itemType}`)

		const path = getTargetPath(tripType, itemType, year, tripName, itemName)
		const content = processTemplate(template, { ...values, tripName, _itemType: itemType })

		await backend.writeFile(path, content)
		await loadData()

		return path
	},

	async closeVault() {
		backend = null
		vaultName = ''
		travelTree = {}
		templates = []
		error = null
		isDemo = false
		await clearVaultHandle()
	},

	async reload() {
		await loadData()
	},

	async debugTrip(path: string) {
		await loadData()
		return this.findTrip(path)
	},

	findTrip(path: string): TripData | undefined {
		for (const trips of Object.values(travelTree)) {
			const found = trips.find(t => t.path === path)
			if (found)
				return found
		}
		return undefined
	},

	async updateSubItem(
		itemPath: string,
		updater: (data: Record<string, unknown>) => void,
		contentUpdater?: (content: string) => string,
	) {
		if (!backend)
			return
		const raw = await backend.readFile(itemPath)
		const { data, content } = parseFrontmatter(raw)
		updater(data)
		const updatedContent = contentUpdater ? contentUpdater(content) : content
		await backend.writeFile(itemPath, serializeFrontmatter(data, updatedContent))
		await loadData()
	},
}
