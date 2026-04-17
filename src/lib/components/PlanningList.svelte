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

	type ResolvedActivity = { name: string, activity: SubItem | null }
	type PlanningMeta = {
		item: SubItem
		multiDay: boolean
		dayMap: Map<string, string[]>
		allDays: string[]
		linked: ResolvedActivity[]
		available: SubItem[]
	}

	const sorted = $derived(
		planningItems.toSorted((a, b) => {
			const aDate = String(a.frontmatter.startDate ?? '')
			const bDate = String(b.frontmatter.startDate ?? '')
			return aDate.localeCompare(bDate)
		}),
	)

	const activityMap = $derived.by(() => new Map(activities.map(activity => [activity.name, activity])))

	const planningMetaByPath = $derived.by(() => {
		const meta = new Map<string, PlanningMeta>()

		for (const item of sorted) {
			const raw = item.frontmatter.Activities
			const linkedNames = Array.isArray(raw)
				? raw.map(link => stripWikiLink(String(link)))
				: []
			const linked = linkedNames.map((name) => {
				const activity = activityMap.get(name) ?? null
				return { name, activity }
			})
			const linkedNameSet = new Set(linkedNames)
			const available = activities
				.filter(activity => !linkedNameSet.has(activity.name))
				.toSorted((a, b) => a.name.localeCompare(b.name))
			const multiDay = !!item.frontmatter.startDate
				&& !!item.frontmatter.endDate
				&& item.frontmatter.startDate !== item.frontmatter.endDate
			const dayMap = parseDayActivities(item.content ?? '')
			const allDays = multiDay
				? generateDateRange(item.frontmatter.startDate, item.frontmatter.endDate)
				: []

			meta.set(item.path, {
				item,
				multiDay,
				dayMap,
				allDays,
				linked,
				available,
			})
		}

		return meta
	})

	const selectedActivityByPath = $state<Record<string, string>>({})
	const selectedDayByPath = $state<Record<string, string>>({})

	function getMeta(item: SubItem): PlanningMeta {
		return planningMetaByPath.get(item.path) ?? {
			item,
			multiDay: false,
			dayMap: new Map(),
			allDays: [],
			linked: [],
			available: [],
		}
	}

	function resolveActivity(name: string): SubItem | null {
		return activityMap.get(name) ?? null
	}

	function getRemoveLabel(activityName: string, itemName: string, date?: string): string {
		return date
			? `Remove ${activityName} from ${itemName} on ${date}`
			: `Remove ${activityName} from ${itemName}`
	}

	function getAddLabel(itemName: string, activityName: string, date?: string): string {
		return date
			? `Add ${activityName} to ${itemName} on ${date}`
			: `Add ${activityName} to ${itemName}`
	}

	function getSelectedActivity(item: SubItem): string {
		const available = getMeta(item).available
		return selectedActivityByPath[item.path] ?? available[0]?.name ?? ''
	}

	function setSelectedActivity(item: SubItem, value: string) {
		selectedActivityByPath[item.path] = value
	}

	function getSelectedDay(item: SubItem): string {
		const allDays = getMeta(item).allDays
		return selectedDayByPath[item.path] ?? allDays[0] ?? ''
	}

	function setSelectedDay(item: SubItem, value: string) {
		selectedDayByPath[item.path] = value
	}
</script>

