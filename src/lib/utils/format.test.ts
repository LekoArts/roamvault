import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange, formatFieldLabel, generateDateRange } from './format'

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

describe('generateDateRange', () => {
	it('generates dates for a multi-day range', () => {
		const result = generateDateRange('2026-06-02', '2026-06-04')
		expect(result).toEqual(['02.06.2026', '03.06.2026', '04.06.2026'])
	})

	it('returns a single date when start equals end', () => {
		const result = generateDateRange('2026-06-02', '2026-06-02')
		expect(result).toEqual(['02.06.2026'])
	})

	it('returns a single date when no end date', () => {
		const result = generateDateRange('2026-06-02', '')
		expect(result).toEqual(['02.06.2026'])
	})

	it('returns empty array for empty start date', () => {
		expect(generateDateRange('', '2026-06-04')).toEqual([])
	})

	it('returns empty array for non-string input', () => {
		expect(generateDateRange(null, null)).toEqual([])
		expect(generateDateRange(undefined, undefined)).toEqual([])
	})

	it('returns empty array for invalid date strings', () => {
		expect(generateDateRange('not-a-date', '2026-06-04')).toEqual([])
	})
})

describe('formatFieldLabel', () => {
	it('humanizes known date keys', () => {
		expect(formatFieldLabel('startDate')).toBe('Start date')
		expect(formatFieldLabel('endDate')).toBe('End date')
	})

	it('humanizes camelCase and snake_case keys', () => {
		expect(formatFieldLabel('coverImage')).toBe('Cover image')
		expect(formatFieldLabel('trip_type')).toBe('Trip type')
	})

	it('preserves acronyms for known labels', () => {
		expect(formatFieldLabel('baseUrl')).toBe('Base URL')
	})
})
