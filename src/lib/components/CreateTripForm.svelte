<script lang='ts'>
	import type { TripType } from '../models/types'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import { getEditableFields, getTemplate } from '../templates/engine'
	import { formatFieldLabel } from '../utils/format'
	import FormField from './FormField.svelte'
	import Modal from './Modal.svelte'

	let tripName = $state('')
	let tripType = $state<TripType>('Travel_Simple')
	let year = $state(String(new Date().getFullYear()))
	let saving = $state(false)
	let saveError = $state<string | null>(null)
	const todayStr = (() => {
		const t = new Date()
		return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
	})()
	let startDate = $state(todayStr)
	let endDate = $state(todayStr)

	const template = $derived(getTemplate(vaultStore.templates, tripType))
	const fields = $derived(template ? getEditableFields(template, false) : [])
	const tripTypeDescription = $derived.by(() => {
		switch (tripType) {
			case 'Travel_Simple': return 'One note for the whole trip.'
			case 'Travel_Advanced': return 'Separate planning notes and activities inside a trip folder.'
			case 'Travel_Roadtrip': return 'Stops arranged as part of a driving route.'
		}
	})
	const formValues: Record<string, unknown> = {}
	const yearError = $derived(/^\d{4}$/.test(year.trim()) ? '' : 'Use a four-digit year, for example 2026.')
	const dateErrors = $derived.by(() => {
		const errors: Record<string, string> = {}
		if (startDate && endDate && endDate < startDate)
			errors.endDate = 'End date must be the same as or later than the start date.'
		return errors
	})
	const canSave = $derived(Boolean(tripName.trim()) && !yearError && Object.keys(dateErrors).length === 0)

	function defaultFor(field: typeof fields[number]): string | string[] | boolean {
		let val: string | string[] | boolean = ''
		if (field.type === 'date')
			val = todayStr
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
		if (field.key === 'endDate')
			return 'Choose the last day of the trip. It cannot be before the start date.'
		if (field.key === 'startDate')
			return 'Choose the first day of the trip.'
		return ''
	}

	async function handleSave() {
		if (!canSave)
			return

		saving = true
		saveError = null

		try {
			const values: Record<string, unknown> = { ...formValues }
			const path = await vaultStore.createTrip(tripName.trim(), tripType, year, values)

			uiStore.closeModal()

			if (path) {
				const trip = vaultStore.findTrip(path)
				if (trip) {
					uiStore.selectTrip(trip)
				}
			}

			tripName = ''
		}
		catch (e) {
			saveError = e instanceof Error ? e.message : 'Failed to create trip'
		}
		finally {
			saving = false
		}
	}
</script>

<Modal open={true} title='New Trip' onclose={() => uiStore.closeModal()}>
	<form onsubmit={(e) => {
		e.preventDefault()
		handleSave()
	}}>
		<p class='form-intro'>Choose the trip structure first, then fill in the note details RoamVault should create for you.</p>
		<p class='form-note'>Required fields are marked with an asterisk.</p>
		<div class='form-fields'>
			<FormField
				label='Trip Name'
				type='text'
				initialValue=''
				required
				placeholder='e.g. Summer in Rome'
				description='This becomes the main note or folder name in your Travel directory.'
				onchange={(v) => { tripName = v as string }}
			/>

			<div class='form-field'>
				<label for='trip-type'>Trip Type</label>
				<select id='trip-type' name='trip-type' bind:value={tripType} aria-describedby='trip-type-description'>
					<option value='Travel_Simple'>Simple Trip</option>
					<option value='Travel_Advanced'>Advanced Trip</option>
					<option value='Travel_Roadtrip'>Roadtrip</option>
				</select>
				<p id='trip-type-description' class='field-description'>{tripTypeDescription}</p>
			</div>

			<FormField
				label='Year'
				type='text'
				initialValue={year}
				required
				placeholder='e.g. 2026'
				description='Use the year folder where this trip should live, for example 2026.'
				error={yearError}
				onchange={(v) => { year = v as string }}
			/>

			{#key tripType}
				{#each fields as field (field.key)}
					<FormField
						label={formatFieldLabel(field.key)}
						type={field.type}
						initialValue={defaultFor(field)}
						placeholder={field.type === 'url' ? 'https://' : ''}
						description={getFieldDescription(field)}
						error={dateErrors[field.key] ?? ''}
						min={field.key === 'endDate' ? startDate : ''}
						onchange={(v) => {
							formValues[field.key] = v
							if (field.key === 'startDate')
								startDate = v as string
							if (field.key === 'endDate')
								endDate = v as string
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
				{saving ? 'Creating trip…' : 'Create Trip'}
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

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.form-field label {
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.field-description {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	select {
		min-height: 3rem;
		padding: 0 var(--space-6);
		padding-right: var(--space-12);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-input);
		color: var(--color-text);
		font-size: 0.95rem;
		font-family: inherit;
		outline: none;
		cursor: pointer;
		appearance: auto;
	}

	select:focus-visible {
		border-color: var(--color-primary);
		outline: 2px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
		outline-offset: 1px;
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
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
