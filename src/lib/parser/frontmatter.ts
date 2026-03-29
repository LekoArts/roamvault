const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
const LINE_SPLIT_RE = /\r?\n/
const ARRAY_ITEM_RE = /^[\t ]+- (.*)$/
const KV_RE = /^(\w+)[\t ]*:[\t ]?(.*)$/

export function parseFrontmatter(markdown: string): { data: Record<string, unknown>, content: string } {
	const match = markdown.match(FRONTMATTER_RE)
	if (!match)
		return { data: {}, content: markdown }

	const data = parseYamlSimple(match[1])
	const content = match[2]
	return { data, content }
}

function parseYamlSimple(yaml: string): Record<string, unknown> {
	const result: Record<string, unknown> = {}
	const lines = yaml.split(LINE_SPLIT_RE)
	let currentKey: string | null = null
	let currentArray: unknown[] | null = null

	for (const line of lines) {
		// Array item (indented `- value`)
		const arrayMatch = line.match(ARRAY_ITEM_RE)
		if (arrayMatch && currentKey) {
			if (!currentArray) {
				currentArray = []
				result[currentKey] = currentArray
			}
			currentArray.push(parseScalar(arrayMatch[1]))
			continue
		}

		// Flush previous array
		if (currentArray) {
			currentArray = null
		}

		// Key-value pair
		const kvMatch = line.match(KV_RE)
		if (kvMatch) {
			currentKey = kvMatch[1]
			const rawValue = kvMatch[2].trim()

			if (rawValue === '' || rawValue === 'null') {
				result[currentKey] = null
			}
			else if (rawValue === '[]') {
				result[currentKey] = []
			}
			else {
				result[currentKey] = parseScalar(rawValue)
			}
		}
	}

	return result
}

function parseScalar(value: string): unknown {
	if (
		(value.startsWith('"') && value.endsWith('"'))
		|| (value.startsWith('\'') && value.endsWith('\''))
	) {
		return value.slice(1, -1)
	}

	if (value === 'true')
		return true
	if (value === 'false')
		return false

	return value
}

export function serializeFrontmatter(data: Record<string, unknown>, content: string): string {
	const lines: string[] = []

	for (const [key, value] of Object.entries(data)) {
		if (value === null || value === undefined || value === '') {
			lines.push(`${key}:`)
		}
		else if (Array.isArray(value)) {
			if (value.length === 0) {
				lines.push(`${key}: []`)
			}
			else {
				lines.push(`${key}:`)
				for (const item of value) {
					const str = String(item)
					if (needsQuotes(str)) {
						lines.push(`  - "${str}"`)
					}
					else {
						lines.push(`  - ${str}`)
					}
				}
			}
		}
		else if (typeof value === 'boolean') {
			lines.push(`${key}: ${value}`)
		}
		else {
			const str = String(value)
			if (needsQuotes(str)) {
				lines.push(`${key}: "${str}"`)
			}
			else {
				lines.push(`${key}: ${str}`)
			}
		}
	}

	return `---\n${lines.join('\n')}\n---\n${content}`
}

function needsQuotes(value: string): boolean {
	if (value.startsWith('[[') || value.includes('{{'))
		return true
	if (value === 'true' || value === 'false' || value === 'null')
		return true
	return false
}
