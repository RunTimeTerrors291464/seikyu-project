/**
 * Builds an ILIKE pattern for invoice / product text search:
 * - `*suffix` → value ends with `suffix` (case-insensitive), e.g. `*001` matches `…001`
 * - `prefix*` → value starts with `prefix`, e.g. `S26*` matches `S26-…`
 * - otherwise → substring contains (same as `%keyword%`)
 *
 * Metacharacters `%`, `_`, and `\` in the user literal are escaped; use with {@link WILDCARD_ILIKE_ESCAPE_SQL}.
 */
export function buildWildcardIlikePattern(rawSearch: string): string {
    const t = rawSearch.trim();
    const escapeLiteral = (s: string): string =>
        s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

    if (t.startsWith('*') && t.length > 1) {
        return `%${escapeLiteral(t.slice(1))}`;
    }
    if (t.endsWith('*') && t.length > 1) {
        return `${escapeLiteral(t.slice(0, -1))}%`;
    }
    return `%${escapeLiteral(t)}%`;
}

/** Append to ILIKE … conditions when binding {@link buildWildcardIlikePattern}. */
export const WILDCARD_ILIKE_ESCAPE_SQL = " ESCAPE '\\'";

/**
 * When false, caller should use ILIKE + {@link buildWildcardIlikePattern} on a text column instead of
 * `@@ plainto_tsquery` (prefix/suffix `*` wildcards are not expressible as plain FTS queries).
 */
export function userFullNameSearchSupportsFts(rawSearch: string): boolean {
    const t = rawSearch.trim();
    if (t.startsWith('*') && t.length > 1) {
        return false;
    }
    if (t.endsWith('*') && t.length > 1) {
        return false;
    }
    return true;
}

/**
 * Same wildcard rules as {@link buildWildcardIlikePattern}, for in-memory string checks (e.g. cached lists).
 * Case-insensitive on haystack and on the literal parts of {@link rawSearch}.
 */
export function textMatchesWildcardSearch(haystack: string | null | undefined, rawSearch: string): boolean {
    if (haystack == null || haystack === '') {
        return false;
    }
    const t = rawSearch.trim();
    const h = haystack.toLowerCase();
    if (t.startsWith('*') && t.length > 1) {
        return h.endsWith(t.slice(1).toLowerCase());
    }
    if (t.endsWith('*') && t.length > 1) {
        return h.startsWith(t.slice(0, -1).toLowerCase());
    }
    return h.includes(t.toLowerCase());
}
