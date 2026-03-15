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
		border-radius: 12px;
		padding: 0;
		max-width: 520px;
		width: 90vw;
		background: var(--color-bg);
		color: var(--color-text);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		overscroll-behavior: contain;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	.modal-content {
		padding: 24px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.modal-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 4px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.modal-close:hover {
		background: var(--color-bg-hover);
		color: var(--color-text);
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
