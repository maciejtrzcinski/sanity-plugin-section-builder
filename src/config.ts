import {detectSections} from './detect'
import type {ResolvedSectionBuilderConfig, SectionBuilderConfig, SectionDefinition} from './types'

const DEFAULT_PREVIEW_BASE_URL = '/static/section-previews'
const DEFAULT_PREVIEW_HEIGHT = 320

const ABSOLUTE_URL = /^(https?:)?\/\//i

/**
 * Resolve a `previewImage` value to a URL.
 * Absolute URLs and root-relative paths are returned unchanged; bare filenames
 * are joined to `baseUrl`.
 */
export function resolvePreviewUrl(previewImage: string, baseUrl: string): string {
  if (ABSOLUTE_URL.test(previewImage) || previewImage.startsWith('/')) {
    return previewImage
  }
  const base = baseUrl.replace(/\/+$/, '')
  return `${base}/${previewImage.replace(/^\/+/, '')}`
}

/**
 * Apply defaults and validate the config. Throws on duplicate section types so a
 * copy-paste mistake in the registry fails loudly instead of silently shadowing.
 */
export function resolveConfig(config: SectionBuilderConfig): ResolvedSectionBuilderConfig {
  const previewBaseUrl = config.previewBaseUrl ?? DEFAULT_PREVIEW_BASE_URL
  const previewHeight = config.previewHeight ?? DEFAULT_PREVIEW_HEIGHT

  const sections =
    config.sections ?? (config.detect ? detectSections(config.detect.types, config.detect) : null)
  if (!sections) {
    throw new Error(
      '[sanity-plugin-section-builder] Provide either `sections` or `detect` in the config.',
    )
  }

  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const section of sections) {
    if (seen.has(section.type)) duplicates.add(section.type)
    seen.add(section.type)
  }
  if (duplicates.size > 0) {
    throw new Error(
      `[sanity-plugin-section-builder] Duplicate section type(s) in registry: ${[...duplicates].join(', ')}`,
    )
  }

  const previewUrlByType = new Map<string, string>()
  for (const section of sections) {
    if (section.previewImage) {
      previewUrlByType.set(section.type, resolvePreviewUrl(section.previewImage, previewBaseUrl))
    }
  }

  return {
    sections,
    previewBaseUrl,
    previewHeight,
    previewUrlByType,
  }
}

/** Section types that currently have no preview image — useful for an audit/test. */
export function sectionsMissingPreview(
  sections: readonly SectionDefinition[],
): SectionDefinition[] {
  return sections.filter((section) => !section.previewImage)
}

export interface AssetAuditResult {
  /** Sections whose bare-filename `previewImage` is not in `existingFiles`. */
  missing: SectionDefinition[]
  /** Sections with no `previewImage` at all. */
  withoutPreview: SectionDefinition[]
  /** Files in `existingFiles` not referenced by any section (possible dead assets). */
  unused: string[]
}

/**
 * Pure audit of preview coverage — the guard the in-Studio plugin can't provide
 * (the browser has no filesystem). Pass it the list of files that actually exist
 * (e.g. `readdirSync('static/section-previews')`) and assert on the result in a
 * test or CI step. Only bare filenames are checked; absolute URLs / root-relative
 * paths are assumed external and skipped.
 *
 * ```ts
 * import {readdirSync} from 'node:fs'
 * import {auditPreviewAssets} from 'sanity-plugin-section-builder'
 *
 * const {missing} = auditPreviewAssets(SECTIONS.sections, readdirSync('static/section-previews'))
 * expect(missing).toEqual([])
 * ```
 */
export function auditPreviewAssets(
  sections: readonly SectionDefinition[],
  existingFiles: Iterable<string>,
): AssetAuditResult {
  const existing = new Set(existingFiles)
  const referenced = new Set<string>()
  const missing: SectionDefinition[] = []
  const withoutPreview: SectionDefinition[] = []

  for (const section of sections) {
    if (!section.previewImage) {
      withoutPreview.push(section)
      continue
    }
    if (ABSOLUTE_URL.test(section.previewImage) || section.previewImage.startsWith('/')) {
      continue
    }
    referenced.add(section.previewImage)
    if (!existing.has(section.previewImage)) {
      missing.push(section)
    }
  }

  const unused = [...existing].filter((file) => !referenced.has(file))

  return {missing, withoutPreview, unused}
}
