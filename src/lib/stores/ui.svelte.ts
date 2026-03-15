import type { ItemType, TripData } from '../models/types'

export type View = 'vault-picker' | 'travel-list' | 'trip-detail'

let currentView = $state<View>('vault-picker')
let selectedTrip = $state<TripData | null>(null)
let modalOpen = $state<'create-trip' | 'create-item' | null>(null)
let itemTypeToCreate = $state<ItemType | null>(null)
export const uiStore = {
	get currentView() { return currentView },
	get selectedTrip() { return selectedTrip },
	get modalOpen() { return modalOpen },
	get itemTypeToCreate() { return itemTypeToCreate },

	navigate(view: View, trip?: TripData) {
		currentView = view
		selectedTrip = trip ?? null
	},

	selectTrip(trip: TripData) {
		selectedTrip = trip
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
}
