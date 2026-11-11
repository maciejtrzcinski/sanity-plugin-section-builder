import {createElement, type ReactElement} from 'react'
import type {PreviewProps} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {makeSectionItemPreview, SectionPreviewImage} from '../components'

const Preview = makeSectionItemPreview(new Map([['heroSection', '/p/hero.png']]), 200)

// The preview component uses no hooks, so it can be called directly and its
// returned element tree inspected without a DOM.
function renderPreview(typeName: string, layout?: PreviewProps['layout']) {
  const defaultPreview = createElement('span', null, 'default preview')
  const renderDefault = vi.fn(() => defaultPreview)
  const props = {schemaType: {name: typeName}, layout, renderDefault} as unknown as PreviewProps
  return {element: Preview(props), defaultPreview, renderDefault}
}

type Children = {children: ReactElement[]}

describe('makeSectionItemPreview', () => {
  it.each([undefined, 'default', 'media', 'detail'] as const)(
    'renders the thumbnail above the default preview in %s layout',
    (layout) => {
      const {element, defaultPreview} = renderPreview('heroSection', layout)
      const [thumbnail, body] = (element.props as Children).children

      expect(element.type).toBe('div')
      expect(thumbnail.type).toBe(SectionPreviewImage)
      expect(thumbnail.props).toEqual({src: '/p/hero.png', height: 200})
      expect((body.props as {children: unknown}).children).toBe(defaultPreview)
    },
  )

  it.each(['compact', 'block', 'blockImage', 'inline'] as const)(
    'renders only the default preview in %s layout',
    (layout) => {
      const {element, defaultPreview} = renderPreview('heroSection', layout)
      expect(element).toBe(defaultPreview)
    },
  )

  it('renders only the default preview for types without a thumbnail', () => {
    const {element, defaultPreview} = renderPreview('faqSection')
    expect(element).toBe(defaultPreview)
  })
})

describe('SectionPreviewImage', () => {
  it('lazy-loads the image', () => {
    const element = SectionPreviewImage({src: '/p/hero.png', height: 200})
    expect(element.type).toBe('img')
    expect(element.props).toMatchObject({src: '/p/hero.png', loading: 'lazy', decoding: 'async'})
  })
})
