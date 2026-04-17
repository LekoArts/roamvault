import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'

import FormField from '../src/lib/components/FormField.svelte'

describe('formField', () => {
	it('renders text input and emits changes', async () => {
		const onchange = vi.fn()
		const screen = await render(FormField, {
			label: 'Trip Name',
			type: 'text',
			initialValue: 'Rome',
			onchange,
		})

		const input = screen.getByRole('textbox', { name: 'Trip Name' })
		await expect.element(input).toBeInTheDocument()
		await expect.element(input).toHaveValue('Rome')

		await input.fill('Paris')
		expect(onchange).toHaveBeenCalledWith('Paris')
	})

	it('renders date input with min/max', async () => {
		const screen = await render(FormField, {
			label: 'Start Date',
			type: 'date',
			initialValue: '2026-03-15',
			min: '2026-03-01',
			max: '2026-03-31',
			onchange: vi.fn(),
		})

		const input = screen.getByLabelText('Start Date')
		await expect.element(input).toHaveAttribute('type', 'date')
		await expect.element(input).toHaveAttribute('min', '2026-03-01')
		await expect.element(input).toHaveAttribute('max', '2026-03-31')
	})

	it('parses array input as comma-separated values', async () => {
		const onchange = vi.fn()
		const screen = await render(FormField, {
			label: 'Persons',
			type: 'array',
			initialValue: ['PersonA'],
			onchange,
		})

		const input = screen.getByRole('textbox', { name: 'Persons' })
		await input.fill('PersonA, PersonB, PersonC')
		expect(onchange).toHaveBeenLastCalledWith(['PersonA', 'PersonB', 'PersonC'])
	})

	it('renders boolean checkbox and toggles value', async () => {
		const onchange = vi.fn()
		const screen = await render(FormField, {
			label: 'Mark as done?',
			type: 'boolean',
			initialValue: false,
			onchange,
		})

		const checkbox = screen.getByRole('checkbox', { name: 'Mark as done?' })
		await expect.element(checkbox).not.toBeChecked()

		await checkbox.click()
		expect(onchange).toHaveBeenLastCalledWith(true)
	})

	it('connects helper text without reusing duplicate ids', async () => {
		const screen = await render(FormField, {
			label: 'Start Date',
			type: 'date',
			initialValue: '2026-03-15',
			description: 'Choose the first day of the trip.',
			onchange: vi.fn(),
		})

		const input = screen.getByLabelText('Start Date')
		const description = screen.getByText('Choose the first day of the trip.')
		await expect.element(input).toHaveAttribute('aria-describedby')
		await expect.element(description).toHaveAttribute('id')
	})
})
