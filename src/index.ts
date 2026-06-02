import {defineArrayMember, defineField, definePlugin} from 'sanity'
import type {ArrayDefinition, ArrayOfType} from 'sanity'

import {makeSectionItemPreview} from './components'
import {resolveConfig} from './config'
import type {SectionBuilderConfig, SectionFilter} from './types'

export type {
  SectionBuilderConfig,
  SectionDefinition,
  SectionFilter,
  ResolvedSectionBuilderConfig,
  DetectConfig,
} from './types'
export {resolvePreviewUrl, sectionsMissingPreview, auditPreviewAssets} from './config'
export type {AssetAuditResult} from './config'
export {detectSections, toKebabCase} from './detect'
export type {DetectSectionsOptions, SchemaTypeLike} from './detect'
export {SectionPreviewImage, makeSectionItemPreview} from './components'

/**
 * Studio plugin: globally attaches a thumbnail preview to every registered
 * section type. Add the result to your `plugins` array.
 *
 * ```ts
 * import {sectionBuilder} from 'sanity-plugin-section-builder'
 * export const SECTIONS = {sections: SECTION_REGISTRY, previewBaseUrl: '/static/section-previews'}
 *
 * export default defineConfig({
 *   plugins: [sectionBuilder(SECTIONS)],
 * })
 * ```
 *
 * Because the preview is resolved globally (keyed by schema type name), you no
 * longer need `components: {preview: …}` on each section schema.
 */
export const sectionBuilder = definePlugin<SectionBuilderConfig>((config) => {
  const resolved = resolveConfig(config)
  const SectionItemPreview = makeSectionItemPreview(
    resolved.previewUrlByType,
    resolved.previewHeight,
  )

  return {
    name: 'sanity-plugin-section-builder',
    form: {
      components: {
        preview: SectionItemPreview,
      },
    },
  }
})

export interface SectionFieldOptions {
  /** Field name. @default 'pageBuilder' */
  name?: string
  /** Field title. @default 'Page Builder' */
  title?: string
  /** Fieldset/group the field belongs to. */
  group?: string
  /** Restrict which sections are offered (e.g. `s => s.group === 'index'`). */
  filter?: SectionFilter
  /** Additional options merged into the resulting `defineField` call. */
  fieldOptions?: Partial<ArrayDefinition>
}

/**
 * Build the array of `defineArrayMember` configs for a page-builder field,
 * optionally filtered to a subset of the registry.
 */
export function sectionArrayMembers(
  config: SectionBuilderConfig,
  filter?: SectionFilter,
): ArrayOfType[] {
  const {sections} = resolveConfig(config)
  const selected = filter ? sections.filter(filter) : sections
  return selected.map((section) => defineArrayMember({type: section.type}))
}

/**
 * Build a page-builder array field with the insert-menu grid wired to the
 * registry's preview images. Pass the same config you gave `sectionBuilder()`.
 *
 * ```ts
 * defineType({
 *   name: 'page',
 *   fields: [sectionField(SECTIONS, {group: 'content'})],
 * })
 * ```
 */
export function sectionField(config: SectionBuilderConfig, options: SectionFieldOptions = {}) {
  const resolved = resolveConfig(config)
  const {name = 'pageBuilder', title = 'Page Builder', group, filter, fieldOptions = {}} = options

  return defineField({
    name,
    title,
    type: 'array',
    group,
    of: sectionArrayMembers(config, filter),
    options: {
      insertMenu: {
        views: [
          {
            name: 'grid',
            previewImageUrl: (schemaTypeName: string) =>
              resolved.previewUrlByType.get(schemaTypeName),
          },
        ],
      },
    },
    ...fieldOptions,
  })
}
