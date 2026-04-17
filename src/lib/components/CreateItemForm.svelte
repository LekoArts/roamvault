<script lang='ts'>
	import { untrack } from 'svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import { getEditableFields, getTemplate } from '../templates/engine'
	import { formatFieldLabel } from '../utils/format'
	import FormField from './FormField.svelte'
	import Modal from './Modal.svelte'

	let itemName = $state('')
	let saving = $state(false)
	let saveError = $state<string | null>(null)
	const itemType = $derived(uiStore.itemTypeToCreate!)
	const trip = $derived(uiStore.selectedTrip!)

	const template = $derived(itemType ? getTemplate(vaultStore.templates, itemType) : undefined)
	const fields = $derived(template ? getEditableFields(template, true) : [])
	const tripStart = $derived(typeof trip.frontmatter.startDate === 'string' ? trip.frontmatter.startDate : '')
	const tripEnd = $derived(typeof trip.frontmatter.endDate === 'string' ? trip.frontmatter.endDate : '')

	let itemStartDate = $state(untrack(() => tripStart))
	let itemEndDate = $state(untrack(() => tripStart))
	const endDateMin = $derived(itemStartDate > tripStart ? itemStartDate : tripStart)

	const formValues: Record<string, unknown> = {}
	const dateErrors = $derived.by(() => {
		const errors: Record<string, string> = {}
		if (itemStartDate && tripStart && itemStartDate < tripStart)
			errors.startDate = `Start date must be on or after ${tripStart}.`
		if (itemStartDate && tripEnd && itemStartDate > tripEnd)
			errors.startDate = `Start date must be on or before ${tripEnd}.`
		if (itemEndDate && tripStart && itemEndDate < tripStart)
			errors.endDate = `End date must be on or after ${tripStart}.`
		if (itemEndDate && tripEnd && itemEndDate > tripEnd)
			errors.endDate = `End date must be on or before ${tripEnd}.`
		if (!errors.endDate && itemStartDate && itemEndDate && itemEndDate < itemStartDate)
			errors.endDate = 'End date must be the same as or later than the start date.'
		return errors
	})
	const canSave = $derived(Boolean(itemName.trim()) && Object.keys(dateErrors).length === 0)

	function defaultFor(field: typeof fields[number]): string | string[] | boolean {
		let val: string | string[] | boolean = ''
		if (field.type === 'date')
			val = tripStart || ''
		else if (field.type === 'array')
			val = []
		else if (field.type === 'boolean')
			val = false
		formValues[field.key] = val
		return val
	}

	function getFieldDescription(field: typeof fields[number]) {
		if (field.type === 'array')
			return 'Separate multiple values with commas.'
		if (field.key === 'startDate')
			return `Choose a day inside ${trip.name}.`
		if (field.key === 'endDate')
			return 'Choose the last day. It cannot be before the start date.'
		return ''
	}

	const modalTitle = $derived.by(() => {
		switch (itemType) {
			case 'Activity': return 'New Activity'
			case 'Planning': return 'New Day Plan'
			case 'Stop': return 'New Stop'
			default: return 'New Item'
		}
	})

	const introCopy = $derived.by(() => {
		switch (itemType) {
			case 'Activity': return 'Add a place, reservation, or stop you want to link back into the trip.'
			case 'Planning': return 'Create a planning note for a day or part of the trip. You can assign activities after saving.'
			case 'Stop': return 'Add one stop on the route for this roadtrip.'
			default: return 'Add a new note inside this trip.'
		}
	})

	async function handleSave() {
		if (!canSave || !trip || !itemType)
			return

		saving = true
		saveError = null

		try {
			const values: Record<string, unknown> = { ...formValues }
			await vaultStore.createItem(
				trip.name,
				trip.type,
				trip.year,
				itemType,
				itemName.trim(),
				values,
			)

			uiStore.closeModal()

			const updatedTrip = vaultStore.findTrip(trip.path)
			if (updatedTrip) {
				uiStore.updateSelectedTrip(updatedTrip)
			}

			itemName = ''
		}
		catch (e) {
			saveError = e instanceof Error ? e.message : 'Failed to create item'
		}
		finally {
			saving = false
		}
	}
</script>

<Modal open={true} title={modalTitle} onclose={() => uiStore.closeModal()}>
	<form onsubmit={(e) => {
		e.preventDefault()
		handleSave()
	}}>
		<p class='form-intro'>{introCopy}</p>
		<p class='form-note'>Required fields are marked with an asterisk.</p>
		<div class='form-fields'>
			<FormField
				label='Name'
				type='text'
				initialValue=''
				required
				placeholder={itemType === 'Activity' ? 'e.g. Visit Colosseum' : itemType === 'Stop' ? 'e.g. Tirana' : 'e.g. Day 1'}
				description='This becomes the note title inside the selected trip.'
				onchange={(v) => { itemName = v as string }}
			/>

			{#key itemType}
				{#each fields as field (field.key)}
					<FormField
						label={formatFieldLabel(field.key)}
						type={field.type}
						initialValue={defaultFor(field)}
						placeholder={field.type === 'url' ? 'https://' : ''}
						description={getFieldDescription(field)}
						error={dateErrors[field.key] ?? ''}
						min={field.key === 'endDate' ? endDateMin : field.type === 'date' ? tripStart : ''}
						max={field.type === 'date' ? tripEnd : ''}
						onchange={(v) => {
							formValues[field.key] = v
							if (field.key === 'startDate')
								itemStartDate = v as string
							if (field.key === 'endDate')
								itemEndDate = v as string
						}}
					/>
				{/each}
			{/key}
		</div>

		{#if saveError}
			<p class='error'>{saveError}</p>
		{/if}

		<div class='form-actions'>
			<button type='button' class='btn-cancel' onclick={() => uiStore.closeModal()}>Cancel</button>
			<button type='submit' class='btn-save' disabled={saving || !canSave}>
				{saving ? 'Creating…' : modalTitle}
			</button>
		</div>
	</form>
</Modal>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	.form-intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
	}

	.form-note {
		margin: calc(var(--space-4) * -1) 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-4);
		padding-top: var(--space-2);
	}

	.btn-cancel,
	.btn-save {
		min-height: 2.85rem;
		padding: 0 var(--space-8);
		border-radius: var(--radius-pill);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid var(--color-border-strong);
		color: var(--color-text);
	}

	.btn-cancel:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-primary);
	}

	.btn-cancel:active {
		background: var(--color-bg-accent);
	}

	.btn-save {
		background: var(--color-primary);
		color: var(--color-primary-contrast);
		border: none;
		box-shadow: var(--shadow-sm);
	}

	.btn-save:hover:not(:disabled) {
		background: var(--color-primary-strong);
		transform: translateY(-1px);
	}

	.btn-save:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: 0.875rem;
	}
</style>
