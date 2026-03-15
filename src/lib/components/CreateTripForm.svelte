<script lang='ts'>
	import type { TripType } from '../models/types'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import { getEditableFields, getTemplate } from '../templates/engine'
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

	const template = $derived(getTemplate(vaultStore.templates, tripType))
	const fields = $derived(template ? getEditableFields(template, false) : [])

	// Mutable store for user edits, keyed by field name
	const formValues: Record<string, unknown> = {}

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

	async function handleSave() {
		if (!tripName.trim())
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
		<div class='form-fields'>
			<FormField
				label='Trip Name'
				type='text'
				initialValue=''
				required
				placeholder='e.g. Summer in Rome'
				onchange={(v) => { tripName = v as string }}
			/>

			<div class='form-field'>
				<label for='trip-type'>Trip Type</label>
				<select id='trip-type' name='trip-type' bind:value={tripType}>
					<option value='Travel_Simple'>Simple Trip</option>
					<option value='Travel_Advanced'>Advanced Trip</option>
					<option value='Travel_Roadtrip'>Roadtrip</option>
				</select>
			</div>

			<FormField
				label='Year'
				type='text'
				initialValue={year}
				required
				onchange={(v) => { year = v as string }}
			/>

			{#key tripType}
				{#each fields as field (field.key)}
					<FormField
						label={field.key}
						type={field.type}
						initialValue={defaultFor(field)}
						placeholder={field.type === 'url' ? 'https://' : ''}
						min={field.key === 'endDate' ? startDate : ''}
						onchange={(v) => {
							formValues[field.key] = v
							if (field.key === 'startDate')
								startDate = v as string
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
			<button type='submit' class='btn-save' disabled={saving || !tripName.trim()}>
				{saving ? 'Saving' : 'Save'}
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
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	select {
		padding: var(--space-4) var(--space-6);
		padding-right: var(--space-16);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background-color: var(--color-bg-input);
		color: var(--color-text);
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right var(--space-5) center;
	}

	select:focus-visible {
		border-color: var(--color-primary);
		outline: 2px solid var(--color-primary);
		outline-offset: -1px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-4);
		padding-top: var(--space-2);
	}

	.btn-cancel {
		padding: var(--space-4) var(--space-8);
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-cancel:hover {
		background: var(--color-bg-hover);
	}

	.btn-save {
		padding: var(--space-4) var(--space-8);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-save:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		color: var(--color-danger);
		font-size: 0.875rem;
		margin: 0;
	}
</style>
