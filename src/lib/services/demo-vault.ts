/**
 * In-memory filesystem that implements the same interface as the vault service,
 * backed by a plain Map<path, content>. Seeded from fixture data on creation.
 * All writes stay in memory and are lost on reload.
 */

// ---------- seed data (mirrors fixtures/Vault) ----------

const SEED_FILES: Record<string, string> = {
	'_templates/Activity.md': `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[TODO]]"
Location:
Done: false
---`,

	'_templates/Planning.md': `---
base: "[[_templates/Bases/Planning.base]]"
backlink: "[[TODO]]"
startDate: "{{date}}"
endDate: "{{date}}"
Activities:
---`,

	'_templates/Stop.md': `---
base: "[[_templates/Bases/Roadtrip.base]]"
backlink: "[[TODO]]"
startDate: "{{date}}"
endDate: "{{date}}"
---

## Location

**Name**

Address
Check-in / Check-out: 3 PM / 11 AM
Other: TBD

## Activities

TBD`,

	'_templates/Travel_Advanced.md': `---
base: "[[Travel.base]]"
banner:
startDate: "{{date}}"
endDate: "{{date}}"
Persons: []
Done: false
---

## Shortcuts

> [!info]- Flights
> **Booking Reference:**
>
> **Outbound**
>
> {{date:DD.MM.YYYY}}
> LH123
> FRA 12:00 - ICN 09:55 +1 (11h 25min)
>
> **Return**
>
> {{date:DD.MM.YYYY}}
> LH123
> ICN 12:10 - FRA 18:15 (13h)

> [!info]- Accommodation
>
> **Location ({{date:DD.MM.YYYY}} - {{date:DD.MM.YYYY}})**
>
> | Name                 | Hotel Name   |
> | -------------------- | ------------ |
> | Check-in / Check-out | 3 PM / 11 AM |
> | URL                  | URL          |

> [!tip]+ Good to know
> Contents

## Itinerary

![[Planning.base]]

## Activities

![[Activities.base]]

## Cost Breakdown

| Name | Price |
| ---- | ----- |
|      |       |

## Research

- TBD`,

	'_templates/Travel_Roadtrip.md': `---
base: "[[Travel.base]]"
banner:
startDate: "{{date}}"
endDate: "{{date}}"
Persons: []
Done: false
---

## Shortcuts

> [!info]- Flights
> **Booking Reference:**
>
> **Outbound**
>
> "{{date}}"
> LH123
> FRA 12:00 - ICN 09:55 +1 (11h 25min)
>
> **Return**
>
> "{{date}}"
> LH123
> ICN 12:10 - FRA 18:15 (13h)

> [!tip]+ Good to know
> Contents

## Itinerary

![[Roadtrip.base]]

## Activities

- [ ] TBD

## Cost Breakdown

| Name | Price |
| ---- | ----- |
|      |       |

## Research

- TBD`,

	'_templates/Travel_Simple.md': `---
base: "[[Travel.base]]"
banner:
startDate: "{{date}}"
endDate: "{{date}}"
Persons: []
Done: false
---

## Shortcuts

> [!info]- Flights
> **Booking Reference:**
>
> **Outbound**
>
> "{{date}}"
> LH123
> FRA 12:00 - ICN 09:55 +1 (11h 25min)
>
> **Return**
>
> "{{date}}"
> LH123
> ICN 12:10 - FRA 18:15 (13h)

> [!info]- Accommodation
>
> **Location ("{{date}}" - "{{date}}")**
>
> | Name                 | Hotel Name   |
> | -------------------- | ------------ |
> | Address              | Address      |
> | Check-in / Check-out | 3 PM / 11 AM |
> | URL                  | URL          |

> [!tip]+ Good to know
> Contents

## Activities

- [ ] TBD

## Cost Breakdown

| Name | Price |
| ---- | ----- |
|      |       |

## Research

- TBD`,

	'Travel/2025/San Francisco.md': `---
base: "[[Travel.base]]"
banner: https://images.unsplash.com/photo-1620260344104-0e36b7cd8d3e?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
startDate: 2026-02-06
endDate: 2026-02-10
Persons: []
Done: false
---

## Shortcuts

> [!info]- Flights
> **Booking Reference:** TBD
>
> **Outbound**
>
> TBD
> TBD
> FRA TBD - SFO TBD
>
> **Return**
>
> TBD
> TBD
> SFO TBD - FRA TBD (+1)

> [!info]- Accommodation
>
> **San Francisco**
>
> | Name                 | Hotel        |
> | -------------------- | ------------ |
> | Check-in / Check-out | 3 PM / 11 AM |

> [!tip]+ Good to know
>
> - BART train has direct access to Hotel

## Activities

- [ ] Get food`,

	'Travel/2026/London.md': `---
base: "[[Travel.base]]"
banner: https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
startDate: 2026-08-20
endDate: 2026-08-24
Persons: []
Done: false
---

## Shortcuts

TODO

## Activities

- [ ] TBD

## Cost Breakdown

| Name | Price |
| ---- | ----- |
|      |       |

## Research

- TBD`,

	'Travel/2026/Albania Roadtrip/Albania Roadtrip.md': `---
base: "[[Travel.base]]"
banner: https://images.unsplash.com/photo-1623167428954-be47340e0812?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
startDate: 2026-10-17
endDate: 2026-10-25
Persons:
  - PersonA
  - PersonB
Done: false
---

## Shortcuts

TODO

## Itinerary

![[Roadtrip.base]]

## Activities

- [ ] TBD

## Cost Breakdown

TODO

## Research

TODO`,

	'Travel/2026/Albania Roadtrip/Roadtrip/Arrival.md': `---
base: "[[_templates/Bases/Roadtrip.base]]"
backlink: "[[Albania Roadtrip]]"
startDate: 2026-10-17
endDate: 2026-10-17
---

## Location

TODO

## Activities

TODO`,

	'Travel/2026/Singapur & South Korea/Singapur & South Korea.md': `---
base: "[[Travel.base]]"
banner: https://images.unsplash.com/photo-1595185515922-9b79af1ef52d?q=80&w=3272&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
startDate: 2026-06-01
endDate: 2026-06-29
Persons: []
Done: false
---

## Shortcuts

TODO

## Itinerary

![[Planning.base]]

## Activities

![[Activities.base]]

## Research

TODO`,

	'Travel/2026/Singapur & South Korea/Activities/Seoul - Photos.md': `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[Singapur & South Korea]]"
Location: Seoul
Done: false
---

TODO`,

	'Travel/2026/Singapur & South Korea/Activities/Singapur - Photos.md': `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[Singapur & South Korea]]"
Location: Singapur
Done: false
---

TODO`,

	'Travel/2026/Singapur & South Korea/Planning/Arrival.md': `---
base: "[[_templates/Bases/Planning.base]]"
backlink: "[[Singapur & South Korea]]"
startDate: 2026-06-01
endDate: 2026-06-01
Activities:
---

## 01.06.2026

### Activities
`,

	'Travel/2026/Singapur & South Korea/Planning/Singapur.md': `---
base: "[[_templates/Bases/Planning.base]]"
backlink: "[[Singapur & South Korea]]"
startDate: 2026-06-02
endDate: 2026-06-02
Activities:
  - "[[Singapur - Photos]]"
---

## 02.06.2026

### Activities
- [[Singapur - Photos]]
`,

	'Travel/2026/Singapur & South Korea/Planning/Seoul.md': `---
base: "[[_templates/Bases/Planning.base]]"
backlink: "[[Singapur & South Korea]]"
startDate: 2026-06-03
endDate: 2026-06-04
Activities:
  - "[[Seoul - Photos]]"
  - "[[Seoul Tower]]"
---

## 03.06.2026

### Activities
- [[Seoul - Photos]]

## 04.06.2026

### Activities
- [[Seoul Tower]]`,

	'Travel/2026/Singapur & South Korea/Activities/Seoul Tower.md': `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[Singapur & South Korea]]"
Location: Seoul
Done: false
---

TODO`,

	'Travel/2026/Singapur & South Korea/Activities/Seoul Sky.md': `---
base: "[[_templates/Bases/Activities.base]]"
backlink: "[[Singapur & South Korea]]"
Location: Seoul
Done: false
---

TODO`,
}

