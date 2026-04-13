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
		<div class='trip-banner' style:background-image='url({banner})' role='img' aria-label='Banner for {trip.name}'></div>
	{/if}
	<div class='trip-info'>
		<div class='trip-header'>
			<span class='badge {typeClass}'>{typeLabel}</span>
			{#if dateRange}
				<p class='trip-dates'>{dateRange}</p>
			{/if}
		</div>
		<h3>{trip.name}</h3>
		{#if itemCount > 0}
			<p class='trip-items'>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
		{/if}
	</div>
</button>

<style>
	.trip-card {
		display: flex;
		flex-direction: column;
		min-height: 15.5rem;
		background: var(--color-bg-card-strong);
		border: 1px solid var(--color-border);
		border-radius: calc(var(--radius-lg) - 4px);
		overflow: hidden;
		cursor: pointer;
		text-align: left;
		width: 100%;
		padding: 0;
		font: inherit;
		color: inherit;
		box-shadow: var(--shadow-sm);
	}

	.trip-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.trip-card:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.trip-card:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.trip-banner {
		height: 144px;
		background-size: cover;
		background-position: center;
	}

	.trip-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-8);
	}

	.trip-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	h3 {
		margin: 0;
		font-size: 1.4rem;
		line-height: 1.05;
	}

	.badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-pill);
		text-transform: uppercase;
		letter-spacing: 0.08em;
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

	.trip-dates,
	.trip-items {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
