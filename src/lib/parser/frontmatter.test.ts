import { describe, expect, it } from 'vitest'
import { parseFrontmatter, serializeFrontmatter } from './frontmatter'

describe('parseFrontmatter', () => {
	it('returns empty data and full content when no frontmatter', () => {
		const md = '# Hello\n\nSome content'
		const result = parseFrontmatter(md)
		expect(result.data).toEqual({})
		expect(result.content).toBe(md)
	})

	it('parses simple string values', () => {
		const md = '---\ntitle: My Title\nauthor: John\n---\nBody'
		const result = parseFrontmatter(md)
		expect(result.data.title).toBe('My Title')
		expect(result.data.author).toBe('John')
		expect(result.content).toBe('Body')
	})

	it('parses quoted strings and strips quotes', () => {
		const md = '---\nbase: "[[Travel.base]]"\nname: \'single\'\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.base).toBe('[[Travel.base]]')
		expect(result.data.name).toBe('single')
	})

	it('parses boolean values', () => {
		const md = '---\nDone: false\nActive: true\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.Done).toBe(false)
		expect(result.data.Active).toBe(true)
	})

	it('parses null and empty values', () => {
		const md = '---\nLocation:\nbanner: null\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.Location).toBeNull()
		expect(result.data.banner).toBeNull()
	})

	it('parses empty arrays', () => {
		const md = '---\nPersons: []\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.Persons).toEqual([])
	})

	it('parses YAML list arrays', () => {
		const md = '---\nPersons:\n  - Alice\n  - Bob\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.Persons).toEqual(['Alice', 'Bob'])
	})

	it('parses date placeholder strings', () => {
		const md = '---\nstartDate: "{{date}}"\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.startDate).toBe('{{date}}')
	})

	it('parses unquoted date strings', () => {
		const md = '---\nstartDate: 2026-04-06\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.startDate).toBe('2026-04-06')
	})

	it('parses wikilinks in arrays', () => {
		const md = '---\nActivities:\n  - "[[Singapur - Fotos]]"\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.Activities).toEqual(['[[Singapur - Fotos]]'])
	})

	it('preserves body content after frontmatter', () => {
		const md = '---\ntitle: Test\n---\n## Heading\n\nParagraph'
		const result = parseFrontmatter(md)
		expect(result.content).toBe('## Heading\n\nParagraph')
	})

	it('handles Windows-style line endings', () => {
		const md = '---\r\ntitle: Test\r\n---\r\nBody'
		const result = parseFrontmatter(md)
		expect(result.data.title).toBe('Test')
		expect(result.content).toBe('Body')
	})

	it('parses real Activity template', () => {
		const md = `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[TODO]]"
Location:
Done: false
---
`
		const result = parseFrontmatter(md)
		expect(result.data.base).toBe('[[_templates/Bases/Activities.base]]')
		expect(result.data.backlink).toBe('[[TODO]]')
		expect(result.data.Location).toBeNull()
		expect(result.data.Done).toBe(false)
	})

	it('parses real Planning template', () => {
		const md = `---
base: "[[_templates/Bases/Planning.base]]"
backlink: "[[TODO]]"
startDate: "{{date}}"
endDate: "{{date}}"
Activities:
---
`
		const result = parseFrontmatter(md)
		expect(result.data.startDate).toBe('{{date}}')
		expect(result.data.endDate).toBe('{{date}}')
		expect(result.data.Activities).toBeNull()
	})

	it('parses URL values without quoting', () => {
		const md = '---\nbanner: https://example.com/image.jpg\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.banner).toBe('https://example.com/image.jpg')
	})

	it('handles multiple arrays in sequence', () => {
		const md = '---\nTags:\n  - travel\n  - europe\nPersons:\n  - Alice\n---\n'
		const result = parseFrontmatter(md)
		expect(result.data.Tags).toEqual(['travel', 'europe'])
		expect(result.data.Persons).toEqual(['Alice'])
	})
})

describe('serializeFrontmatter', () => {
	it('serializes simple string values', () => {
		const result = serializeFrontmatter({ title: 'Hello' }, 'Body')
		expect(result).toBe('---\ntitle: Hello\n---\nBody')
	})

	it('serializes null values as empty key', () => {
		const result = serializeFrontmatter({ Location: null }, '')
		expect(result).toBe('---\nLocation:\n---\n')
	})

	it('serializes undefined values as empty key', () => {
		const result = serializeFrontmatter({ Location: undefined }, '')
		expect(result).toBe('---\nLocation:\n---\n')
	})

	it('serializes empty string as empty key', () => {
		const result = serializeFrontmatter({ Location: '' }, '')
		expect(result).toBe('---\nLocation:\n---\n')
	})

	it('serializes empty arrays', () => {
		const result = serializeFrontmatter({ Persons: [] }, '')
		expect(result).toBe('---\nPersons: []\n---\n')
	})

	it('serializes arrays with items', () => {
		const result = serializeFrontmatter({ Persons: ['Alice', 'Bob'] }, '')
		expect(result).toBe('---\nPersons:\n  - Alice\n  - Bob\n---\n')
	})

	it('serializes booleans', () => {
		const result = serializeFrontmatter({ Done: false, Active: true }, '')
		expect(result).toBe('---\nDone: false\nActive: true\n---\n')
	})

	it('quotes wikilinks', () => {
		const result = serializeFrontmatter({ base: '[[Travel.base]]' }, '')
		expect(result).toBe('---\nbase: "[[Travel.base]]"\n---\n')
	})

	it('quotes template placeholders', () => {
		const result = serializeFrontmatter({ startDate: '{{date}}' }, '')
		expect(result).toBe('---\nstartDate: "{{date}}"\n---\n')
	})

	it('quotes string values that look like booleans', () => {
		const result = serializeFrontmatter({ flag: 'true' }, '')
		expect(result).toBe('---\nflag: "true"\n---\n')
	})

	it('does not quote plain strings', () => {
		const result = serializeFrontmatter({ title: 'My Trip' }, '')
		expect(result).toBe('---\ntitle: My Trip\n---\n')
	})

	it('preserves body content', () => {
		const result = serializeFrontmatter({ title: 'Test' }, '## Heading\n\nContent')
		expect(result).toBe('---\ntitle: Test\n---\n## Heading\n\nContent')
	})

	it('roundtrips with parseFrontmatter', () => {
		const original = `---
base: "[[Travel.base]]"
banner:
startDate: 2026-04-06
endDate: 2026-04-10
Persons:
  - Alice
  - Bob
Done: false
---
## Content`
		const { data, content } = parseFrontmatter(original)
		const serialized = serializeFrontmatter(data, content)
		const reparsed = parseFrontmatter(serialized)
		expect(reparsed.data).toEqual(data)
		expect(reparsed.content).toBe(content)
	})
})
