<script lang='ts'>
	import type { SubItem } from '../models/types'
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
</script>

<div class='item-list'>
	<h3>{label}</h3>
	{#if items.length === 0}
		<p class='empty'>No {label.toLowerCase()} yet</p>
	{:else}
		<ul>
			{#each sorted as item (item.path)}
				<li class='item'>
					<span class='item-name'>{item.name}</span>
					<span class='item-meta'>
						{#if item.frontmatter.Location}
							<span class='meta-tag'>{item.frontmatter.Location}</span>
						{/if}
						{#if item.frontmatter.startDate}
							<span class='meta-date'>
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
</div>

<style>
	.item-list {
		margin: 0;
	}

	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin: 0 0 var(--space-6);
	}

	.empty {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-style: italic;
		margin: 0;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-5) var(--space-6);
		background: var(--color-bg-input);
		border-radius: 8px;
		font-size: 0.9375rem;
	}

	.item-name {
		font-weight: 500;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.meta-tag {
		background: var(--color-bg-hover);
		padding: var(--space-1) var(--space-4);
		border-radius: 4px;
	}
</style>
