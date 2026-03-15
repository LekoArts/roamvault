const dateFormatter = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
})

/** Format a YYYY-MM-DD string for display using locale-aware formatting. */
export function formatDate(dateStr: unknown): string {
	if (typeof dateStr !== 'string' || !dateStr)
		return ''
	const date = new Date(`${dateStr}T00:00:00`)
	if (Number.isNaN(date.getTime()))
		return String(dateStr)
	return dateFormatter.format(date)
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
