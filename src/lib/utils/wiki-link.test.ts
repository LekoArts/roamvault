import { describe, expect, it } from 'vitest'
import { stripWikiLink } from './wiki-link'

describe('stripWikiLink', () => {
	it('strips [[ and ]] from a wiki-link', () => {
		expect(stripWikiLink('[[Seoul Tower]]')).toBe('Seoul Tower')
	})

	it('returns the string unchanged if no brackets', () => {
		expect(stripWikiLink('Seoul Tower')).toBe('Seoul Tower')
	})

	it('handles empty wiki-link', () => {
		expect(stripWikiLink('[[]]')).toBe('')
	})

	it('handles empty string', () => {
		expect(stripWikiLink('')).toBe('')
	})

	it('only strips outermost brackets', () => {
		expect(stripWikiLink('[[nested [[link]]]]')).toBe('nested [[link]]')
	})

	it('does not strip partial brackets', () => {
		expect(stripWikiLink('[[one-sided')).toBe('one-sided')
		expect(stripWikiLink('one-sided]]')).toBe('one-sided')
	})

	it('handles link with special characters', () => {
		expect(stripWikiLink('[[Café & Über]]')).toBe('Café & Über')
	})
})
