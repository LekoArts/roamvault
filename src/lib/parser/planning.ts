const DATE_HEADING_RE = /^## (\d{2}\.\d{2}\.\d{4})/
const HEADING_RE = /^#{2,3} /
const WIKI_LINK_RE = /^- \[\[(.+?)\]\]$/

/**
 * Parse day-grouped activities from a planning item's markdown body.
 *
 * Expects `## DD.MM.YYYY` headings with `### Activities` sub-headings
 * containing `- [[Name]]` list items.
 */
export function parseDayActivities(content: string): Map<string, string[]> {
	const result = new Map<string, string[]>()
	const lines = content.split('\n')

	let currentDate: string | null = null
	let inActivities = false

	for (const line of lines) {
		const dateMatch = DATE_HEADING_RE.exec(line)
		if (dateMatch) {
			currentDate = dateMatch[1]
			inActivities = false
			result.set(currentDate, [])
			continue
		}

		if (currentDate && line.trim() === '### Activities') {
			inActivities = true
			continue
		}

		if (HEADING_RE.test(line) && !line.startsWith('### Activities')) {
			inActivities = false
			continue
		}

		if (inActivities && currentDate) {
			const linkMatch = WIKI_LINK_RE.exec(line)
			if (linkMatch) {
				result.get(currentDate)!.push(linkMatch[1])
			}
		}
	}

	return result
}

/**
 * Add or remove a `- [[Name]]` line under the `### Activities` heading
 * for the given date in a planning item's markdown body.
 */
export function updateDayActivity(
	content: string,
	date: string,
	activityName: string,
	action: 'add' | 'remove',
): string {
	const lines = content.split('\n')
	const result: string[] = []

	let currentDate: string | null = null
	let inActivities = false
	let removed = false

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]

		const dateMatch = DATE_HEADING_RE.exec(line)
		if (dateMatch) {
			currentDate = dateMatch[1]
			inActivities = false
			result.push(line)
			continue
		}

		if (currentDate && line.trim() === '### Activities') {
			inActivities = true
			result.push(line)

			if (action === 'add' && currentDate === date) {
				let j = i + 1
				const activitiesLines: string[] = []
				while (j < lines.length) {
					const next = lines[j]
					if (HEADING_RE.test(next))
						break
					activitiesLines.push(next)
					j++
				}

				// Push existing non-empty activity lines, then append the new one directly
				for (const al of activitiesLines) {
					if (al.trim() !== '') {
						result.push(al)
					}
				}
				result.push(`- [[${activityName}]]`)

				i = j - 1
				inActivities = false
				currentDate = null
			}
			continue
		}

		if (action === 'remove' && inActivities && currentDate === date && !removed) {
			const linkMatch = WIKI_LINK_RE.exec(line)
			if (linkMatch && linkMatch[1] === activityName) {
				removed = true
				continue
			}
		}

		if (HEADING_RE.test(line) && !line.startsWith('### Activities')) {
			inActivities = false
		}

		result.push(line)
	}

	return result.join('\n')
}
