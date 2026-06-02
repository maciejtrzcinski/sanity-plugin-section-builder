import type {SectionDefinition} from './types'

/** Minimal shape of a schema type definition needed for detection. */
export interface SchemaTypeLike {
  name: string
  type?: string
}

export interface DetectSectionsOptions {
  /**
   * Decides whether a schema type is a page-builder section.
   * @default (def) => def.name.endsWith('Section')
   */
  isSection?: (def: SchemaTypeLike) => boolean
  /** Force-include these type names even if `isSection` returns false. */
  include?: readonly string[]
  /** Remove these type names even if `isSection` returns true. */
  exclude?: readonly string[]
  /**
   * Maps a section type name to its preview image (filename or URL). Return
   * `undefined` for sections that have no preview yet.
   * @default (name) => `${toKebabCase(name)}.png`
   */
  previewImage?: (typeName: string) => string | undefined
  /** Maps a section type name to a `group` value (for filtered fields). */
  group?: (typeName: string) => string | undefined
  /** Per-type overrides applied last (e.g. `{heroSection: {previewImage: 'hero.png'}}`). */
  overrides?: Record<string, Partial<Omit<SectionDefinition, 'type'>>>
  /**
   * Pin specific types to the front in this exact order. Types not listed keep
   * their post-`sort` relative order. Applied after `sort`.
   */
  order?: readonly string[]
  /** Sort the detected sections: `'name'` (alphabetical) or a custom comparator. */
  sort?: 'name' | ((a: SectionDefinition, b: SectionDefinition) => number)
}

/** `heroSection` → `hero-section`, `aiAppsSection` → `ai-apps-section`. */
export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

const defaultIsSection = (def: SchemaTypeLike): boolean =>
  typeof def?.name === 'string' && def.name.endsWith('Section')

const defaultPreviewImage = (name: string): string => `${toKebabCase(name)}.png`

/**
 * Derive the section list from a studio's schema type definitions instead of a
 * hand-maintained registry. Drop in a new `*Section` schema and it's picked up
 * automatically. Use `include`/`exclude` for exceptions, `order`/`sort` to
 * control how they appear, and `overrides` for per-type tweaks.
 *
 * ```ts
 * import {schemaTypes} from './schemaTypes'
 * const sections = detectSections(schemaTypes, {
 *   include: ['quoteSectionTitled'],   // doesn't match the default predicate
 *   order: ['heroSection'],            // pin to the top
 *   sort: 'name',                      // rest alphabetical
 * })
 * ```
 */
export function detectSections(
  types: ReadonlyArray<SchemaTypeLike>,
  options: DetectSectionsOptions = {},
): SectionDefinition[] {
  const {
    isSection = defaultIsSection,
    include = [],
    exclude = [],
    previewImage = defaultPreviewImage,
    group,
    overrides = {},
    order,
    sort,
  } = options

  const excludeSet = new Set(exclude)
  const includeSet = new Set(include)

  const names: string[] = []
  const seen = new Set<string>()
  for (const def of types) {
    if (!def || typeof def.name !== 'string' || seen.has(def.name)) continue
    if (excludeSet.has(def.name)) continue
    if (isSection(def) || includeSet.has(def.name)) {
      names.push(def.name)
      seen.add(def.name)
    }
  }

  let sections: SectionDefinition[] = names.map((name) => {
    const section: SectionDefinition = {type: name}
    const image = previewImage(name)
    if (image !== undefined) section.previewImage = image
    const groupValue = group?.(name)
    if (groupValue !== undefined) section.group = groupValue
    const override = overrides[name]
    return override ? {...section, ...override} : section
  })

  if (sort === 'name') {
    sections.sort((a, b) => a.type.localeCompare(b.type))
  } else if (typeof sort === 'function') {
    sections.sort(sort)
  }

  if (order && order.length > 0) {
    const rank = new Map(order.map((type, index) => [type, index] as const))
    const rankOf = (type: string) =>
      rank.has(type) ? (rank.get(type) as number) : Number.MAX_SAFE_INTEGER
    // Array.prototype.sort is stable, so equal ranks keep their prior order.
    sections.sort((a, b) => rankOf(a.type) - rankOf(b.type))
  }

  return sections
}
