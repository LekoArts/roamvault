<script lang='ts'>
	import { FolderOpen, FolderPlus } from '@lucide/svelte'
	import { uiStore } from '../stores/ui.svelte'
	import { vaultStore } from '../stores/vault.svelte'

	// 'checking' = silent IDB lookup, 'opening' = user sees spinner, 'ready' = show full UI
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

	// Try to reopen last vault on mount
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
			<div class='logo-mark'>
				<FolderPlus size={48} strokeWidth={1.5} />
			</div>

			<h1>RoamVault</h1>
			<p class='tagline'>Create travel plans in your Obsidian vault</p>

			{#if unsupported}
				<div class='unsupported'>
					<p>Your browser does not support the File System Access API.</p>
					<p>Please use <strong>Chrome</strong>, <strong>Edge</strong>, or another Chromium-based browser.</p>
				</div>
			{:else if phase === 'opening' || vaultStore.loading}
				<div class='loading'>
					<div class='spinner'></div>
					<p>Opening vault...</p>
				</div>
			{:else}
				<button class='open-vault-btn' onclick={handleOpen}>
					<FolderOpen size={20} />
					Open Vault
				</button>

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
		padding: 20px;
	}

	.vault-picker-inner {
		text-align: center;
		max-width: 400px;
	}

	.logo-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		border-radius: 20px;
		background: var(--color-primary);
		color: white;
		margin-bottom: 24px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 8px;
	}

	.tagline {
		color: var(--color-text-muted);
		margin: 0 0 32px;
		font-size: 1.0625rem;
	}

	.open-vault-btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 12px 28px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.open-vault-btn:hover {
		opacity: 0.9;
	}

	.unsupported {
		padding: 20px;
		background: var(--color-bg-hover);
		border-radius: 10px;
		color: var(--color-text-muted);
	}

	.unsupported p {
		margin: 0 0 8px;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
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

	.error {
		margin-top: 16px;
		color: var(--color-danger);
		font-size: 0.875rem;
	}
</style>
