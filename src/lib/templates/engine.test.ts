import type { TemplateDefinition } from '../models/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseFrontmatter } from '../parser/frontmatter'
import {
	detectTripType,
	detectTripTypeFromFile,
	getEditableFields,
	getTargetPath,
	getTemplateForItemType,
	getTemplateForTripType,
	loadTemplates,
	processTemplate,
} from './engine'

vi.mock('../services/vault', () => ({
	listDirectory: vi.fn(),
	readFile: vi.fn(),
}))

// Helper to build a TemplateDefinition from raw markdown
function makeTemplate(type: string, content: string): TemplateDefinition {
	const { data } = parseFrontmatter(content)
	return { type, content, frontmatter: data }
}

const SIMPLE_TEMPLATE = `---
base: "[[Travel.base]]"
banner:
startDate: "{{date}}"
endDate: "{{date}}"
Persons: []
Done: false
---
## Content

"{{date}}" flight`

const ADVANCED_TEMPLATE = `---
base: "[[Travel.base]]"
banner:
startDate: "{{date}}"
endDate: "{{date}}"
Persons: []
Done: false
---
## Itinerary

![[Planning.base]]

## Activities

![[Activities.base]]

{{date:DD.MM.YYYY}} departure`

const ROADTRIP_TEMPLATE = `---
base: "[[Travel.base]]"
banner:
startDate: "{{date}}"
endDate: "{{date}}"
Persons: []
Done: false
---
## Itinerary

![[Roadtrip.base]]`

const ACTIVITY_TEMPLATE = `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[TODO]]"
Location:
Done: false
---
`

const PLANNING_TEMPLATE = `---
base: "[[_templates/Bases/Planning.base]]"
backlink: "[[TODO]]"
startDate: "{{date}}"
endDate: "{{date}}"
Activities:
---
`

const STOP_TEMPLATE = `---
base: "[[_templates/Bases/Roadtrip.base]]"
backlink: "[[TODO]]"
startDate: "{{date}}"
endDate: "{{date}}"
---
## Location
`

describe('loadTemplates', () => {
	it('loads and parses template files from _templates directory', async () => {
		const { listDirectory, readFile } = await import('../services/vault')
		const mockListDirectory = vi.mocked(listDirectory)
		const mockReadFile = vi.mocked(readFile)

		mockListDirectory.mockResolvedValue([
			{ name: 'Travel_Simple.md', kind: 'file', path: '_templates/Travel_Simple.md' },
			{ name: 'Activity.md', kind: 'file', path: '_templates/Activity.md' },
			{ name: 'SomeFolder', kind: 'directory', path: '_templates/SomeFolder' },
			{ name: 'readme.txt', kind: 'file', path: '_templates/readme.txt' },
		])

		mockReadFile.mockImplementation((_root, path) => {
			if (path === '_templates/Travel_Simple.md')
				return Promise.resolve(SIMPLE_TEMPLATE)
			if (path === '_templates/Activity.md')
				return Promise.resolve(ACTIVITY_TEMPLATE)
			return Promise.reject(new Error('not found'))
		})

		const root = {} as FileSystemDirectoryHandle
		const templates = await loadTemplates(root)

		expect(templates).toHaveLength(2)
		expect(templates[0].type).toBe('Travel_Simple')
		expect(templates[0].frontmatter.base).toBe('[[Travel.base]]')
		expect(templates[1].type).toBe('Activity')
	})

	it('returns empty array when no .md files', async () => {
		const { listDirectory } = await import('../services/vault')
		const mockListDirectory = vi.mocked(listDirectory)

		mockListDirectory.mockResolvedValue([
			{ name: 'SomeFolder', kind: 'directory', path: '_templates/SomeFolder' },
		])

		const root = {} as FileSystemDirectoryHandle
		const templates = await loadTemplates(root)
		expect(templates).toHaveLength(0)
	})
})

describe('detectTripType', () => {
	it('returns Travel_Simple when base does not include Travel.base', () => {
		expect(detectTripType({ base: '[[Other]]' })).toBe('Travel_Simple')
	})

	it('returns Travel_Simple when base includes Travel.base (fallback)', () => {
		expect(detectTripType({ base: '[[Travel.base]]' })).toBe('Travel_Simple')
	})

	it('returns Travel_Simple when no base property', () => {
		expect(detectTripType({})).toBe('Travel_Simple')
	})
})

describe('detectTripTypeFromFile', () => {
	it('returns Travel_Simple when base does not include Travel.base', () => {
		expect(detectTripTypeFromFile('content', { base: '[[Other]]' })).toBe('Travel_Simple')
	})

	it('returns Travel_Roadtrip when content has Roadtrip.base embed', () => {
		expect(detectTripTypeFromFile(
			'## Itinerary\n![[Roadtrip.base]]',
			{ base: '[[Travel.base]]' },
		)).toBe('Travel_Roadtrip')
	})

	it('returns Travel_Advanced when content has Planning.base embed', () => {
		expect(detectTripTypeFromFile(
			'## Itinerary\n![[Planning.base]]\n![[Activities.base]]',
			{ base: '[[Travel.base]]' },
		)).toBe('Travel_Advanced')
	})

	it('returns Travel_Advanced when content has Activities.base embed', () => {
		expect(detectTripTypeFromFile(
			'![[Activities.base]]',
			{ base: '[[Travel.base]]' },
		)).toBe('Travel_Advanced')
	})

	it('returns Travel_Simple when base matches but no special embeds', () => {
		expect(detectTripTypeFromFile(
			'Just some content',
			{ base: '[[Travel.base]]' },
		)).toBe('Travel_Simple')
	})
})

