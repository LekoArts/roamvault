<script lang='ts'>
	import CreateItemForm from './lib/components/CreateItemForm.svelte'
	import CreateTripForm from './lib/components/CreateTripForm.svelte'
	import TravelList from './lib/components/TravelList.svelte'
	import TripDetail from './lib/components/TripDetail.svelte'
	import VaultPicker from './lib/components/VaultPicker.svelte'
	import { uiStore } from './lib/stores/ui.svelte'
</script>

{#if uiStore.currentView === 'vault-picker'}
	<VaultPicker />
{:else if uiStore.currentView === 'travel-list'}
	<TravelList />
{:else if uiStore.currentView === 'trip-detail'}
	<TripDetail />
{/if}

{#if uiStore.modalOpen === 'create-trip'}
	<CreateTripForm />
{:else if uiStore.modalOpen === 'create-item'}
	<CreateItemForm />
{/if}
