<script lang='ts'>
	import type { Snippet } from 'svelte'
	import { X } from '@lucide/svelte'

	const {
		open = false,
		title = '',
		onclose,
		children,
	}: {
		open: boolean
		title?: string
		onclose: () => void
		children: Snippet
	} = $props()

	let dialogEl: HTMLDialogElement | undefined = $state()

	$effect(() => {
		if (!dialogEl)
			return
		if (open && !dialogEl.open) {
			dialogEl.showModal()
		}
		else if (!open && dialogEl.open) {
			dialogEl.close()
		}
	})

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault()
			onclose()
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			onclose()
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	onkeydown={handleKeydown}
	onclick={handleBackdropClick}
>
	<div class='modal-content'>
		<div class='modal-header'>
			<h2>{title}</h2>
			<button class='modal-close' onclick={onclose} aria-label='Close'>
				<X size={20} aria-hidden='true' />
			</button>
		</div>
		<div class='modal-body'>
			{@render children()}
		</div>
	</div>
</dialog>

<style>
	dialog {
		border: none;
		border-radius: var(--radius-lg);
		padding: 0;
		max-width: 620px;
		width: min(92vw, 620px);
		background: var(--color-bg-card-strong);
		color: var(--color-text);
		box-shadow: var(--shadow-md);
		overscroll-behavior: contain;
	}

	dialog::backdrop {
		background: var(--color-overlay);
	}

	.modal-content {
		padding: var(--space-12);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-10);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		line-height: 1;
	}

	.modal-close {
		background: transparent;
		border: 1px solid var(--color-border);
		cursor: pointer;
		color: var(--color-text-muted);
		width: 44px;
		height: 44px;
		padding: 0;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.modal-close:hover {
		background: var(--color-bg-hover);
		color: var(--color-text);
		border-color: var(--color-primary);
	}

	.modal-close:active {
		background: var(--color-bg-accent);
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
</style>
