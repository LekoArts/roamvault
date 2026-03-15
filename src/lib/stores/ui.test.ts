import type { TripData } from '../models/types'
import { describe, expect, it } from 'vitest'
import { uiStore } from './ui.svelte'

const mockTrip: TripData = {
	name: 'Test Trip',
	year: '2026',
	type: 'Travel_Simple',
	path: 'Travel/2026/Test Trip.md',
	frontmatter: {
		base: '[[Travel.base]]',
		startDate: '2026-04-01',
		endDate: '2026-04-10',
		Done: false,
	},
}

const mockTrip2: TripData = {
	name: 'Another Trip',
	year: '2026',
	type: 'Travel_Advanced',
	path: 'Travel/2026/Another Trip/Another Trip.md',
	frontmatter: {
		base: '[[Travel.base]]',
		startDate: '2026-05-01',
		endDate: '2026-05-15',
		Done: false,
	},
	planning: [],
	activities: [],
}

describe('uiStore', () => {
	it('starts with vault-picker view', () => {
		expect(uiStore.currentView).toBe('vault-picker')
	})

	it('starts with no selected trip', () => {
		expect(uiStore.selectedTrip).toBeNull()
	})

	it('starts with no modal open', () => {
		expect(uiStore.modalOpen).toBeNull()
		expect(uiStore.itemTypeToCreate).toBeNull()
	})

	describe('navigate', () => {
		it('changes view to travel-list', () => {
			uiStore.navigate('travel-list')
			expect(uiStore.currentView).toBe('travel-list')
			expect(uiStore.selectedTrip).toBeNull()
		})

		it('changes view with trip', () => {
			uiStore.navigate('trip-detail', mockTrip)
			expect(uiStore.currentView).toBe('trip-detail')
			expect(uiStore.selectedTrip).toBe(mockTrip)
		})

		it('clears trip when navigating without one', () => {
			uiStore.navigate('trip-detail', mockTrip)
			uiStore.navigate('travel-list')
			expect(uiStore.selectedTrip).toBeNull()
		})
	})

	describe('selectTrip', () => {
		it('sets selected trip and navigates to trip-detail', () => {
			uiStore.selectTrip(mockTrip)
			expect(uiStore.selectedTrip).toBe(mockTrip)
			expect(uiStore.currentView).toBe('trip-detail')
		})

		it('replaces previously selected trip', () => {
			uiStore.selectTrip(mockTrip)
			uiStore.selectTrip(mockTrip2)
			expect(uiStore.selectedTrip).toBe(mockTrip2)
		})
	})

	describe('openCreateTripModal', () => {
		it('sets modalOpen to create-trip', () => {
			uiStore.openCreateTripModal()
			expect(uiStore.modalOpen).toBe('create-trip')
		})
	})

	describe('openCreateItemModal', () => {
		it('sets modalOpen to create-item and itemTypeToCreate', () => {
			uiStore.openCreateItemModal('Activity')
			expect(uiStore.modalOpen).toBe('create-item')
			expect(uiStore.itemTypeToCreate).toBe('Activity')
		})

		it('works with Planning type', () => {
			uiStore.openCreateItemModal('Planning')
			expect(uiStore.itemTypeToCreate).toBe('Planning')
		})

		it('works with Stop type', () => {
			uiStore.openCreateItemModal('Stop')
			expect(uiStore.itemTypeToCreate).toBe('Stop')
		})
	})

	describe('closeModal', () => {
		it('clears modal state', () => {
			uiStore.openCreateItemModal('Activity')
			uiStore.closeModal()
			expect(uiStore.modalOpen).toBeNull()
			expect(uiStore.itemTypeToCreate).toBeNull()
		})
	})

	describe('updateSelectedTrip', () => {
		it('updates the selected trip without changing view', () => {
			uiStore.navigate('trip-detail', mockTrip)
			uiStore.updateSelectedTrip(mockTrip2)
			expect(uiStore.selectedTrip).toBe(mockTrip2)
			expect(uiStore.currentView).toBe('trip-detail')
		})
	})
})
