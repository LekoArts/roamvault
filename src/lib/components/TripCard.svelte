<script lang='ts'>
	import type { TripData } from '../models/types'
	import { uiStore } from '../stores/ui.svelte'
	import { formatDateRange } from '../utils/format'

	const { trip }: { trip: TripData } = $props()

	const dateRange = $derived(formatDateRange(trip.frontmatter.startDate, trip.frontmatter.endDate))

	const typeLabel = $derived.by(() => {
		switch (trip.type) {
			case 'Travel_Simple': return 'Simple'
			case 'Travel_Advanced': return 'Advanced'
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

	const banner = $derived(trip.frontmatter.banner as string | undefined)

	const itemCount = $derived.by(() => {
		if (trip.type === 'Travel_Advanced') {
			const a = trip.activities?.length ?? 0
			const p = trip.planning?.length ?? 0
			return a + p
		}
		if (trip.type === 'Travel_Roadtrip')
			return trip.stops?.length ?? 0
		return 0
	})
</script>

<button class='trip-card' onclick={() => uiStore.selectTrip(trip)}>
	{#if banner}
		<div class='trip-banner' style:background-image='url({banner})'></div>
	{/if}
	<div class='trip-info'>
		<div class='trip-header'>
			<h3>{trip.name}</h3>
			<span class='badge {typeClass}'>{typeLabel}</span>
		</div>
		{#if dateRange}
			<p class='trip-dates'>{dateRange}</p>
		{/if}
		{#if itemCount > 0}
			<p class='trip-items'>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
		{/if}
	</div>
</button>

<style>
	.trip-card {
		display: flex;
		flex-direction: column;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		text-align: left;
		width: 100%;
		padding: 0;
		font: inherit;
		color: inherit;
		transition: box-shadow 0.2s, border-color 0.2s;
	}

	.trip-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.trip-banner {
		height: 120px;
		background-size: cover;
		background-position: center;
	}

	.trip-info {
		padding: var(--space-8);
	}

	.trip-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}

	h3 {
		margin: 0;
		font-size: 1.0625rem;
		font-weight: 600;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: var(--space-2) var(--space-4);
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

	.trip-dates {
		margin: var(--space-4) 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.trip-items {
		margin: var(--space-2) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}
</style>
