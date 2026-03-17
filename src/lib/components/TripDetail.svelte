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

	const classificationChecks = $derived.by(() => {
		const metadata = trip.classificationMetadata
		if (!metadata)
			return []

		return [
			{ label: 'frontmatter.base contains Travel.base', matched: metadata.hasTravelBase },
			{ label: 'body contains ![[Roadtrip.base]]', matched: metadata.hasRoadtripBase },
			{ label: 'body contains ![[Planning.base]]', matched: metadata.hasPlanningBase },
			{ label: 'body contains ![[Activities.base]]', matched: metadata.hasActivitiesBase },
		]
	})
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
			<div class='trip-title-actions'>
				<span class='type-label {typeClass}'>{typeLabel}</span>
				{#if trip.classificationMetadata}
					<button class='btn-metadata' onclick={() => uiStore.toggleTripMetadata()}>
						{uiStore.showTripMetadata ? 'Hide metadata' : 'Show metadata'}
					</button>
				{/if}
			</div>
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

		{#if uiStore.showTripMetadata && trip.classificationMetadata}
			<section class='metadata-panel'>
				<p><strong>Detected type:</strong> {trip.type}</p>
				<p><strong>frontmatter.base:</strong> <code>{trip.classificationMetadata.base || '(empty)'}</code></p>
				<ul>
					{#each classificationChecks as check}
						<li class:matched={check.matched} class:missing={!check.matched}>
							{check.matched ? '✓' : '✗'} {check.label}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

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
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-10);
	}

	.detail-header {
		margin-bottom: var(--space-10);
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
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
		margin-bottom: var(--space-12);
	}

	.trip-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	.trip-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		flex-wrap: wrap;
	}

	.trip-title-actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
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
		padding: var(--space-2) var(--space-5);
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
		gap: var(--space-8);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	.btn-metadata {
		display: inline-flex;
		align-items: center;
		padding: var(--space-2) var(--space-5);
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.2s, color 0.2s;
	}

	.btn-metadata:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.metadata-panel {
		margin-top: var(--space-8);
		padding: var(--space-8);
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}

	.metadata-panel p {
		margin: var(--space-3) 0;
	}

	.metadata-panel ul {
		margin: var(--space-5) 0 0;
		padding-left: var(--space-8);
	}

	.metadata-panel li {
		margin-top: var(--space-2);
	}

	.metadata-panel li.matched {
		color: var(--color-success, #15803d);
	}

	.metadata-panel li.missing {
		color: var(--color-text-muted);
	}

	.sub-sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-14);
		margin-top: var(--space-4);
	}

	.sub-section-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.btn-add {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-6);
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
