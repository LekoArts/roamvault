export type TripType = 'Travel_Simple' | 'Travel_Advanced' | 'Travel_Roadtrip'

export type ItemType = 'Activity' | 'Planning' | 'Stop'

export interface SubItem {
	name: string
	path: string
	frontmatter: Record<string, unknown>
}

export interface TripData {
	name: string
	year: string
	type: TripType
	path: string
	frontmatter: Record<string, unknown>
	activities?: SubItem[]
	planning?: SubItem[]
	stops?: SubItem[]
}

export interface TemplateDefinition {
	type: string
	content: string
	frontmatter: Record<string, unknown>
}

export type TravelTree = Record<string, TripData[]>