// ---------- in-memory filesystem ----------

export interface MemoryFS {
	files: Map<string, string>
}

export function createDemoVault(): MemoryFS {
	const files = new Map<string, string>()
	for (const [path, content] of Object.entries(SEED_FILES)) {
		files.set(path, content)
	}
	return { files }
}

/** List immediate children of a directory path */
export function memListDirectory(fs: MemoryFS, path: string): { name: string, kind: 'file' | 'directory', path: string }[] {
	const prefix = path ? `${path}/` : ''
	const seen = new Set<string>()
	const entries: { name: string, kind: 'file' | 'directory', path: string }[] = []

	for (const filePath of fs.files.keys()) {
		if (!filePath.startsWith(prefix))
			continue

		const rest = filePath.slice(prefix.length)
		const slashIdx = rest.indexOf('/')
		const name = slashIdx === -1 ? rest : rest.slice(0, slashIdx)
		const kind = slashIdx === -1 ? 'file' as const : 'directory' as const
		const entryPath = prefix + name

		if (seen.has(entryPath))
			continue
		seen.add(entryPath)

		entries.push({ name, kind, path: entryPath })
	}

	return entries
}

export function memReadFile(fs: MemoryFS, path: string): string {
	const content = fs.files.get(path)
	if (content === undefined)
		throw new Error(`File not found: ${path}`)
	return content
}

export function memWriteFile(fs: MemoryFS, path: string, content: string): void {
	fs.files.set(path, content)
}

export function memFileExists(fs: MemoryFS, path: string): boolean {
	return fs.files.has(path)
}

export function memDirectoryExists(fs: MemoryFS, name: string): boolean {
	const prefix = `${name}/`
	for (const key of fs.files.keys()) {
		if (key.startsWith(prefix))
			return true
	}
	return false
}
