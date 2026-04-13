<script lang='ts'>
	import { Check, Folder, Plus, TriangleAlert } from '@lucide/svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import SourceLink from './SourceLink.svelte'
	import TripCard from './TripCard.svelte'

	const sortedYears = $derived(
		Object.keys(vaultStore.travelTree).sort((a, b) => b.localeCompare(a)),
	)

	const totalTrips = $derived(
		sortedYears.reduce((count, year) => count + vaultStore.travelTree[year].length, 0),
	)

	if (!vaultStore.handle && !vaultStore.loading) {
		vaultStore.reopenVault().then((ok) => {
			if (!ok)
				uiStore.navigate('vault-picker')
		})
	}

	async function handleChangeVault() {
		await vaultStore.closeVault()
		uiStore.navigate('vault-picker')
	}
</script>

<div class='travel-list'>
	<header class='hero'>
		<div class='hero-top'>
			<div>
				<p class='eyebrow'>Vault overview</p>
				<h1>{vaultStore.name}</h1>
			</div>
			<nav class='hero-actions' aria-label='Trip actions'>
				<button type='button' class='btn-primary' onclick={() => uiStore.openCreateTripModal()}>
					<Plus size={16} aria-hidden='true' />
					New Trip
				</button>
				<button type='button' class='btn-secondary' onclick={handleChangeVault}>
					Change Vault
				</button>
			</nav>
		</div>

		<div class='hero-bottom'>
			<p class='hero-summary'>
				{totalTrips} trip{totalTrips !== 1 ? 's' : ''} across {sortedYears.length} year{sortedYears.length !== 1 ? 's' : ''}
				{#if vaultStore.isDemo}
					<span class='demo-badge'>Demo: Changes won't persist</span>
				{/if}
			</p>
			<div class='status-list'>
				<span class='status-badge' class:ok={vaultStore.hasTravelFolder} class:missing={!vaultStore.hasTravelFolder}>
					{#if vaultStore.hasTravelFolder}<Check size={12} aria-hidden='true' />{:else}<TriangleAlert size={12} aria-hidden='true' />{/if}
					Travel
				</span>
				<span class='status-badge' class:ok={vaultStore.hasTemplatesFolder} class:missing={!vaultStore.hasTemplatesFolder}>
					{#if vaultStore.hasTemplatesFolder}<Check size={12} aria-hidden='true' />{:else}<TriangleAlert size={12} aria-hidden='true' />{/if}
					_templates
				</span>
			</div>
		</div>
	</header>

	{#if vaultStore.loading}
		<div class='state-panel' role='status' aria-live='polite'>
			<div class='spinner' aria-hidden='true'></div>
			<p>Loading travel data</p>
		</div>
	{:else if vaultStore.error}
		<div class='state-panel error-message'>
			<p>{vaultStore.error}</p>
			<button type='button' class='btn-secondary' onclick={() => vaultStore.reload()}>Retry</button>
		</div>
	{:else if sortedYears.length === 0}
		<div class='state-panel empty-state'>
			<Folder size={48} strokeWidth={1.5} opacity={0.45} aria-hidden='true' />
			<h2>No travel plans found</h2>
			<p>Create your first trip or make sure your vault has a <code>Travel</code> folder.</p>
			<button type='button' class='btn-primary btn-large' onclick={() => uiStore.openCreateTripModal()}>
				<Plus size={20} aria-hidden='true' />
				Create First Trip
			</button>
		</div>
	{:else}
		<div class='years'>
			{#each sortedYears as year (year)}
				<section class='year-section'>
					<div class='year-header'>
						<h2 class='year-heading'>{year}</h2>
						<span class='year-count'>{vaultStore.travelTree[year].length} trip{vaultStore.travelTree[year].length !== 1 ? 's' : ''}</span>
					</div>
					<div class='trip-grid'>
						{#each vaultStore.travelTree[year] as trip (trip.path)}
							<TripCard {trip} />
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

<footer>
	<div>Made by <a href='https://www.lekoarts.de/?utm_source=roamvault' target='_blank' rel='noopener noreferrer'>LekoArts</a></div><SourceLink />
</footer>

<style>
	.travel-list {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-12) var(--space-10) var(--space-20);
	}

	.hero {
		margin-bottom: var(--space-16);
		padding: clamp(1.5rem, 4vw, 2.5rem);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-card);
		box-shadow: var(--shadow-sm);
		backdrop-filter: blur(18px);
	}

	.year-section,
	.state-panel {
		border: 1px solid var(--color-border);
		background: var(--color-bg-card);
		box-shadow: var(--shadow-sm);
	}

	.hero-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-8);
		flex-wrap: wrap;
	}

	.eyebrow {
		margin: 0 0 var(--space-3);
		font-size: 0.75rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.2rem);
		line-height: 0.95;
	}

	.hero-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		flex-wrap: wrap;
		margin-top: var(--space-10);
		padding-top: var(--space-10);
		border-top: 1px solid var(--color-border);
	}

	.hero-summary {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.demo-badge {
		display: inline-block;
		margin-left: var(--space-4);
		padding: var(--space-1) var(--space-4);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		border-radius: var(--radius-pill);
		background: var(--color-warning);
		color: white;
		vertical-align: middle;
	}

	.status-list {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		font-size: 0.72rem;
		font-weight: 600;
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-pill);
		font-family: var(--font-mono);
		border: 1px solid transparent;
	}

	.status-badge.ok {
		color: var(--color-success);
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		border-color: color-mix(in srgb, var(--color-success) 24%, transparent);
	}

	.status-badge.missing {
		color: var(--color-warning);
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
		border-color: color-mix(in srgb, var(--color-warning) 24%, transparent);
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
	}

	button {
		cursor: pointer;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		min-height: 2.85rem;
		padding: 0 var(--space-8);
		border-radius: var(--radius-pill);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.btn-primary {
		background: var(--color-primary);
		color: var(--color-primary-contrast);
		border: none;
		box-shadow: var(--shadow-sm);
	}

	.btn-primary:hover {
		background: var(--color-primary-strong);
		transform: translateY(-1px);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid var(--color-border-strong);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-primary);
	}

	.btn-secondary:active {
		background: var(--color-bg-accent);
	}

	.btn-large {
		min-height: 3.15rem;
		padding-inline: var(--space-12);
	}

	.years {
		display: grid;
		gap: var(--space-10);
	}

	.year-section {
		padding: var(--space-10);
		border-radius: var(--radius-lg);
	}

	.year-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.year-heading {
		font-size: 1.5rem;
		margin: 0;
	}

	.year-count {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.trip-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-8);
	}

	.state-panel {
		text-align: center;
		padding: var(--space-24) var(--space-12);
		border-radius: var(--radius-lg);
	}

	.empty-state h2 {
		margin: var(--space-8) 0 var(--space-4);
		font-size: 1.5rem;
	}

	.empty-state p,
	.error-message p {
		margin: 0 0 var(--space-10);
		color: var(--color-text-muted);
	}

	.spinner {
		width: 34px;
		height: 34px;
		margin: 0 auto var(--space-6);
	}

	.error-message {
		color: var(--color-danger);
	}

	@media (max-width: 640px) {
		.travel-list {
			padding-inline: var(--space-8);
		}

		.hero-top {
			flex-direction: column;
		}

		.hero-bottom {
			flex-direction: column;
			align-items: flex-start;
		}

		.year-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.hero-actions {
			flex-direction: column;
			width: 100%;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}

	footer {
		margin: var(--space-20) 0 var(--space-12);
		text-align: center;
		font-size: 1rem;
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-10);
	}

	footer a {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	footer a:hover {
		color: var(--color-text);
	}

	footer a:focus-visible {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
