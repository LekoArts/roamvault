<script lang='ts'>
	import type { SubItem } from '../models/types'
	import { ArrowLeft, Calendar, Plus, Users } from '@lucide/svelte'
	import { updateDayActivity } from '../parser/planning'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import { formatDateRange } from '../utils/format'
	import { stripWikiLink } from '../utils/wiki-link'
	import ItemList from './ItemList.svelte'
	import PlanningList from './PlanningList.svelte'

	const trip = $derived(uiStore.selectedTrip!)

	async function handleRemoveActivity(planningItem: SubItem, activityName: string, date?: string) {
		await vaultStore.updateSubItem(
			planningItem.path,
			(data) => {
				if (Array.isArray(data.Activities)) {
					data.Activities = (data.Activities as string[]).filter(link => stripWikiLink(link) !== activityName)
				}
			},
			date ? content => updateDayActivity(content, date, activityName, 'remove') : undefined,
		)
		const updated = vaultStore.findTrip(trip.path)
		if (updated)
			uiStore.updateSelectedTrip(updated)
	}

	async function handleAddActivity(planningItem: SubItem, activityName: string, date?: string) {
		await vaultStore.updateSubItem(
			planningItem.path,
			(data) => {
				const arr = Array.isArray(data.Activities) ? data.Activities as string[] : []
				arr.push(`[[${activityName}]]`)
				data.Activities = arr
			},
			date ? content => updateDayActivity(content, date, activityName, 'add') : undefined,
		)
		const updated = vaultStore.findTrip(trip.path)
		if (updated)
			uiStore.updateSelectedTrip(updated)
	}

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
		<button type='button' class='btn-back' onclick={() => uiStore.navigate('travel-list')}>
			<ArrowLeft size={18} aria-hidden='true' />
			All Trips
		</button>
	</header>

	<section class='hero-card'>
		{#if banner}
			<div class='trip-banner' style:background-image='url({banner})' role='img' aria-label='Banner image for {trip.name}'></div>
		{/if}

		<div class='trip-content'>
			<div class='trip-title-row'>
				<div>
					<p class='eyebrow'>Trip overview</p>
					<h1>{trip.name}</h1>
				</div>
				<div class='trip-title-actions'>
					<span class='type-label {typeClass}'>{typeLabel}</span>
					{#if trip.classificationMetadata}
						<button type='button' class='btn-metadata' onclick={() => uiStore.toggleTripMetadata()}>
							{uiStore.showTripMetadata ? 'Hide metadata' : 'Show metadata'}
						</button>
					{/if}
				</div>
			</div>

			<div class='trip-meta'>
				{#if dateRange}
					<div class='meta-item'>
						<Calendar size={16} aria-hidden='true' />
						<span>{dateRange}</span>
					</div>
				{/if}
				{#if persons}
					<div class='meta-item'>
						<Users size={16} aria-hidden='true' />
						<span>{persons.join(', ')}</span>
					</div>
				{/if}
			</div>

			{#if uiStore.showTripMetadata && trip.classificationMetadata}
				<section class='metadata-panel'>
					<div>
						<p class='metadata-label'>Detected type</p>
						<p class='metadata-value'>{trip.type}</p>
					</div>
					<div>
						<p class='metadata-label'>frontmatter.base</p>
						<p class='metadata-value'><code>{trip.classificationMetadata.base || '(empty)'}</code></p>
					</div>
					<ul>
						{#each classificationChecks as check}
							<li class:matched={check.matched} class:missing={!check.matched}>
								{check.matched ? '✓' : '✗'} {check.label}
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	</section>

	{#if trip.type === 'Travel_Advanced'}
		<div class='sub-sections'>
			<section class='sub-section'>
				<div class='section-toolbar'>
					<div>
						<p class='section-kicker'>Structure</p>
						<h2>Planning</h2>
					</div>
					<button type='button' class='btn-add' onclick={() => uiStore.openCreateItemModal('Planning')}>
						<Plus size={14} aria-hidden='true' />
						New Day Plan
					</button>
				</div>
				<PlanningList
					planningItems={trip.planning ?? []}
					activities={trip.activities ?? []}
					onremove={handleRemoveActivity}
					onadd={handleAddActivity}
				/>
			</section>

			<section class='sub-section'>
				<div class='section-toolbar'>
					<div>
						<p class='section-kicker'>Places</p>
						<h2>Activities</h2>
					</div>
					<button type='button' class='btn-add' onclick={() => uiStore.openCreateItemModal('Activity')}>
						<Plus size={14} aria-hidden='true' />
						New Activity
					</button>
				</div>
				<ItemList items={trip.activities ?? []} label='Activities' />
			</section>
		</div>
	{:else if trip.type === 'Travel_Roadtrip'}
		<div class='sub-sections'>
			<section class='sub-section'>
				<div class='section-toolbar'>
					<div>
						<p class='section-kicker'>Route</p>
						<h2>Stops</h2>
					</div>
					<button type='button' class='btn-add' onclick={() => uiStore.openCreateItemModal('Stop')}>
						<Plus size={14} aria-hidden='true' />
						New Stop
					</button>
				</div>
				<ItemList items={trip.stops ?? []} label='Stops' />
			</section>
		</div>
	{/if}
</div>

<style>
	.trip-detail {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-12) var(--space-10) var(--space-20);
	}

	.detail-header {
		margin-bottom: var(--space-8);
	}

	.hero-card,
	.sub-section {
		border: 1px solid var(--color-border);
		background: var(--color-bg-card);
		box-shadow: var(--shadow-sm);
	}

	.hero-card {
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.trip-banner {
		height: min(32vw, 18rem);
		min-height: 12rem;
		background-size: cover;
		background-position: center;
	}

	.trip-content {
		padding: clamp(1.5rem, 4vw, 2.5rem);
	}

	.eyebrow,
	.section-kicker,
	.metadata-label {
		margin: 0 0 var(--space-3);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.trip-title-row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-8);
		align-items: flex-start;
		margin-bottom: var(--space-10);
	}

	h1,
	h2 {
		margin: 0;
	}

	h1 {
		font-size: clamp(2rem, 5vw, 3.4rem);
		line-height: 0.96;
	}

	h2 {
		font-size: 1.5rem;
	}

	.trip-title-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-4);
	}

	.type-label,
	.btn-metadata,
	.btn-back,
	.btn-add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		min-height: 2.75rem;
		padding: 0 var(--space-8);
		border-radius: var(--radius-pill);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.type-label {
		border: 1px solid transparent;
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

	.btn-back,
	.btn-metadata {
		background: transparent;
		border: 1px solid var(--color-border-strong);
		color: var(--color-text);
		cursor: pointer;
	}

	.btn-back:hover,
	.btn-metadata:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-primary);
	}

	.btn-back:active,
	.btn-metadata:active {
		background: var(--color-bg-accent);
	}

	.trip-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
	}

	.meta-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--color-bg-accent);
		color: var(--color-text-muted);
	}

	.metadata-panel {
		margin-top: var(--space-10);
		padding: var(--space-8);
		border-radius: var(--radius-md);
		background: var(--color-bg-accent);
		border: 1px solid var(--color-border);
		display: grid;
		gap: var(--space-6);
	}

	.metadata-value {
		margin: 0;
		font-weight: 600;
	}

	.metadata-panel ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: var(--space-3);
		color: var(--color-text-muted);
	}

	.metadata-panel li.matched {
		color: var(--color-success);
	}

	.metadata-panel li.missing {
		color: var(--color-warning);
	}

	.sub-sections {
		display: grid;
		gap: var(--space-8);
		margin-top: var(--space-10);
	}

	.sub-section {
		padding: var(--space-10);
		border-radius: var(--radius-lg);
	}

	.section-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.btn-add {
		background: var(--color-primary);
		color: var(--color-primary-contrast);
		border: none;
		cursor: pointer;
		box-shadow: var(--shadow-sm);
	}

	.btn-add:hover {
		background: var(--color-primary-strong);
		transform: translateY(-1px);
	}

	.btn-add:active {
		transform: translateY(0);
	}

	@media (max-width: 720px) {
		.trip-detail {
			padding-inline: var(--space-8);
		}

		.trip-title-row,
		.section-toolbar {
			flex-direction: column;
			align-items: flex-start;
		}

		.trip-title-actions {
			justify-content: flex-start;
		}

		.btn-add,
		.btn-metadata {
			width: 100%;
		}
	}
</style>
