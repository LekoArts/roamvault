<script lang='ts'>
	import { ArrowLeft, Calendar, Plus, Users } from '@lucide/svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { formatDateRange } from '../utils/format'
	import ItemList from './ItemList.svelte'

	const trip = $derived(uiStore.selectedTrip!)

	const dateRange = $derived(formatDateRange(trip.frontmatter.startDate, trip.frontmatter.endDate))

	const typeLabel = $derived.by(() => {
		switch (trip.type) {
			case 'Travel_Simple': return 'Simple Trip'
			case 'Travel_Advanced': return 'Advanced Trip'
			case 'Travel_Roadtrip': return 'Roadtrip'
		}
	})

	const typeClass = $derived.by(() => {
		switch (trip.type) {
			case 'Travel_Simple': return 'badge-simple'
			case 'Travel_Advanced': return 'badge-advanced'
			case 'Travel_Roadtrip': return 'badge-roadtrip'
		}
	})

	const persons = $derived.by(() => {
		const p = trip.frontmatter.Persons
		if (Array.isArray(p) && p.length > 0)
			return p as string[]
		return null
	})

	const banner = $derived(trip.frontmatter.banner as string | undefined)
</script>

<div class='trip-detail'>
	<header class='detail-header'>
		<button class='btn-back' onclick={() => uiStore.navigate('travel-list')}>
			<ArrowLeft size={18} aria-hidden='true' />
			Back
		</button>
	</header>

	{#if banner}
		<div class='trip-banner' style:background-image='url({banner})'></div>
	{/if}

	<div class='trip-content'>
		<div class='trip-title-row'>
			<h1>{trip.name}</h1>
			<span class='type-label {typeClass}'>{typeLabel}</span>
		</div>

		<div class='trip-meta'>
			{#if dateRange}
				<div class='meta-item'>
					<Calendar size={16} aria-hidden='true' />
					{dateRange}
				</div>
			{/if}
			{#if persons}
				<div class='meta-item'>
					<Users size={16} aria-hidden='true' />
					{persons.join(', ')}
				</div>
			{/if}
		</div>

		{#if trip.type === 'Travel_Advanced'}
			<div class='sub-sections'>
				<div class='sub-section'>
					<div class='sub-section-header'>
						<ItemList items={trip.planning ?? []} label='Planning' />
						<button class='btn-add' onclick={() => uiStore.openCreateItemModal('Planning')}>
							<Plus size={14} aria-hidden='true' />
							New Day Plan
						</button>
					</div>
				</div>

				<div class='sub-section'>
					<div class='sub-section-header'>
						<ItemList items={trip.activities ?? []} label='Activities' />
						<button class='btn-add' onclick={() => uiStore.openCreateItemModal('Activity')}>
							<Plus size={14} aria-hidden='true' />
							New Activity
						</button>
					</div>
				</div>
			</div>
		{:else if trip.type === 'Travel_Roadtrip'}
			<div class='sub-sections'>
				<div class='sub-section'>
					<div class='sub-section-header'>
						<ItemList items={trip.stops ?? []} label='Stops' />
						<button class='btn-add' onclick={() => uiStore.openCreateItemModal('Stop')}>
							<Plus size={14} aria-hidden='true' />
							New Stop
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.trip-detail {
		max-width: 720px;
		margin: 0 auto;
		padding: 20px;
	}

	.detail-header {
		margin-bottom: 20px;
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-back:hover {
		background: var(--color-bg-hover);
	}

	.trip-banner {
		height: 200px;
		background-size: cover;
		background-position: center;
		border-radius: 12px;
		margin-bottom: 24px;
	}

	.trip-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.trip-title-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.type-label {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.badge-simple {
		background: var(--color-badge-simple-bg);
		color: var(--color-badge-simple);
	}

	.badge-advanced {
		background: var(--color-badge-advanced-bg);
		color: var(--color-badge-advanced);
	}

	.badge-roadtrip {
		background: var(--color-badge-roadtrip-bg);
		color: var(--color-badge-roadtrip);
	}

	.trip-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	.sub-sections {
		display: flex;
		flex-direction: column;
		gap: 28px;
		margin-top: 8px;
	}

	.sub-section-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.btn-add {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		background: none;
		border: 1px dashed var(--color-border);
		border-radius: 8px;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: border-color 0.2s, color 0.2s;
		align-self: flex-start;
	}

	.btn-add:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
</style>
