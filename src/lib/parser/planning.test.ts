import { describe, expect, it } from 'vitest'
import { parseDayActivities, updateDayActivity } from './planning'

const multiDayBody = `
## 03.06.2026

### Activities
- [[Seoul - Photos]]

## 04.06.2026

### Activities
- [[Seoul Tower]]
`.trim()

const emptyActivitiesBody = `
## 01.06.2026

### Activities
`.trim()

const singleDayBody = `
## 02.06.2026

### Activities
- [[Singapur - Photos]]
`.trim()

describe('parseDayActivities', () => {
	it('parses multi-day body with activities under each day', () => {
		const result = parseDayActivities(multiDayBody)
		expect(result.size).toBe(2)
		expect(result.get('03.06.2026')).toEqual(['Seoul - Photos'])
		expect(result.get('04.06.2026')).toEqual(['Seoul Tower'])
	})

	it('parses single-day body', () => {
		const result = parseDayActivities(singleDayBody)
		expect(result.size).toBe(1)
		expect(result.get('02.06.2026')).toEqual(['Singapur - Photos'])
	})

	it('parses empty activities sections', () => {
		const result = parseDayActivities(emptyActivitiesBody)
		expect(result.size).toBe(1)
		expect(result.get('01.06.2026')).toEqual([])
	})

	it('handles body with no date headings', () => {
		const result = parseDayActivities('Some random text\nwith no headings')
		expect(result.size).toBe(0)
	})

	it('handles multiple activities under one day', () => {
		const body = `## 03.06.2026

### Activities
- [[Activity A]]
- [[Activity B]]
- [[Activity C]]`
		const result = parseDayActivities(body)
		expect(result.get('03.06.2026')).toEqual(['Activity A', 'Activity B', 'Activity C'])
	})
})

describe('updateDayActivity', () => {
	it('adds an activity to a specific day', () => {
		const result = updateDayActivity(emptyActivitiesBody, '01.06.2026', 'New Activity', 'add')
		expect(result).toContain('- [[New Activity]]')
		const parsed = parseDayActivities(result)
		expect(parsed.get('01.06.2026')).toEqual(['New Activity'])
	})

	it('adds an activity to a day that already has activities', () => {
		const result = updateDayActivity(singleDayBody, '02.06.2026', 'Another Activity', 'add')
		const parsed = parseDayActivities(result)
		expect(parsed.get('02.06.2026')).toEqual(['Singapur - Photos', 'Another Activity'])
		// No blank lines between heading and list items
		expect(result).toContain('### Activities\n- [[Singapur - Photos]]\n- [[Another Activity]]')
	})

	it('does not insert blank lines when adding to an empty section', () => {
		const result = updateDayActivity(emptyActivitiesBody, '01.06.2026', 'First', 'add')
		expect(result).toContain('### Activities\n- [[First]]')
	})

	it('adds an activity to the correct day in a multi-day body', () => {
		const result = updateDayActivity(multiDayBody, '03.06.2026', 'New One', 'add')
		const parsed = parseDayActivities(result)
		expect(parsed.get('03.06.2026')).toEqual(['Seoul - Photos', 'New One'])
		expect(parsed.get('04.06.2026')).toEqual(['Seoul Tower'])
	})

	it('removes an activity from a day', () => {
		const result = updateDayActivity(multiDayBody, '03.06.2026', 'Seoul - Photos', 'remove')
		const parsed = parseDayActivities(result)
		expect(parsed.get('03.06.2026')).toEqual([])
		expect(parsed.get('04.06.2026')).toEqual(['Seoul Tower'])
	})

	it('removing the last activity leaves empty section', () => {
		const result = updateDayActivity(singleDayBody, '02.06.2026', 'Singapur - Photos', 'remove')
		const parsed = parseDayActivities(result)
		expect(parsed.get('02.06.2026')).toEqual([])
		expect(result).toContain('### Activities')
	})

	it('does nothing when removing a non-existent activity', () => {
		const result = updateDayActivity(multiDayBody, '03.06.2026', 'Does Not Exist', 'remove')
		expect(result).toBe(multiDayBody)
	})

	it('creates a new date section when adding to a date not in the body', () => {
		const result = updateDayActivity(multiDayBody, '05.06.2026', 'New Day Activity', 'add')
		const parsed = parseDayActivities(result)
		expect(parsed.size).toBe(3)
		expect(parsed.get('05.06.2026')).toEqual(['New Day Activity'])
		// Existing days are preserved
		expect(parsed.get('03.06.2026')).toEqual(['Seoul - Photos'])
		expect(parsed.get('04.06.2026')).toEqual(['Seoul Tower'])
	})

	it('creates a date section in an empty body', () => {
		const result = updateDayActivity('', '02.06.2026', 'Beach', 'add')
		const parsed = parseDayActivities(result)
		expect(parsed.size).toBe(1)
		expect(parsed.get('02.06.2026')).toEqual(['Beach'])
		expect(result).toContain('## 02.06.2026')
		expect(result).toContain('### Activities\n- [[Beach]]')
	})
})
