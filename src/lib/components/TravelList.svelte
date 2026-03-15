<script lang='ts'>
	import { Check, Folder, Plus, TriangleAlert } from '@lucide/svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import TripCard from './TripCard.svelte'

	const sortedYears = $derived(
		Object.keys(vaultStore.travelTree).sort((a, b) => b.localeCompare(a)),
	)

	// After HMR, module state is wiped but the view may still be 'travel-list'.
	// Recover by re-opening the vault from IDB.
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
	<header class='header'>
		<div class='header-left'>
			<h1>
				<Folder size={22} />
				{vaultStore.name}
			</h1>
		</div>
		<div class='header-actions'>
			<span class='status-badge' class:ok={vaultStore.hasTravelFolder} class:missing={!vaultStore.hasTravelFolder}>
				{#if vaultStore.hasTravelFolder}<Check size={12} />{:else}<TriangleAlert size={12} />{/if}
				Travel
			</span>
			<span class='status-badge' class:ok={vaultStore.hasTemplatesFolder} class:missing={!vaultStore.hasTemplatesFolder}>
				{#if vaultStore.hasTemplatesFolder}<Check size={12} />{:else}<TriangleAlert size={12} />{/if}
				_templates
			</span>
			<button class='btn-new' onclick={() => uiStore.openCreateTripModal()}>
				<Plus size={16} />
				New Trip
			</button>
			<button class='btn-secondary' onclick={handleChangeVault}>
				Change Vault
			</button>
		</div>
	</header>

	{#if vaultStore.loading}
		<div class='loading'>
			<div class='spinner'></div>
			<p>Loading travel data...</p>
		</div>
	{:else if vaultStore.error}
		<div class='error-message'>
			<p>{vaultStore.error}</p>
			<button class='btn-secondary' onclick={() => vaultStore.reload()}>Retry</button>
		</div>
	{:else if sortedYears.length === 0}
		<div class='empty-state'>
			<Folder size={48} strokeWidth={1.5} opacity={0.4} />
			<h2>No travel plans found</h2>
			<p>Create your first trip or make sure your vault has a <code>Travel</code> folder.</p>
			<button class='btn-new btn-large' onclick={() => uiStore.openCreateTripModal()}>
				<Plus size={22} />
				Create First Trip
			</button>
		</div>
	{:else}
		<div class='years'>
			{#each sortedYears as year (year)}
				<section class='year-section'>
					<h2 class='year-heading'>{year}</h2>
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

<style>
	.travel-list {
		max-width: 960px;
		margin: 0 auto;
		padding: 20px;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 32px;
		gap: 16px;
		flex-wrap: wrap;
	}

	.header-left h1 {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 1.375rem;
		font-weight: 700;
		margin: 0;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: 6px;
		font-family: var(--font-mono, monospace);
	}

	.status-badge.ok {
		color: var(--color-success, #22c55e);
		background: color-mix(in srgb, var(--color-success, #22c55e) 10%, transparent);
	}

	.status-badge.missing {
		color: var(--color-warning, #f59e0b);
		background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-new {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-new :global(svg) {
		flex-shrink: 0;
		vertical-align: middle;
	}

	.btn-new:hover {
		opacity: 0.9;
	}

	.btn-large {
		padding: 10px 20px;
		font-size: 1rem;
		gap: 8px;
	}

	.btn-secondary {
		padding: 8px 16px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-secondary:hover {
		background: var(--color-bg-hover);
	}

	.year-heading {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 16px;
		color: var(--color-text-muted);
	}

	.year-section {
		margin-bottom: 36px;
	}

	.trip-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: var(--color-text-muted);
	}

	.empty-state h2 {
		margin: 0 0 8px;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.empty-state p {
		margin: 0 0 24px;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 60px 20px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-message {
		text-align: center;
		padding: 40px 20px;
		color: var(--color-danger);
	}
</style>
