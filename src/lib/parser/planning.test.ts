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

	it('creates a new date section after existing dates when later', () => {
		const result = updateDayActivity(multiDayBody, '05.06.2026', 'New Day Activity', 'add')
		const parsed = parseDayActivities(result)
		expect(parsed.size).toBe(3)
		expect(parsed.get('05.06.2026')).toEqual(['New Day Activity'])
		expect(parsed.get('03.06.2026')).toEqual(['Seoul - Photos'])
		expect(parsed.get('04.06.2026')).toEqual(['Seoul Tower'])
		// Chronological order: 03, 04, 05
		const keys = [...parsed.keys()]
		expect(keys).toEqual(['03.06.2026', '04.06.2026', '05.06.2026'])
	})

	it('inserts a new date section before later dates when earlier', () => {
		const result = updateDayActivity(multiDayBody, '02.06.2026', 'Early Activity', 'add')
		const parsed = parseDayActivities(result)
		expect(parsed.size).toBe(3)
		expect(parsed.get('02.06.2026')).toEqual(['Early Activity'])
		// Chronological order: 02, 03, 04
		const keys = [...parsed.keys()]
		expect(keys).toEqual(['02.06.2026', '03.06.2026', '04.06.2026'])
	})

	it('inserts a new date section between existing dates', () => {
		// Remove 04 activities first, then add a 03.5 (using 04 slot via a gap test)
		// Simpler: use multiDayBody which has 03 and 04, insert 03.5 doesn't exist
		// so insert 04.06 between — wait, 04 already exists. Use an earlier gap.
		const body = `## 01.06.2026

### Activities
- [[A]]

## 05.06.2026

### Activities
- [[B]]`
		const result = updateDayActivity(body, '03.06.2026', 'Middle', 'add')
		const parsed = parseDayActivities(result)
		const keys = [...parsed.keys()]
		expect(keys).toEqual(['01.06.2026', '03.06.2026', '05.06.2026'])
		expect(parsed.get('03.06.2026')).toEqual(['Middle'])
	})

	it('creates a date section in an empty body', () => {
		const result = updateDayActivity('', '02.06.2026', 'Beach', 'add')
		const parsed = parseDayActivities(result)
		expect(parsed.size).toBe(1)
		expect(parsed.get('02.06.2026')).toEqual(['Beach'])
		expect(result).toContain('## 02.06.2026')
		expect(result).toContain('### Activities\n- [[Beach]]')
	})

	it('maintains chronological order when adding multiple dates to empty body', () => {
		let body = ''
		body = updateDayActivity(body, '05.06.2026', 'Late', 'add')
		body = updateDayActivity(body, '01.06.2026', 'Early', 'add')
		body = updateDayActivity(body, '03.06.2026', 'Middle', 'add')
		const parsed = parseDayActivities(body)
		const keys = [...parsed.keys()]
		expect(keys).toEqual(['01.06.2026', '03.06.2026', '05.06.2026'])
	})
})
