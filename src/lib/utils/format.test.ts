import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange } from './format'

describe('formatDate', () => {
	it('formats a YYYY-MM-DD string', () => {
		const result = formatDate('2026-04-06')
		expect(result).toBe('06.04.2026')
	})

	it('returns empty string for empty input', () => {
		expect(formatDate('')).toBe('')
	})

	it('returns empty string for non-string input', () => {
		expect(formatDate(null)).toBe('')
		expect(formatDate(undefined)).toBe('')
		expect(formatDate(42)).toBe('')
	})

	it('returns original string for invalid date', () => {
		expect(formatDate('not-a-date')).toBe('not-a-date')
	})

	it('handles single-digit months and days', () => {
		const result = formatDate('2026-01-05')
		expect(result).toBe('05.01.2026')
	})
})

describe('formatDateRange', () => {
	it('formats a range with different start and end', () => {
		const result = formatDateRange('2026-04-06', '2026-04-10')
		expect(result).toContain('06.04.2026')
		expect(result).toContain('10.04.2026')
		expect(result).toContain('\u2013')
	})

	it('returns single date when start equals end', () => {
		const result = formatDateRange('2026-04-06', '2026-04-06')
		expect(result).toBe('06.04.2026')
	})

	it('returns single date when no end date', () => {
		const result = formatDateRange('2026-04-06', '')
		expect(result).toBe('06.04.2026')
	})

	it('returns empty string when no start date', () => {
		expect(formatDateRange('', '2026-04-10')).toBe('')
		expect(formatDateRange(null, null)).toBe('')
	})
})
