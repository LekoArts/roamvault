const WIKI_LINK_RE = /^\[\[|\]\]$/g

/** Remove `[[` and `]]` wrapper from an Obsidian wiki-link string. */
export function stripWikiLink(link: string): string {
	return link.replace(WIKI_LINK_RE, '')
}
