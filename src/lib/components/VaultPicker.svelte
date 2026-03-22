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
			<div class='eyebrow'>Travel planning inside your vault</div>
			<div class='logo-mark'>
				<FolderPlus size={40} strokeWidth={1.5} aria-hidden='true' />
			</div>

			<h1>RoamVault</h1>
			<p class='tagline'>Runs entirely in the browser.<br />Your data never leaves your device.</p>

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
					<Play size={18} aria-hidden='true' />
					Open Demo Vault
				</button>
			{:else if phase === 'opening' || vaultStore.loading}
				<div class='loading-card'>
					<div class='spinner'></div>
					<p>Opening vault</p>
				</div>
			{:else}
				<button class='open-vault-btn' onclick={handleOpen}>
					<FolderOpen size={18} aria-hidden='true' />
					Open Vault
				</button>

				<p class='supporting-copy'>
					{#if demoEnabled}
						Or <button class='demo-link' onclick={handleOpenDemo}>try the demo vault</button> with sample data.
					{:else}
						Reconnect to your existing travel vault or choose a fresh one to start planning.
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
		width: min(100%, 36rem);
		padding: clamp(2rem, 4vw, 3.5rem);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg-card);
		box-shadow: var(--shadow-lg);
		backdrop-filter: blur(22px);
		text-align: center;
		margin-bottom: var(--space-12);
	}

	.eyebrow {
		font-size: 0.75rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: var(--space-8);
	}

	.logo-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		border-radius: 28px;
		background: linear-gradient(145deg, var(--color-primary), var(--color-primary-strong));
		color: var(--color-primary-contrast);
		box-shadow: var(--shadow-md);
		margin-bottom: var(--space-12);
	}

	h1 {
		font-size: clamp(2.5rem, 8vw, 4rem);
		line-height: 0.95;
		margin: 0 0 var(--space-6);
	}

	.tagline {
		color: var(--color-text-muted);
		margin: 0 auto var(--space-16);
		font-size: 1.05rem;
		max-width: 28rem;
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
		margin: var(--space-10) auto 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		max-width: 40ch;
	}

	.message-card,
	.loading-card {
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
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error {
		margin-top: var(--space-8);
		color: var(--color-danger);
		font-size: 0.875rem;
	}
</style>
