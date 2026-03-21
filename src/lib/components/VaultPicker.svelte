<script lang='ts'>
	import { FolderOpen, FolderPlus } from '@lucide/svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'

	let phase = $state<'checking' | 'opening' | 'ready'>('checking')
	const unsupported = !('showDirectoryPicker' in window)

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
				<FolderPlus size={46} strokeWidth={1.5} aria-hidden='true' />
			</div>

			<h1>RoamVault</h1>
			<p class='tagline'>A calmer workspace for trips, itineraries, and notes stored directly in Obsidian.</p>

			{#if unsupported}
				<div class='message-card unsupported'>
					<p>Your browser does not support the File System Access API.</p>
					<p>Please use <strong>Chrome</strong>, <strong>Edge</strong>, or another Chromium-based browser.</p>
				</div>
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

				<p class='supporting-copy'>Reconnect to your existing travel vault or choose a fresh one to start planning.</p>

				{#if vaultStore.error}
					<p class='error'>{vaultStore.error}</p>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	.vault-picker {
		display: flex;
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
		width: 88px;
		height: 88px;
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

	.supporting-copy {
		margin: var(--space-10) 0 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
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
