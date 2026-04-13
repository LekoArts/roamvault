<script lang='ts'>
	import type { SubItem } from '../models/types'
	import { ChevronRight, MapPin, Plus, X } from '@lucide/svelte'
	import { parseDayActivities } from '../parser/planning'
	import { formatDate, generateDateRange } from '../utils/format'
	import { stripWikiLink } from '../utils/wiki-link'

	const {
		planningItems,
		activities,
		onremove,
		onadd,
	}: {
		planningItems: SubItem[]
		activities: SubItem[]
		onremove?: (planningItem: SubItem, activityName: string, date?: string) => void
		onadd?: (planningItem: SubItem, activityName: string, date?: string) => void
	} = $props()

	const sorted = $derived(
		planningItems.toSorted((a, b) => {
			const aDate = String(a.frontmatter.startDate ?? '')
			const bDate = String(b.frontmatter.startDate ?? '')
			return aDate.localeCompare(bDate)
		}),
	)

	function resolveActivities(item: SubItem): { name: string, activity: SubItem | null }[] {
		const raw = item.frontmatter.Activities
		if (!raw || !Array.isArray(raw) || raw.length === 0)
			return []

		return (raw as string[]).map((link) => {
			const name = stripWikiLink(String(link))
			const found = activities.find(a => a.name === name) ?? null
			return { name, activity: found }
		})
	}

	function isMultiDay(item: SubItem): boolean {
		return !!item.frontmatter.startDate
			&& !!item.frontmatter.endDate
			&& item.frontmatter.startDate !== item.frontmatter.endDate
	}

	function getDayActivities(item: SubItem): Map<string, string[]> {
		return parseDayActivities(item.content ?? '')
	}

	function resolveActivity(name: string): SubItem | null {
		return activities.find(a => a.name === name) ?? null
	}

	function getAvailableActivities(item: SubItem): SubItem[] {
		const raw = item.frontmatter.Activities
		const linkedNames = new Set<string>()
		if (raw && Array.isArray(raw)) {
			for (const link of raw as string[]) {
				linkedNames.add(stripWikiLink(String(link)))
			}
		}
		return activities.filter(a => !linkedNames.has(a.name))
	}
</script>

