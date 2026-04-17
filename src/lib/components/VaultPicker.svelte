<script lang='ts'>
	import { FolderOpen, FolderPlus, Play } from '@lucide/svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'
	import SourceLink from './SourceLink.svelte'

	let phase = $state<'checking' | 'opening' | 'ready'>('checking')
	const unsupported = !('showDirectoryPicker' in window)
	const demoEnabled = __DEMO__

	async function handleOpen() {
		phase = 'opening'
		await vaultStore.openVault()
		if (vaultStore.handle) {
			uiStore.navigate('travel-list')
		}
		else {
			phase = 'ready'
		}
	}

	async function handleOpenDemo() {
		phase = 'opening'
		await vaultStore.openDemoVault()
		uiStore.navigate('travel-list')
	}

	async function tryReopen() {
		const success = await vaultStore.reopenVault()
		if (success) {
			uiStore.navigate('travel-list')
		}
		else {
			phase = 'ready'
		}
	}

	$effect(() => {
		if (!unsupported) {
			tryReopen()
		}
		else {
			phase = 'ready'
		}
	})
</script>

{#if phase === 'checking'}
	<!-- Silent check — render nothing to avoid flashing the splash screen -->
{:else}
	<div class='vault-picker'>
		<div class='vault-picker-inner'>
			<div class='intro'>
				<div class='logo-mark'>
					<FolderPlus size={40} strokeWidth={1.5} aria-hidden='true' />
				</div>

				<div class='intro-copy'>
					<h1>RoamVault</h1>
					<p class='tagline'>Open your Obsidian travel vault in the browser and keep every change on your device.</p>
				</div>
			</div>

			{#if unsupported && !demoEnabled}
				<div class='message-card unsupported'>
					<p>Your browser does not support the File System Access API.</p>
					<p>Please use <strong>Chrome</strong>, <strong>Edge</strong>, or another Chromium-based browser.</p>
				</div>
			{:else if unsupported && demoEnabled}
				<div class='message-card unsupported'>
					<p>Your browser does not support the File System Access API — but you can still try the demo!</p>
				</div>

				<button class='open-vault-btn' onclick={handleOpenDemo}>
					<Play class='button-icon' size={18} aria-hidden='true' />
					Open Demo Vault
				</button>
			{:else if phase === 'opening' || vaultStore.loading}
				<div class='loading-card' role='status' aria-live='polite'>
					<div class='spinner' aria-hidden='true'></div>
					<p>Opening vault</p>
				</div>
			{:else}
				<button class='open-vault-btn' onclick={handleOpen}>
					<FolderOpen class='button-icon' size={18} aria-hidden='true' />
					Open Vault
				</button>

				<p class='supporting-copy'>
					{#if demoEnabled}
						Need a preview first? <button class='demo-link' onclick={handleOpenDemo}>Open the demo vault</button> with sample trips.
					{:else}
						Reconnect to your travel vault or choose a new one to start planning.
					{/if}
				</p>

				{#if vaultStore.error}
					<p class='error'>{vaultStore.error}</p>
				{/if}
			{/if}
		</div>

		<SourceLink />
	</div>
{/if}

<style>
	.vault-picker {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-16);
	}

	.vault-picker-inner {
		width: min(100%, 42rem);
		padding: clamp(2rem, 4vw, 3.25rem);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-bg-card-strong) 92%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
		margin-bottom: var(--space-12);
		display: grid;
		gap: var(--space-14);
	}

	.intro {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		gap: var(--space-10);
	}

	.intro-copy {
		display: grid;
		gap: var(--space-6);
		max-width: 32rem;
	}

	.logo-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		border-radius: 28px;
		background: var(--color-primary-soft);
		border: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
		color: var(--color-primary);
		box-shadow: var(--shadow-sm);
		transform-origin: center;
	}

	h1 {
		font-size: clamp(2.5rem, 8vw, 4rem);
		line-height: 0.95;
		margin: 0;
	}

	.tagline {
		color: var(--color-text-muted);
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.65;
		max-width: 30rem;
	}

	.open-vault-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		min-height: 3.25rem;
		padding: 0 var(--space-14);
		background: var(--color-primary);
		color: var(--color-primary-contrast);
		border: none;
		border-radius: var(--radius-pill);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: var(--shadow-sm);
	}

	.open-vault-btn:hover {
		background: var(--color-primary-strong);
		transform: translateY(-1px);
	}

	.open-vault-btn:hover :global(.button-icon),
	.open-vault-btn:focus-visible :global(.button-icon) {
		transform: translateX(2px);
	}

	.open-vault-btn:active {
		transform: translateY(0);
	}

	.demo-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.demo-link:hover {
		color: var(--color-primary-strong);
	}

	.supporting-copy {
		margin: var(--space-8) auto 0;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		max-width: 38ch;
	}

	.message-card,
	.loading-card {
		max-width: 34rem;
		padding: var(--space-12);
		border-radius: var(--radius-md);
		background: var(--color-bg-accent);
		border: 1px solid var(--color-border);
	}

	.message-card p,
	.loading-card p {
		margin: 0;
	}

	.message-card p + p {
		margin-top: var(--space-4);
	}

	.loading-card {
		display: grid;
		justify-items: center;
		gap: var(--space-6);
	}

	.spinner {
		width: 34px;
		height: 34px;
	}

	.error {
		margin-top: var(--space-8);
		color: var(--color-danger);
		font-size: 0.875rem;
	}

	@media (max-width: 640px) {
		.vault-picker {
			padding: var(--space-10);
		}

		.vault-picker-inner {
			gap: var(--space-12);
		}

		.intro {
			grid-template-columns: 1fr;
			gap: var(--space-8);
		}

		.logo-mark {
			width: 72px;
			height: 72px;
		}

		.open-vault-btn {
			width: 100%;
		}

		.supporting-copy {
			max-width: none;
		}
	}
</style>
