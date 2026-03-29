import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import PlanningList from '../src/lib/components/PlanningList.svelte'

const activities = [
	{ name: 'Seoul - Photos', path: 'a1', frontmatter: { Location: 'Seoul', Done: false } },
	{ name: 'Seoul Tower', path: 'a2', frontmatter: { Location: 'Seoul', Done: false } },
	{ name: 'Singapur - Photos', path: 'a3', frontmatter: { Location: 'Singapur', Done: false } },
	{ name: 'Seoul Sky', path: 'a4', frontmatter: { Location: 'Seoul', Done: false } },
]

const multiDayContent = `
## 03.06.2026

### Activities

- [[Seoul - Photos]]

## 04.06.2026

### Activities

- [[Seoul Tower]]
`.trim()

describe('planningList', () => {
	it('renders planning items as collapsed details elements', async () => {
		await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Arrival', path: 'p1', frontmatter: { startDate: '2026-06-01', Activities: null } },
					{ name: 'Seoul Days', path: 'p2', frontmatter: { startDate: '2026-06-03', endDate: '2026-06-04', Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'] }, content: multiDayContent },
				],
				activities,
			},
		})

		const names = document.querySelectorAll('.planning-name')
		expect(names.length).toBe(2)
		expect(names[0].textContent).toBe('Arrival')
		expect(names[1].textContent).toBe('Seoul Days')

		// All details should be closed by default
		const details = document.querySelectorAll('details.planning-item')
		expect(details.length).toBe(2)
		for (const el of details) {
			expect(el.hasAttribute('open')).toBe(false)
		}
	})

	// --- Single-day (flat) tests ---

	it('shows linked activities in flat list for single-day items', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Day in Singapur', path: 'p1', frontmatter: { startDate: '2026-06-02', endDate: '2026-06-02', Activities: ['[[Singapur - Photos]]'] } },
				],
				activities,
			},
		})

		await screen.getByText('Day in Singapur').click()

		await expect.element(screen.getByText('Singapur - Photos')).toBeVisible()
		const locationEl = document.querySelector('.activity-location')
		expect(locationEl).not.toBeNull()
		expect(locationEl!.textContent).toContain('Singapur')
	})

	it('shows "No activities planned" for single-day items without activities', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Arrival', path: 'p1', frontmatter: { startDate: '2026-06-01', Activities: null } },
				],
				activities,
			},
		})

		await screen.getByText('Arrival').click()
		await expect.element(screen.getByText('No activities planned')).toBeVisible()
	})

	it('shows "No activities planned" for empty Activities array', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Free Day', path: 'p1', frontmatter: { startDate: '2026-06-05', Activities: [] } },
				],
				activities,
			},
		})

		await screen.getByText('Free Day').click()
		await expect.element(screen.getByText('No activities planned')).toBeVisible()
	})

	it('shows "not found" for unresolvable activity links', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Day X', path: 'p1', frontmatter: { startDate: '2026-06-10', Activities: ['[[Nonexistent Activity]]'] } },
				],
				activities,
			},
		})

		await screen.getByText('Day X').click()
		await expect.element(screen.getByText('Nonexistent Activity')).toBeVisible()
		await expect.element(screen.getByText('not found')).toBeVisible()
	})

	// --- Multi-day (day-grouped) tests ---

	it('shows day-grouped activities for multi-day items', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{
						name: 'Seoul Days',
						path: 'p1',
						frontmatter: { startDate: '2026-06-03', endDate: '2026-06-04', Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'] },
						content: multiDayContent,
					},
				],
				activities,
			},
		})

		await screen.getByText('Seoul Days').click()

		// Day headings should be visible (use role to avoid ambiguity with date range text)
		await expect.element(screen.getByRole('heading', { name: '03.06.2026' })).toBeVisible()
		await expect.element(screen.getByRole('heading', { name: '04.06.2026' })).toBeVisible()

		// Activities under each day
		await expect.element(screen.getByText('Seoul - Photos')).toBeVisible()
		await expect.element(screen.getByText('Seoul Tower')).toBeVisible()
	})

	it('shows day picker only for multi-day items', async () => {
		await render(PlanningList, {
			props: {
				planningItems: [
					{
						name: 'Seoul Days',
						path: 'p1',
						frontmatter: { startDate: '2026-06-03', endDate: '2026-06-04', Activities: ['[[Seoul - Photos]]'] },
						content: multiDayContent,
						onadd: vi.fn(),
					},
					{
						name: 'Single Day',
						path: 'p2',
						frontmatter: { startDate: '2026-06-02', endDate: '2026-06-02', Activities: ['[[Singapur - Photos]]'] },
					},
				],
				activities,
				onadd: vi.fn(),
			},
		})

		// Expand both
		const summaries = document.querySelectorAll('.planning-name')
		;(summaries[0].closest('summary') as HTMLElement).click()
		;(summaries[1].closest('summary') as HTMLElement).click()

		// Multi-day should have a day-select
		const daySelects = document.querySelectorAll('select.day-select')
		expect(daySelects.length).toBe(1)
	})

	it('shows "No activities for this day" for empty day sections', async () => {
		const emptyDayContent = `## 03.06.2026\n\n### Activities\n\n## 04.06.2026\n\n### Activities`

		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{
						name: 'Empty Days',
						path: 'p1',
						frontmatter: { startDate: '2026-06-03', endDate: '2026-06-04', Activities: [] },
						content: emptyDayContent,
					},
				],
				activities,
			},
		})

		await screen.getByText('Empty Days').click()

		const noActivityMsgs = document.querySelectorAll('.no-activities')
		expect(noActivityMsgs.length).toBe(2)
	})

	// --- Shared behavior tests ---

	it('shows empty state when no planning items', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [],
				activities: [],
			},
		})

		await expect.element(screen.getByText('No planning yet')).toBeVisible()
	})

	it('sorts planning items by start date', async () => {
		await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Later', path: 'p1', frontmatter: { startDate: '2026-06-10', Activities: null } },
					{ name: 'Earlier', path: 'p2', frontmatter: { startDate: '2026-06-01', Activities: null } },
				],
				activities: [],
			},
		})

		const summaries = document.querySelectorAll('.planning-name')
		expect(summaries.length).toBe(2)
		expect(summaries[0].textContent).toBe('Earlier')
		expect(summaries[1].textContent).toBe('Later')
	})

	// --- Callback tests (single-day flat) ---

	it('calls onremove for single-day item without date', async () => {
		const onremove = vi.fn()

		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Seoul Days', path: 'p1', frontmatter: { startDate: '2026-06-03', Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'] } },
				],
				activities,
				onremove,
			},
		})

		await screen.getByText('Seoul Days').click()
		const removeBtn = screen.getByRole('button', { name: 'Remove Seoul Tower' })
		await removeBtn.click()

		expect(onremove).toHaveBeenCalledOnce()
		expect(onremove).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Seoul Days', path: 'p1' }),
			'Seoul Tower',
		)
	})

	it('calls onadd for single-day item without date', async () => {
		const onadd = vi.fn()

		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Seoul Days', path: 'p1', frontmatter: { startDate: '2026-06-03', Activities: ['[[Seoul - Photos]]'] } },
				],
				activities,
				onadd,
			},
		})

		await screen.getByText('Seoul Days').click()

		const select = document.querySelector('select.add-activity-select') as HTMLSelectElement
		expect(select).not.toBeNull()
		select.value = 'Seoul Tower'

		const addBtn = screen.getByRole('button', { name: 'Add activity' })
		await addBtn.click()

		expect(onadd).toHaveBeenCalledOnce()
		expect(onadd).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Seoul Days', path: 'p1' }),
			'Seoul Tower',
		)
	})

	// --- Callback tests (multi-day) ---

	it('calls onremove for multi-day item with date', async () => {
		const onremove = vi.fn()

		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{
						name: 'Seoul Days',
						path: 'p1',
						frontmatter: { startDate: '2026-06-03', endDate: '2026-06-04', Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'] },
						content: multiDayContent,
					},
				],
				activities,
				onremove,
			},
		})

		await screen.getByText('Seoul Days').click()
		const removeBtn = screen.getByRole('button', { name: 'Remove Seoul - Photos from 03.06.2026' })
		await removeBtn.click()

		expect(onremove).toHaveBeenCalledOnce()
		expect(onremove).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Seoul Days', path: 'p1' }),
			'Seoul - Photos',
			'03.06.2026',
		)
	})

	it('calls onadd for multi-day item with selected date', async () => {
		const onadd = vi.fn()

		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{
						name: 'Seoul Days',
						path: 'p1',
						frontmatter: { startDate: '2026-06-03', endDate: '2026-06-04', Activities: ['[[Seoul - Photos]]'] },
						content: multiDayContent,
					},
				],
				activities,
				onadd,
			},
		})

		await screen.getByText('Seoul Days').click()

		// Select a day and an activity
		const daySelect = document.querySelector('select.day-select') as HTMLSelectElement
		expect(daySelect).not.toBeNull()
		daySelect.value = '04.06.2026'

		const actSelect = document.querySelector('select.add-activity-select:not(.day-select)') as HTMLSelectElement
		expect(actSelect).not.toBeNull()
		actSelect.value = 'Seoul Tower'

		const addBtn = screen.getByRole('button', { name: 'Add activity' })
		await addBtn.click()

		expect(onadd).toHaveBeenCalledOnce()
		expect(onadd).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Seoul Days', path: 'p1' }),
			'Seoul Tower',
			'04.06.2026',
		)
	})

	// --- Visibility tests ---

	it('does not show remove buttons when onremove is not provided', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Seoul Days', path: 'p1', frontmatter: { startDate: '2026-06-03', Activities: ['[[Seoul - Photos]]'] } },
				],
				activities,
			},
		})

		await screen.getByText('Seoul Days').click()
		const removeButtons = document.querySelectorAll('.btn-remove')
		expect(removeButtons.length).toBe(0)
	})

	it('does not show add row when onadd is not provided', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Seoul Days', path: 'p1', frontmatter: { startDate: '2026-06-03', Activities: ['[[Seoul - Photos]]'] } },
				],
				activities,
			},
		})

		await screen.getByText('Seoul Days').click()
		const addRow = document.querySelector('.add-activity-row')
		expect(addRow).toBeNull()
	})

	it('does not show add dropdown when all activities are linked', async () => {
		await render(PlanningList, {
			props: {
				planningItems: [
					{
						name: 'Full Day',
						path: 'p1',
						frontmatter: {
							startDate: '2026-06-03',
							Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]', '[[Singapur - Photos]]', '[[Seoul Sky]]'],
						},
					},
				],
				activities,
				onadd: vi.fn(),
			},
		})

		const summary = document.querySelector('.planning-name')!
		;(summary.closest('summary') as HTMLElement).click()

		const select = document.querySelector('select.add-activity-select')
		expect(select).toBeNull()
	})
})