<div class='planning-list'>
	{#if sorted.length === 0}
		<p class='empty'>No planning yet</p>
	{:else}
		{#each sorted as item (item.path)}
			{@const multiDay = isMultiDay(item)}
			{@const available = getAvailableActivities(item)}
			<details class='planning-item'>
				<summary class='planning-summary'>
					<span class='chevron-icon'><ChevronRight size={14} aria-hidden='true' /></span>
					<span class='planning-name'>{item.name}</span>
					{#if item.frontmatter.startDate}
						<span class='planning-date'>
							{formatDate(item.frontmatter.startDate)}
							{#if item.frontmatter.endDate && item.frontmatter.endDate !== item.frontmatter.startDate}
								– {formatDate(item.frontmatter.endDate)}
							{/if}
						</span>
					{/if}
				</summary>
				<div class='planning-content'>
					{#if multiDay}
						{@const dayMap = getDayActivities(item)}
						{@const allDays = generateDateRange(item.frontmatter.startDate, item.frontmatter.endDate)}
						{#each allDays as date (date)}
							{@const dayActivityNames = dayMap.get(date) ?? []}
							<div class='day-group'>
								<h4 class='day-heading'>{date}</h4>
								{#if dayActivityNames.length === 0}
									<p class='no-activities'>No activities for this day</p>
								{:else}
									<ul class='activity-list'>
										{#each dayActivityNames as actName}
											{@const activity = resolveActivity(actName)}
											<li class='activity-item'>
												<span class='activity-name'>{actName}</span>
												<span class='activity-actions'>
													{#if activity?.frontmatter.Location}
														<span class='activity-location'>
															<MapPin size={12} aria-hidden='true' />
															{activity.frontmatter.Location}
														</span>
													{:else if !activity}
														<span class='activity-missing'>not found</span>
													{/if}
													{#if onremove}
														<button
															class='btn-remove'
															aria-label='Remove {actName} from {date}'
															onclick={() => onremove(item, actName, date)}
														>
															<X size={14} />
														</button>
													{/if}
												</span>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/each}
						{#if onadd && available.length > 0}
							<div class='add-activity-row'>
								<select class='add-activity-select day-select' aria-label='Select day' data-planning-day={item.name}>
									{#each allDays as date}
										<option value={date}>{date}</option>
									{/each}
								</select>
								<select class='add-activity-select' aria-label='Select activity to add' data-planning={item.name}>
									{#each available as act}
										<option value={act.name}>{act.name}</option>
									{/each}
								</select>
								<button
									class='btn-add-activity'
									aria-label='Add activity'
									onclick={(e) => {
										const btn = e.currentTarget as HTMLElement
										const actSelect = btn.previousElementSibling as HTMLSelectElement
										const daySelect = actSelect.previousElementSibling as HTMLSelectElement
										if (actSelect?.value && daySelect?.value)
											onadd(item, actSelect.value, daySelect.value)
									}}
								>
									<Plus size={14} />
								</button>
							</div>
						{/if}
					{:else}
						{@const linked = resolveActivities(item)}
						{#if linked.length === 0}
							<p class='no-activities'>No activities planned</p>
						{:else}
							<ul class='activity-list'>
								{#each linked as { name, activity }}
									<li class='activity-item'>
										<span class='activity-name'>{name}</span>
										<span class='activity-actions'>
											{#if activity?.frontmatter.Location}
												<span class='activity-location'>
													<MapPin size={12} aria-hidden='true' />
													{activity.frontmatter.Location}
												</span>
											{:else if !activity}
												<span class='activity-missing'>not found</span>
											{/if}
											{#if onremove}
												<button
													class='btn-remove'
													aria-label='Remove {name}'
													onclick={() => onremove(item, name)}
												>
													<X size={14} />
												</button>
											{/if}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
						{#if onadd && available.length > 0}
							<div class='add-activity-row'>
								<select class='add-activity-select' aria-label='Select activity to add' data-planning={item.name}>
									{#each available as act}
										<option value={act.name}>{act.name}</option>
									{/each}
								</select>
								<button
									class='btn-add-activity'
									aria-label='Add activity'
									onclick={(e) => {
										const select = (e.currentTarget as HTMLElement).previousElementSibling as HTMLSelectElement
										if (select?.value)
											onadd(item, select.value)
									}}
								>
									<Plus size={14} />
								</button>
							</div>
						{/if}
					{/if}
				</div>
			</details>
		{/each}
	{/if}
</div>

<style>
	.planning-list {
		margin: 0;
		display: grid;
		gap: var(--space-3);
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

	.planning-item {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-accent);
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.planning-item:hover {
		border-color: var(--color-border-strong);
	}

	.planning-item[open] {
		background: var(--color-bg-card);
	}

	.planning-summary {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6);
		cursor: pointer;
		font-size: 0.95rem;
		list-style: none;
		user-select: none;
	}

	.planning-summary::-webkit-details-marker {
		display: none;
	}

	.planning-summary::marker {
		display: none;
		content: '';
	}

	.chevron-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
	}

	.planning-item[open] .chevron-icon {
		transform: rotate(90deg);
	}

	.planning-name {
		font-weight: 500;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.planning-date {
		margin-left: auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.planning-content {
		padding: 0 var(--space-6) var(--space-6) var(--space-6);
		margin-left: calc(14px + var(--space-4));
	}

	.day-group {
		margin-bottom: var(--space-4);
	}

	.day-group:last-child {
		margin-bottom: 0;
	}

	.day-heading {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3) 0;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-border);
	}

	.no-activities {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.activity-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}

	.activity-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		font-size: 0.88rem;
		background: var(--color-bg-accent);
		border-radius: var(--radius-sm);
	}

	.activity-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.activity-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.activity-location {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 0.78rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.activity-missing {
		font-size: 0.78rem;
		color: var(--color-danger);
		font-style: italic;
	}

	.btn-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		border: none;
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: color 0.15s ease, background-color 0.15s ease;
	}

	.btn-remove:hover {
		color: var(--color-danger);
		background: var(--color-bg-hover);
	}

	.add-activity-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}

	.add-activity-select {
		max-width: 300px;
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-input);
		color: var(--color-text);
		font-size: 0.85rem;
		font-family: var(--font-sans);
	}

	.day-select {
		max-width: 140px;
	}

	.btn-add-activity {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-accent);
		color: var(--color-text);
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.btn-add-activity:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-border-strong);
	}
</style>