describe('getTemplateForTripType', () => {
	const templates: TemplateDefinition[] = [
		makeTemplate('Travel_Simple', SIMPLE_TEMPLATE),
		makeTemplate('Travel_Advanced', ADVANCED_TEMPLATE),
		makeTemplate('Travel_Roadtrip', ROADTRIP_TEMPLATE),
	]

	it('finds Travel_Simple template', () => {
		const t = getTemplateForTripType(templates, 'Travel_Simple')
		expect(t).toBeDefined()
		expect(t!.type).toBe('Travel_Simple')
	})

	it('finds Travel_Advanced template', () => {
		const t = getTemplateForTripType(templates, 'Travel_Advanced')
		expect(t).toBeDefined()
		expect(t!.type).toBe('Travel_Advanced')
	})

	it('returns undefined for missing template', () => {
		expect(getTemplateForTripType([], 'Travel_Simple')).toBeUndefined()
	})
})

describe('getTemplateForItemType', () => {
	const templates: TemplateDefinition[] = [
		makeTemplate('Activity', ACTIVITY_TEMPLATE),
		makeTemplate('Planning', PLANNING_TEMPLATE),
		makeTemplate('Stop', STOP_TEMPLATE),
	]

	it('finds Activity template', () => {
		expect(getTemplateForItemType(templates, 'Activity')?.type).toBe('Activity')
	})

	it('finds Planning template', () => {
		expect(getTemplateForItemType(templates, 'Planning')?.type).toBe('Planning')
	})

	it('finds Stop template', () => {
		expect(getTemplateForItemType(templates, 'Stop')?.type).toBe('Stop')
	})

	it('returns undefined for missing template', () => {
		expect(getTemplateForItemType([], 'Activity')).toBeUndefined()
	})
})

describe('getTargetPath', () => {
	it('returns flat file for simple trip', () => {
		expect(getTargetPath('Travel_Simple', null, '2026', 'London'))
			.toBe('Travel/2026/London.md')
	})

	it('returns nested file for advanced trip', () => {
		expect(getTargetPath('Travel_Advanced', null, '2026', 'Summer Vacation'))
			.toBe('Travel/2026/Summer Vacation/Summer Vacation.md')
	})

	it('returns nested file for roadtrip', () => {
		expect(getTargetPath('Travel_Roadtrip', null, '2026', 'Albanien Roadtrip'))
			.toBe('Travel/2026/Albanien Roadtrip/Albanien Roadtrip.md')
	})

	it('returns Activity sub-item path', () => {
		expect(getTargetPath('Travel_Advanced', 'Activity', '2026', 'Trip', 'Visit Museum'))
			.toBe('Travel/2026/Trip/Activities/Visit Museum.md')
	})

	it('returns Planning sub-item path', () => {
		expect(getTargetPath('Travel_Advanced', 'Planning', '2026', 'Trip', 'Day 1'))
			.toBe('Travel/2026/Trip/Planning/Day 1.md')
	})

	it('returns Stop sub-item path', () => {
		expect(getTargetPath('Travel_Roadtrip', 'Stop', '2026', 'Roadtrip', 'Tirana'))
			.toBe('Travel/2026/Roadtrip/Roadtrip/Tirana.md')
	})
})

