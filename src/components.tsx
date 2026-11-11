import {createElement} from 'react'
import type {PreviewProps} from 'sanity'

/**
 * Preview layouts where a full-width thumbnail doesn't fit: `compact` (document
 * list rows, search results) and the Portable Text layouts (`block`,
 * `blockImage`, `inline`). Array items use `default` (list) or `media` (grid).
 */
const LAYOUTS_WITHOUT_THUMBNAIL: ReadonlySet<string> = new Set([
  'compact',
  'block',
  'blockImage',
  'inline',
])

/**
 * Renders the section thumbnail image. Hides itself if the image fails to load,
 * so convention-derived URLs (auto-detect mode) that 404 degrade gracefully
 * instead of showing a broken-image icon.
 */
export function SectionPreviewImage(props: {src: string; height: number}): React.ReactElement {
  return createElement('img', {
    src: props.src,
    alt: '',
    // A page can hold many sections; only fetch thumbnails as they scroll into view.
    loading: 'lazy',
    decoding: 'async',
    onError: (event: {currentTarget: HTMLImageElement}) => {
      event.currentTarget.style.display = 'none'
    },
    style: {
      width: '100%',
      height: props.height,
      objectFit: 'contain',
      borderRadius: 4,
      display: 'block',
    },
  })
}

/**
 * Wraps a section's default preview with a thumbnail above it. Used both as the
 * global preview resolver (auto-wired by the plugin) and exportable for manual
 * per-type wiring via `components: {preview}`.
 */
export function makeSectionItemPreview(
  previewUrlByType: ReadonlyMap<string, string>,
  height: number,
) {
  return function SectionItemPreview(props: PreviewProps): React.ReactElement {
    // `schemaType` is present on object/array-item previews.
    const typeName = (props as {schemaType?: {name?: string}}).schemaType?.name
    const src = typeName ? previewUrlByType.get(typeName) : undefined

    if (!src || (props.layout && LAYOUTS_WITHOUT_THUMBNAIL.has(props.layout))) {
      return props.renderDefault(props) as React.ReactElement
    }

    return createElement(
      'div',
      {style: {display: 'flex', flexDirection: 'column', gap: 8}},
      createElement(SectionPreviewImage, {src, height}),
      createElement('div', null, props.renderDefault(props)),
    )
  }
}
