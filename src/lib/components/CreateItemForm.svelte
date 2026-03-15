<script lang='ts'>
	import { untrack } from 'svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import { getEditableFields, getTemplate } from '../templates/engine'
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
	const endDateMin = $derived(itemStartDate > tripStart ? itemStartDate : tripStart)

	const formValues: Record<string, unknown> = {}

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

	const modalTitle = $derived.by(() => {
		switch (itemType) {
			case 'Activity': return 'New Activity'
			case 'Planning': return 'New Day Plan'
			case 'Stop': return 'New Stop'
			default: return 'New Item'
		}
	})

	async function handleSave() {
		if (!itemName.trim() || !trip || !itemType)
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
		<div class='form-fields'>
			<FormField
				label='Name'
				type='text'
				initialValue=''
				required
				placeholder={itemType === 'Activity' ? 'e.g. Visit Colosseum' : itemType === 'Stop' ? 'e.g. Tirana' : 'e.g. Day 1'}
				onchange={(v) => { itemName = v as string }}
			/>

			{#key itemType}
				{#each fields as field (field.key)}
					<FormField
						label={field.key}
						type={field.type}
						initialValue={defaultFor(field)}
						placeholder={field.type === 'url' ? 'https://' : ''}
						min={field.key === 'endDate' ? endDateMin : field.type === 'date' ? tripStart : ''}
						max={field.type === 'date' ? tripEnd : ''}
						onchange={(v) => {
							formValues[field.key] = v
							if (field.key === 'startDate')
								itemStartDate = v as string
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
			<button type='submit' class='btn-save' disabled={saving || !itemName.trim()}>
				{saving ? 'Saving' : 'Save'}
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
