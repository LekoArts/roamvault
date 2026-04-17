<script lang='ts'>
	import type { SubItem } from '../models/types'
	import { MapPin } from '@lucide/svelte'
	import { formatDate } from '../utils/format'

	const {
		items,
		label,
	}: {
		items: SubItem[]
		label: string
	} = $props()

	const sorted = $derived(
		items.toSorted((a, b) => {
			const aDate = String(a.frontmatter.startDate ?? '')
			const bDate = String(b.frontmatter.startDate ?? '')
			return aDate.localeCompare(bDate)
		}),
	)

	const groupedByLocation = $derived.by(() => {
		const groups = new Map<string, SubItem[]>()

		for (const item of sorted) {
			const location = item.frontmatter.Location as string | undefined
			if (!location)
				continue

			const existing = groups.get(location)
			if (existing) {
				existing.push(item)
			}
			else {
				groups.set(location, [item])
			}
		}

		return [...groups.entries()]
	})

	const ungroupedItems = $derived(sorted.filter(item => !item.frontmatter.Location))
</script>

<div class='item-list'>
	{#if items.length === 0}
		<p class='empty'>No {label.toLowerCase()} yet</p>
	{:else}
		{#if groupedByLocation.length > 0}
			{#each groupedByLocation as [location, locationItems]}
				<div class='location-group'>
					<p class='location-heading'>
						<MapPin size={14} aria-hidden='true' />
						{location}
					</p>
					<ul>
						{#each locationItems as item (item.path)}
							<li class='item'>
								<span class='item-name'>{item.name}</span>
								{#if item.frontmatter.startDate}
									<span class='item-date'>
										{formatDate(item.frontmatter.startDate)}
										{#if item.frontmatter.endDate && item.frontmatter.endDate !== item.frontmatter.startDate}
											– {formatDate(item.frontmatter.endDate)}
										{/if}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		{/if}

		{#if ungroupedItems.length > 0}
			<ul>
				{#each ungroupedItems as item (item.path)}
					<li class='item'>
						<span class='item-name'>{item.name}</span>
						<span class='item-meta'>
							{#if item.frontmatter.Location}
								<span class='meta-tag'>
									<MapPin size={12} aria-hidden='true' />
									{item.frontmatter.Location}
								</span>
							{/if}
							{#if item.frontmatter.startDate}
								<span class='item-date'>
									{formatDate(item.frontmatter.startDate)}
									{#if item.frontmatter.endDate && item.frontmatter.endDate !== item.frontmatter.startDate}
										– {formatDate(item.frontmatter.endDate)}
									{/if}
								</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.item-list {
		margin: 0;
		display: grid;
		gap: var(--space-6);
	}

	.empty {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin: 0;
		padding: var(--space-8);
		text-align: center;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}

	.location-group {
		display: grid;
		gap: var(--space-4);
	}

	.location-heading {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		margin: 0;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-3);
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-5) var(--space-6);
		border-radius: var(--radius-sm);
		font-size: 0.95rem;
		transition: background-color 0.15s ease;
	}

	.location-group .item {
		background: color-mix(in srgb, var(--color-bg-accent) 48%, var(--color-bg-card-strong));
	}

	.item-list > ul .item {
		background: color-mix(in srgb, var(--color-bg-accent) 68%, var(--color-bg-card-strong));
		border: 1px solid var(--color-border);
	}

	.item:hover {
		background: var(--color-bg-hover);
	}

	.item-name {
		font-weight: 500;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-shrink: 0;
	}

	.item-date {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.meta-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-muted);
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		padding: var(--space-1) var(--space-4);
		border-radius: var(--radius-pill);
	}

	@media (max-width: 700px) {
		.item {
			align-items: flex-start;
			flex-direction: column;
		}

		.item-meta {
			width: 100%;
			flex-wrap: wrap;
		}

		.item-date,
		.meta-tag {
			white-space: normal;
		}
	}
</style>
