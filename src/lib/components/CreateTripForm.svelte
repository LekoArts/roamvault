<script lang='ts'>
	import type { TripType } from '../models/types'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import { getEditableFields, getTemplateForTripType } from '../templates/engine'
	import FormField from './FormField.svelte'
	import Modal from './Modal.svelte'

	let tripName = $state('')
	let tripType = $state<TripType>('Travel_Simple')
	let year = $state(String(new Date().getFullYear()))
	let saving = $state(false)
	let saveError = $state<string | null>(null)

	const template = $derived(getTemplateForTripType(vaultStore.templates, tripType))
	const fields = $derived(template ? getEditableFields(template, false) : [])

	// Mutable store for user edits, keyed by field name
	const formValues: Record<string, unknown> = {}

	function defaultFor(field: typeof fields[number]): string | string[] | boolean {
		if (field.type === 'date') {
			const t = new Date()
			return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
		}
		if (field.type === 'array')
			return []
		if (field.type === 'boolean')
			return false
		return ''
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
				<select id='trip-type' bind:value={tripType}>
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
						placeholder={field.type === 'url' ? 'https://...' : ''}
						onchange={(v) => { formValues[field.key] = v }}
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
				{saving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</form>
</Modal>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	select {
		padding: 8px 12px;
		padding-right: 32px;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-bg-input);
		color: var(--color-text);
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
	}

	select:focus {
		border-color: var(--color-primary);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding-top: 4px;
	}

	.btn-cancel {
		padding: 8px 18px;
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
		padding: 8px 18px;
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
