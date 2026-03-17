import type { ItemType, TemplateDefinition, TripClassificationMetadata, TripType } from '../models/types'
import { parseFrontmatter, serializeFrontmatter } from '../parser/frontmatter'
import { listDirectory, readFile } from '../services/vault'

const DATE_PLACEHOLDER = /"?\{\{date\}\}"?/g
const DATE_FMT_PLACEHOLDER = /\{\{date:DD\.MM\.YYYY\}\}/g

export async function loadTemplates(
	root: FileSystemDirectoryHandle,
): Promise<TemplateDefinition[]> {
	const entries = await listDirectory(root, '_templates')
	const templates: TemplateDefinition[] = []

	for (const entry of entries) {
		if (entry.kind !== 'file' || !entry.name.endsWith('.md'))
			continue

		const raw = await readFile(root, entry.path)
		const { data } = parseFrontmatter(raw)
		const type = entry.name.replace('.md', '')

		templates.push({ type, content: raw, frontmatter: data })
	}

	return templates
}

export function detectTripClassification(
	content: string,
	frontmatter: Record<string, unknown>,
): TripClassificationMetadata {
	const base = String(frontmatter.base ?? '')
	const hasTravelBase = base.includes('Travel.base')
	const hasRoadtripBase = content.includes('![[Roadtrip.base]]')
	const hasPlanningBase = content.includes('![[Planning.base]]')
	const hasActivitiesBase = content.includes('![[Activities.base]]')

	let matchedType: TripType = 'Travel_Simple'
	if (hasTravelBase) {
		if (hasRoadtripBase)
			matchedType = 'Travel_Roadtrip'
		else if (hasPlanningBase || hasActivitiesBase)
			matchedType = 'Travel_Advanced'
	}

	return {
		base,
		hasTravelBase,
		hasRoadtripBase,
		hasPlanningBase,
		hasActivitiesBase,
		matchedType,
	}
}

export function detectTripTypeFromFile(
	content: string,
	frontmatter: Record<string, unknown>,
): TripType {
	return detectTripClassification(content, frontmatter).matchedType
}

export function getTemplate(
	templates: TemplateDefinition[],
	type: TripType | ItemType,
): TemplateDefinition | undefined {
	return templates.find(t => t.type === type)
}

function formatDate(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

function formatDateDisplay(date: Date): string {
	const d = String(date.getDate()).padStart(2, '0')
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const y = date.getFullYear()
	return `${d}.${m}.${y}`
}

export interface TemplateValues {
	tripName?: string
	[key: string]: unknown
}

export function processTemplate(
	template: TemplateDefinition,
	values: TemplateValues,
): string {
	const { data, content } = parseFrontmatter(template.content)

	// Set backlink for sub-items
	if ('backlink' in data && values.tripName)
		data.backlink = `[[${values.tripName}]]`

	// Fill frontmatter properties from values
	for (const key of Object.keys(data)) {
		if (key === 'base' || key === 'backlink')
			continue

		if (key in values && values[key] !== undefined && values[key] !== '') {
			const v = values[key]
			// Skip empty arrays
			if (Array.isArray(v) && v.length === 0)
				continue
			data[key] = v
		}
		else if ((key === 'startDate' || key === 'endDate') && data[key] === '{{date}}') {
			data[key] = formatDate(new Date())
		}
		else if (key === 'Done') {
			data[key] = false
		}
	}

	// Replace date placeholders in body content
	const now = new Date()
	const startStr = typeof values.startDate === 'string' ? values.startDate : formatDate(now)
	const fallbackDate = new Date(startStr)
	const processedContent = content
		.replace(DATE_PLACEHOLDER, formatDate(fallbackDate))
		.replace(DATE_FMT_PLACEHOLDER, formatDateDisplay(fallbackDate))

	return serializeFrontmatter(data, processedContent)
}

export function getTargetPath(
	tripType: TripType,
	itemType: ItemType | null,
	year: string,
	tripName: string,
	itemName?: string,
): string {
	const base = `Travel/${year}`

	if (!itemType) {
		// Creating a trip
		if (tripType === 'Travel_Simple')
			return `${base}/${tripName}.md`

		return `${base}/${tripName}/${tripName}.md`
	}

	// Creating a sub-item
	switch (itemType) {
		case 'Activity':
			return `${base}/${tripName}/Activities/${itemName}.md`
		case 'Planning':
			return `${base}/${tripName}/Planning/${itemName}.md`
		case 'Stop':
			return `${base}/${tripName}/Roadtrip/${itemName}.md`
	}
}

export function getEditableFields(
	template: TemplateDefinition,
	isSubItem: boolean,
): { key: string, type: 'text' | 'date' | 'url' | 'array' | 'boolean' }[] {
	const fields: { key: string, type: 'text' | 'date' | 'url' | 'array' | 'boolean' }[] = []
	const fm = template.frontmatter

	for (const [key, value] of Object.entries(fm)) {
		// Skip auto-filled fields
		if (key === 'base')
			continue
		if (key === 'backlink' && isSubItem)
			continue

		if (key === 'banner') {
			fields.push({ key, type: 'url' })
		}
		else if (key === 'startDate' || key === 'endDate') {
			fields.push({ key, type: 'date' })
		}
		else if (key === 'Persons' || Array.isArray(value)) {
			fields.push({ key, type: 'array' })
		}
		else if (key === 'Done' || typeof value === 'boolean') {
			fields.push({ key, type: 'boolean' })
		}
		else if (key === 'Activities' && isSubItem) {
			// Skip Activities field on Planning items — starts empty
			continue
		}
		else if (typeof value === 'string' || value === null || value === undefined || value === '') {
			fields.push({ key, type: 'text' })
		}
	}

	return fields
}