describe('processTemplate', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-15'))
	})

	it('fills startDate and endDate from values', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
		})
		const { data } = parseFrontmatter(result)
		expect(data.startDate).toBe('2026-07-01')
		expect(data.endDate).toBe('2026-07-10')
	})

	it('falls back to current date for unfilled date placeholders', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {})
		const { data } = parseFrontmatter(result)
		expect(data.startDate).toBe('2026-03-15')
		expect(data.endDate).toBe('2026-03-15')
	})

	it('fills Persons array', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
			Persons: ['Alice', 'Bob'],
		})
		const { data } = parseFrontmatter(result)
		expect(data.Persons).toEqual(['Alice', 'Bob'])
	})

	it('skips empty Persons array', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
			Persons: [],
		})
		const { data } = parseFrontmatter(result)
		expect(data.Persons).toEqual([])
	})

	it('fills banner URL', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
			banner: 'https://example.com/img.jpg',
		})
		const { data } = parseFrontmatter(result)
		expect(data.banner).toBe('https://example.com/img.jpg')
	})

	it('preserves base property unchanged', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
		})
		const { data } = parseFrontmatter(result)
		expect(data.base).toBe('[[Travel.base]]')
	})

	it('sets backlink for sub-items', () => {
		const template = makeTemplate('Activity', ACTIVITY_TEMPLATE)
		const result = processTemplate(template, { tripName: 'Summer Vacation' })
		const { data } = parseFrontmatter(result)
		expect(data.backlink).toBe('[[Summer Vacation]]')
	})

	it('fills Location for Activity', () => {
		const template = makeTemplate('Activity', ACTIVITY_TEMPLATE)
		const result = processTemplate(template, {
			tripName: 'Trip',
			Location: 'Seoul',
		})
		const { data } = parseFrontmatter(result)
		expect(data.Location).toBe('Seoul')
	})

	it('sets Done to false by default', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
		})
		const { data } = parseFrontmatter(result)
		expect(data.Done).toBe(false)
	})

	it('replaces {{date}} placeholders in body with startDate', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
		})
		const { content } = parseFrontmatter(result)
		expect(content).toContain('2026-07-01 flight')
		expect(content).not.toContain('{{date}}')
	})

	it('replaces {{date:DD.MM.YYYY}} placeholders in body', () => {
		const template = makeTemplate('Travel_Advanced', ADVANCED_TEMPLATE)
		const result = processTemplate(template, {
			startDate: '2026-07-01',
			endDate: '2026-07-10',
		})
		const { content } = parseFrontmatter(result)
		expect(content).toContain('01.07.2026 departure')
		expect(content).not.toContain('{{date:DD.MM.YYYY}}')
	})

	it('fills dates for Stop sub-items', () => {
		const template = makeTemplate('Stop', STOP_TEMPLATE)
		const result = processTemplate(template, {
			tripName: 'Albanien',
			startDate: '2026-09-17',
			endDate: '2026-09-18',
		})
		const { data } = parseFrontmatter(result)
		expect(data.startDate).toBe('2026-09-17')
		expect(data.endDate).toBe('2026-09-18')
		expect(data.backlink).toBe('[[Albanien]]')
	})

	vi.useRealTimers()
})

describe('getEditableFields', () => {
	it('excludes base from trip templates', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const fields = getEditableFields(template, false)
		expect(fields.find(f => f.key === 'base')).toBeUndefined()
	})

	it('returns banner as url type', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const fields = getEditableFields(template, false)
		const banner = fields.find(f => f.key === 'banner')
		expect(banner).toBeDefined()
		expect(banner!.type).toBe('url')
	})

	it('returns date fields as date type', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const fields = getEditableFields(template, false)
		expect(fields.find(f => f.key === 'startDate')?.type).toBe('date')
		expect(fields.find(f => f.key === 'endDate')?.type).toBe('date')
	})

	it('returns Persons as array type', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const fields = getEditableFields(template, false)
		expect(fields.find(f => f.key === 'Persons')?.type).toBe('array')
	})

	it('returns Done as boolean type', () => {
		const template = makeTemplate('Travel_Simple', SIMPLE_TEMPLATE)
		const fields = getEditableFields(template, false)
		expect(fields.find(f => f.key === 'Done')?.type).toBe('boolean')
	})

	it('excludes backlink for sub-items', () => {
		const template = makeTemplate('Activity', ACTIVITY_TEMPLATE)
		const fields = getEditableFields(template, true)
		expect(fields.find(f => f.key === 'backlink')).toBeUndefined()
	})

	it('includes backlink for non-sub-items', () => {
		const template = makeTemplate('Activity', ACTIVITY_TEMPLATE)
		const fields = getEditableFields(template, false)
		expect(fields.find(f => f.key === 'backlink')).toBeDefined()
	})

	it('returns Location as text type for Activity', () => {
		const template = makeTemplate('Activity', ACTIVITY_TEMPLATE)
		const fields = getEditableFields(template, true)
		expect(fields.find(f => f.key === 'Location')?.type).toBe('text')
	})

	it('skips Activities field for Planning sub-items', () => {
		const template = makeTemplate('Planning', PLANNING_TEMPLATE)
		const fields = getEditableFields(template, true)
		expect(fields.find(f => f.key === 'Activities')).toBeUndefined()
	})

	it('returns correct fields for Planning sub-item', () => {
		const template = makeTemplate('Planning', PLANNING_TEMPLATE)
		const fields = getEditableFields(template, true)
		const keys = fields.map(f => f.key)
		expect(keys).toEqual(['startDate', 'endDate'])
	})

	it('returns correct fields for Activity sub-item', () => {
		const template = makeTemplate('Activity', ACTIVITY_TEMPLATE)
		const fields = getEditableFields(template, true)
		const keys = fields.map(f => f.key)
		expect(keys).toEqual(['Location', 'Done'])
	})

	it('returns correct fields for Stop sub-item', () => {
		const template = makeTemplate('Stop', STOP_TEMPLATE)
		const fields = getEditableFields(template, true)
		const keys = fields.map(f => f.key)
		expect(keys).toEqual(['startDate', 'endDate'])
	})
})
