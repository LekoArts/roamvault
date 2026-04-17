<script lang='ts'>
	import { Github } from '@lucide/svelte'
</script>

<a class='source-link' href='https://github.com/LekoArts/roamvault' target='_blank' rel='noopener noreferrer'>
	<Github size={16} aria-hidden='true' />
	Source on GitHub
</a>

<style>
	.source-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-6);
		border-radius: var(--radius-pill);
		font-size: 0.95rem;
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.source-link:hover {
		color: var(--color-text);
		background: var(--color-bg-hover);
	}

	.source-link:focus-visible {
		color: var(--color-text);
		background: var(--color-bg-hover);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 22%, transparent);
	}
</style>
