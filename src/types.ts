/**
 * A single page-builder section registered with the plugin.
 */
export interface SectionDefinition {
  /** Schema `type` name of the section object (must match a registered object type). */
  type: string
  /**
   * Preview thumbnail for this section. Either:
   * - a bare filename (e.g. `hero.png`) resolved against `previewBaseUrl`, or
   * - an absolute URL / root-relative path (e.g. `https://…` or `/img/hero.png`) used as-is.
   */
  previewImage?: string
  /**
   * Optional grouping key. Lets one registry power several page-builder fields
   * (e.g. only `group === 'index'` sections on index pages). Purely consumer-defined.
   */
  group?: string
}

import type {DetectSectionsOptions, SchemaTypeLike} from './detect'

/** Auto-detection spec: the schema types to scan plus detection options. */
export type DetectConfig = DetectSectionsOptions & {
  types: ReadonlyArray<SchemaTypeLike>
}

export interface SectionBuilderConfig {
  /**
   * Explicit section registry. Provide this OR {@link SectionBuilderConfig.detect}.
   */
  sections?: readonly SectionDefinition[]
  /**
   * Auto-detect sections from schema types instead of listing them. Provide this
   * OR {@link SectionBuilderConfig.sections}.
   */
  detect?: DetectConfig
  /**
   * Base path/URL that bare-filename `previewImage` values are resolved against.
   * @default '/static/section-previews'
   */
  previewBaseUrl?: string
  /**
   * Height (px) of the rendered preview thumbnail.
   * @default 320
   */
  previewHeight?: number
}

/** Config with all defaults applied. */
export interface ResolvedSectionBuilderConfig {
  sections: readonly SectionDefinition[]
  previewBaseUrl: string
  previewHeight: number
  /** Map of section type → fully-resolved preview URL (only types that have a preview). */
  previewUrlByType: ReadonlyMap<string, string>
}

/** Predicate used to select a subset of sections for a given field. */
export type SectionFilter = (section: SectionDefinition) => boolean
