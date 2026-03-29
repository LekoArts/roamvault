import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import PlanningList from '../src/lib/components/PlanningList.svelte'

const activities = [
	{ name: 'Seoul - Photos', path: 'a1', frontmatter: { Location: 'Seoul', Done: false } },
	{ name: 'Seoul Tower', path: 'a2', frontmatter: { Location: 'Seoul', Done: false } },
	{ name: 'Singapur - Photos', path: 'a3', frontmatter: { Location: 'Singapur', Done: false } },
]

describe('planningList', () => {
	it('renders planning items as collapsed details elements', async () => {
		await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Arrival', path: 'p1', frontmatter: { startDate: '2026-06-01', Activities: null } },
					{ name: 'Seoul Days', path: 'p2', frontmatter: { startDate: '2026-06-03', endDate: '2026-06-04', Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'] } },
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

	it('shows linked activities when expanded', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Seoul Days', path: 'p1', frontmatter: { startDate: '2026-06-03', Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'] } },
				],
				activities,
			},
		})

		// Expand the details
		await screen.getByText('Seoul Days').click()

		await expect.element(screen.getByText('Seoul - Photos')).toBeVisible()
		await expect.element(screen.getByText('Seoul Tower')).toBeVisible()
	})

	it('shows location tags for resolved activities', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{ name: 'Day in Singapur', path: 'p1', frontmatter: { startDate: '2026-06-02', Activities: ['[[Singapur - Photos]]'] } },
				],
				activities,
			},
		})

		await screen.getByText('Day in Singapur').click()

		await expect.element(screen.getByText('Singapur - Photos')).toBeVisible()
		// Location shown from the resolved activity
		const locationEl = document.querySelector('.activity-location')
		expect(locationEl).not.toBeNull()
		expect(locationEl!.textContent).toContain('Singapur')
	})

	it('shows "No activities planned" for items without activities', async () => {
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

	it('calls onremove when remove button is clicked', async () => {
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

		// Expand the accordion
		await screen.getByText('Seoul Days').click()

		// Click the remove button for "Seoul Tower"
		const removeBtn = screen.getByRole('button', { name: 'Remove Seoul Tower' })
		await removeBtn.click()

		expect(onremove).toHaveBeenCalledOnce()
		expect(onremove).toHaveBeenCalledWith(
			{ name: 'Seoul Days', path: 'p1', frontmatter: { startDate: '2026-06-03', Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'] } },
			'Seoul Tower',
		)
	})

	it('calls onadd when add button is clicked', async () => {
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

		// Expand the accordion
		await screen.getByText('Seoul Days').click()

		// The dropdown should show available (unlinked) activities
		const select = document.querySelector('select.add-activity-select') as HTMLSelectElement
		expect(select).not.toBeNull()

		// "Seoul Tower" and "Singapur - Photos" should be available (not linked yet)
		const options = Array.from(select.options)
		const optionValues = options.map((o) => o.value)
		expect(optionValues).toContain('Seoul Tower')
		expect(optionValues).toContain('Singapur - Photos')
		expect(optionValues).not.toContain('Seoul - Photos') // already linked

		// Select "Seoul Tower" and click add
		select.value = 'Seoul Tower'
		const addBtn = screen.getByRole('button', { name: 'Add activity' })
		await addBtn.click()

		expect(onadd).toHaveBeenCalledOnce()
		expect(onadd).toHaveBeenCalledWith(
			{ name: 'Seoul Days', path: 'p1', frontmatter: { startDate: '2026-06-03', Activities: ['[[Seoul - Photos]]'] } },
			'Seoul Tower',
		)
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
							Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]', '[[Singapur - Photos]]'],
						},
					},
				],
				activities,
				onadd: vi.fn(),
			},
		})

		// Expand the accordion
		const summary = document.querySelector('.planning-name')!
		;(summary.closest('summary') as HTMLElement).click()

		// No dropdown should be rendered
		const select = document.querySelector('select.add-activity-select')
		expect(select).toBeNull()
	})

	it('shows add dropdown with only unlinked activities', async () => {
		const screen = await render(PlanningList, {
			props: {
				planningItems: [
					{
						name: 'Seoul Days',
						path: 'p1',
						frontmatter: {
							startDate: '2026-06-03',
							Activities: ['[[Seoul - Photos]]', '[[Seoul Tower]]'],
						},
					},
				],
				activities,
				onadd: vi.fn(),
			},
		})

		// Expand
		await screen.getByText('Seoul Days').click()

		const select = document.querySelector('select.add-activity-select') as HTMLSelectElement
		expect(select).not.toBeNull()

		const options = Array.from(select.options)
		expect(options).toHaveLength(1)
		expect(options[0].value).toBe('Singapur - Photos')
	})

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
})
