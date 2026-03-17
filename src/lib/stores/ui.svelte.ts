import type { ItemType, TripData } from '../models/types'

export type View = 'vault-picker' | 'travel-list' | 'trip-detail'

let currentView = $state<View>('vault-picker')
let selectedTrip = $state<TripData | null>(null)
let modalOpen = $state<'create-trip' | 'create-item' | null>(null)
let itemTypeToCreate = $state<ItemType | null>(null)
let showTripMetadata = $state(false)
export const uiStore = {
	get currentView() { return currentView },
	get selectedTrip() { return selectedTrip },
	get modalOpen() { return modalOpen },
	get itemTypeToCreate() { return itemTypeToCreate },
	get showTripMetadata() { return showTripMetadata },

	navigate(view: View, trip?: TripData) {
		currentView = view
		selectedTrip = trip ?? null
	},

	selectTrip(trip: TripData) {
		selectedTrip = trip
		showTripMetadata = false
		currentView = 'trip-detail'
	},

	openCreateTripModal() {
		modalOpen = 'create-trip'
	},

	openCreateItemModal(type: ItemType) {
		itemTypeToCreate = type
		modalOpen = 'create-item'
	},

	closeModal() {
		modalOpen = null
		itemTypeToCreate = null
	},

	updateSelectedTrip(trip: TripData) {
		selectedTrip = trip
	},

	toggleTripMetadata() {
		showTripMetadata = !showTripMetadata
	},
}
