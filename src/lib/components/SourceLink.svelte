<script lang='ts'>
	import { Github } from '@lucide/svelte'
</script>

<a class='source-link' href='https://github.com/LekoArts/roamvault' target='_blank' rel='noopener noreferrer'>
	<Github size={14} aria-hidden='true' />
	Source on GitHub
</a>

<style>
	.source-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-10);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-decoration: none;
	}

  .source-link:hover {
		color: var(--color-text);
	}
</style>
