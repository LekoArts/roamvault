<script lang='ts'>
	import { untrack } from 'svelte'

	type FieldType = 'text' | 'date' | 'url' | 'array' | 'boolean'
	type FieldValue = string | string[] | boolean

	const WHITESPACE_RE = /\s+/g

	const {
		label,
		type = 'text',
		initialValue,
		required = false,
		placeholder = '',
		min = '',
		max = '',
		onchange,
	}: {
		label: string
		type?: FieldType
		initialValue: FieldValue
		required?: boolean
		placeholder?: string
		min?: string
		max?: string
		onchange: (value: FieldValue) => void
	} = $props()

	// Snapshot the prop once — the parent uses {#key} to remount when it should reset.
	const init = untrack(() => initialValue)
	const fieldName = untrack(() => label.toLowerCase().replace(WHITESPACE_RE, '-'))

	let textValue = $state(typeof init === 'string' ? init : '')
	let checked = $state(init === true)
	let arrayText = $state(Array.isArray(init) ? (init as string[]).join(', ') : '')

	function handleTextInput(e: Event) {
		textValue = (e.target as HTMLInputElement).value
		onchange(textValue)
	}

	function handleCheckbox(e: Event) {
		checked = (e.target as HTMLInputElement).checked
		onchange(checked)
	}

	function handleArrayInput(e: Event) {
		arrayText = (e.target as HTMLInputElement).value
		onchange(
			arrayText
				.split(',')
				.map(s => s.trim())
				.filter(Boolean),
		)
	}

</script>

<div class='form-field'>
	{#if type === 'boolean'}
		<label class='checkbox-label'>
			<input
				type='checkbox'
				id={label}
				name={fieldName}
				{checked}
				onchange={handleCheckbox}
			/>
			<span>Mark as done?</span>
		</label>
	{:else}
		<label for={label}>
			{label}
			{#if required}<span class='required'>*</span>{/if}
		</label>

		{#if type === 'date'}
			<input
				type='date'
				id={label}
				name={fieldName}
				autocomplete='off'
				value={textValue}
				{required}
				min={min || undefined}
				max={max || undefined}
				onchange={handleTextInput}
			/>
		{:else if type === 'url'}
			<input
				type='url'
				id={label}
				name={fieldName}
				autocomplete='off'
				value={textValue}
				{required}
				{placeholder}
				oninput={handleTextInput}
			/>
		{:else if type === 'array'}
			<input
				type='text'
				id={label}
				name={fieldName}
				autocomplete='off'
				value={arrayText}
				placeholder={placeholder || 'Comma-separated values'}
				oninput={handleArrayInput}
			/>
		{:else}
			<input
				type='text'
				id={label}
				name={fieldName}
				autocomplete='off'
				value={textValue}
				{required}
				{placeholder}
				oninput={handleTextInput}
			/>
		{/if}
	{/if}
</div>

<style>
	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.required {
		color: var(--color-danger);
		margin-left: var(--space-1);
	}

	input[type='text'],
	input[type='url'],
	input[type='date'] {
		padding: var(--space-4) var(--space-6);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-bg-input);
		color: var(--color-text);
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		color-scheme: light dark;
	}

	input:focus-visible {
		border-color: var(--color-primary);
		outline: 2px solid var(--color-primary);
		outline-offset: -1px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		cursor: pointer;
		font-size: 0.9375rem;
		color: var(--color-text);
	}

	input[type='checkbox'] {
		width: 18px;
		height: 18px;
		accent-color: var(--color-primary);
	}

</style>
