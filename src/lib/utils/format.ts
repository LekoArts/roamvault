const dateFormatter = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
})

const FIELD_LABELS: Record<string, string> = {
	startDate: 'Start date',
	endDate: 'End date',
	baseUrl: 'Base URL',
	coverImage: 'Cover image',
}

const CAMEL_CASE_RE = /([a-z0-9])([A-Z])/g
const SEPARATOR_RE = /[_-]+/g
const WHITESPACE_RE = /\s+/g
const FIRST_CHAR_RE = /^./

/** Format a YYYY-MM-DD string for display using locale-aware formatting. */
export function formatDate(dateStr: unknown): string {
	if (typeof dateStr !== 'string' || !dateStr)
		return ''
	const date = new Date(`${dateStr}T00:00:00`)
	if (Number.isNaN(date.getTime()))
		return String(dateStr)
	return dateFormatter.format(date)
}

/**
 * Generate an array of `DD.MM.YYYY` strings for each day in a
 * `startDate`..`endDate` range (inclusive). Inputs are `YYYY-MM-DD`.
 */
export function generateDateRange(startDate: unknown, endDate: unknown): string[] {
	if (typeof startDate !== 'string' || !startDate)
		return []
	const end = typeof endDate === 'string' && endDate ? endDate : startDate
	const start = new Date(`${startDate}T00:00:00`)
	const last = new Date(`${end}T00:00:00`)
	if (Number.isNaN(start.getTime()) || Number.isNaN(last.getTime()))
		return []
	const dates: string[] = []
	const lastTime = last.getTime()
	for (let ts = start.getTime(); ts <= lastTime; ts += 86_400_000) {
		dates.push(dateFormatter.format(new Date(ts)))
	}
	return dates
}

/** Format a date range from two YYYY-MM-DD strings. */
export function formatDateRange(start: unknown, end: unknown): string {
	const s = formatDate(start)
	if (!s)
		return ''
	const e = formatDate(end)
	if (e && e !== s)
		return `${s} \u2013 ${e}`
	return s
}

/** Convert frontmatter-style keys into user-facing labels. */
export function formatFieldLabel(key: string): string {
	if (FIELD_LABELS[key])
		return FIELD_LABELS[key]
	return key
		.replace(CAMEL_CASE_RE, '$1 $2')
		.replace(SEPARATOR_RE, ' ')
		.replace(WHITESPACE_RE, ' ')
		.trim()
		.replace(FIRST_CHAR_RE, char => char.toUpperCase())
}