<div class='planning-list'>
	{#if sorted.length === 0}
		<p class='empty'>No planning yet</p>
	{:else}
		{#each sorted as item (item.path)}
			{@const meta = getMeta(item)}
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
					{#if meta.multiDay}
						{#each meta.allDays as date (date)}
							{@const dayActivityNames = meta.dayMap.get(date) ?? []}
							<section class='day-group'>
								<h3 class='day-heading'>{date}</h3>
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
															aria-label={getRemoveLabel(actName, item.name, date)}
															onclick={() => onremove(item, actName, date)}
														>
															<X class='button-icon' size={14} />
														</button>
													{/if}
												</span>
											</li>
										{/each}
									</ul>
								{/if}
							</section>
						{/each}
						{#if onadd && meta.available.length > 0}
							<div class='add-activity-row'>
								<label class='control-label'>
									<select
										class='add-activity-select day-select'
										aria-label='Select day'
										value={getSelectedDay(item)}
										onchange={event => setSelectedDay(item, (event.currentTarget as HTMLSelectElement).value)}
									>
										{#each meta.allDays as date}
											<option value={date}>{date}</option>
										{/each}
									</select>
								</label>
								<label class='control-label control-label-grow'>
									<select
										class='add-activity-select'
										aria-label='Select activity to add'
										value={getSelectedActivity(item)}
										onchange={event => setSelectedActivity(item, (event.currentTarget as HTMLSelectElement).value)}
									>
										{#each meta.available as act}
											<option value={act.name}>{act.name}</option>
										{/each}
									</select>
								</label>
								<button
									class='btn-add-activity'
									aria-label={getAddLabel(item.name, getSelectedActivity(item), getSelectedDay(item))}
									onclick={() => {
										const activityName = getSelectedActivity(item)
										const date = getSelectedDay(item)
										if (activityName && date)
											onadd(item, activityName, date)
									}}
								>
									<Plus class='button-icon' size={14} />
									<span>Assign</span>
								</button>
							</div>
						{/if}
					{:else}
						{#if meta.linked.length === 0}
							<p class='no-activities'>No activities planned</p>
						{:else}
							<ul class='activity-list'>
								{#each meta.linked as { name, activity }}
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
													aria-label={getRemoveLabel(name, item.name)}
													onclick={() => onremove(item, name)}
												>
													<X class='button-icon' size={14} />
												</button>
											{/if}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
						{#if onadd && meta.available.length > 0}
							<div class='add-activity-row'>
								<label class='control-label control-label-grow'>
									<select
										class='add-activity-select'
										aria-label='Select activity to add'
										value={getSelectedActivity(item)}
										onchange={event => setSelectedActivity(item, (event.currentTarget as HTMLSelectElement).value)}
									>
										{#each meta.available as act}
											<option value={act.name}>{act.name}</option>
										{/each}
									</select>
								</label>
								<button
									class='btn-add-activity'
									aria-label={getAddLabel(item.name, getSelectedActivity(item))}
									onclick={() => {
										const activityName = getSelectedActivity(item)
										if (activityName)
											onadd(item, activityName)
									}}
								>
									<Plus class='button-icon' size={14} />
									<span>Assign</span>
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
		border: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-bg-accent) 55%, var(--color-bg-card-strong));
	}

	.planning-item {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-card);
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.planning-item:hover {
		border-color: var(--color-border-strong);
	}

	.planning-item[open] {
		border-color: color-mix(in srgb, var(--color-border-strong) 85%, transparent);
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
		overflow-wrap: anywhere;
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
		margin-bottom: var(--space-8);
	}

	.day-group:last-child {
		margin-bottom: 0;
	}

	.day-heading {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
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
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		font-size: 0.88rem;
		background: color-mix(in srgb, var(--color-bg-accent) 62%, var(--color-bg-card-strong));
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
		overflow-wrap: anywhere;
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
		width: 44px;
		height: 44px;
		padding: 0;
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

	.btn-remove:hover :global(.button-icon),
	.btn-remove:focus-visible :global(.button-icon) {
		transform: rotate(90deg) scale(0.94);
	}

	.add-activity-row {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-4);
		margin-top: var(--space-20);
		padding-top: var(--space-5);
		border-top: 1px solid color-mix(in srgb, var(--color-border) 64%, transparent);
	}

	.control-label {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}

	.control-label-grow {
		justify-content: flex-end;
	}

	.add-activity-select {
		width: min(100%, 320px);
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-input);
		color: var(--color-text);
		font-size: 0.85rem;
		font-family: var(--font-sans);
	}

	.day-select {
		width: min(100%, 140px);
	}

	.btn-add-activity {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-8);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--color-bg-accent) 68%, var(--color-bg-card-strong));
		color: var(--color-text);
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.btn-add-activity:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-border-strong);
	}

	.btn-add-activity:hover :global(.button-icon),
	.btn-add-activity:focus-visible :global(.button-icon) {
		transform: translateX(2px);
	}

	@media (max-width: 700px) {
		.planning-summary {
			align-items: flex-start;
			flex-wrap: wrap;
		}

		.planning-name {
			flex: 1 1 100%;
		}

		.planning-date {
			margin-left: calc(14px + var(--space-4));
		}

		.planning-content {
			margin-left: 0;
		}

		.activity-item {
			flex-direction: column;
		}

		.activity-actions {
			width: 100%;
			justify-content: space-between;
			flex-wrap: wrap;
		}

		.activity-location {
			white-space: normal;
		}

		.add-activity-row {
			grid-template-columns: 1fr;
		}

		.add-activity-select,
		.day-select,
		.btn-add-activity {
			width: 100%;
			max-width: none;
		}
	}
</style>
