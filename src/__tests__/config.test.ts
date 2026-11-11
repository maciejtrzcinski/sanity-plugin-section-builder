import {describe, expect, it} from 'vitest'

import {
  auditPreviewAssets,
  resolveConfig,
  resolvePreviewUrl,
  sectionsMissingPreview,
} from '../config'

describe('resolvePreviewUrl', () => {
  it('joins a bare filename to the base url', () => {
    expect(resolvePreviewUrl('hero.png', '/static/section-previews')).toBe(
      '/static/section-previews/hero.png',
    )
  })

  it('normalizes redundant slashes', () => {
    expect(resolvePreviewUrl('hero.png', '/static/section-previews/')).toBe(
      '/static/section-previews/hero.png',
    )
  })

  it('passes through absolute URLs', () => {
    expect(resolvePreviewUrl('https://cdn.example.com/hero.png', '/x')).toBe(
      'https://cdn.example.com/hero.png',
    )
  })

  it('passes through root-relative paths', () => {
    expect(resolvePreviewUrl('/img/hero.png', '/static')).toBe('/img/hero.png')
  })

  it.each([
    'data:image/png;base64,AAA',
    'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
    'blob:https://studio.example.com/123',
    '//cdn.example.com/hero.png',
    'HTTPS://CDN.EXAMPLE.COM/hero.png',
  ])('passes through %s unchanged', (url) => {
    expect(resolvePreviewUrl(url, '/static/section-previews')).toBe(url)
  })
})

describe('resolveConfig', () => {
  it('applies defaults', () => {
    const resolved = resolveConfig({sections: [{type: 'hero', previewImage: 'hero.png'}]})
    expect(resolved.previewBaseUrl).toBe('/static/section-previews')
    expect(resolved.previewHeight).toBe(320)
    expect(resolved.previewUrlByType.get('hero')).toBe('/static/section-previews/hero.png')
  })

  it('omits types without a preview from the url map', () => {
    const resolved = resolveConfig({sections: [{type: 'hero'}]})
    expect(resolved.previewUrlByType.has('hero')).toBe(false)
  })

  it('throws when both sections and detect are provided', () => {
    const both = {sections: [{type: 'hero'}], detect: {types: [{name: 'heroSection'}]}}
    // @ts-expect-error -- the config type allows `sections` or `detect`, not both
    expect(() => resolveConfig(both)).toThrowError(/not both/)
  })

  it('throws on duplicate section types', () => {
    expect(() => resolveConfig({sections: [{type: 'hero'}, {type: 'hero'}]})).toThrowError(
      /Duplicate section type/,
    )
  })
})

describe('sectionsMissingPreview', () => {
  it('returns only sections without a preview', () => {
    const missing = sectionsMissingPreview([{type: 'a', previewImage: 'a.png'}, {type: 'b'}])
    expect(missing.map((s) => s.type)).toEqual(['b'])
  })
})

describe('auditPreviewAssets', () => {
  const sections = [
    {type: 'a', previewImage: 'a.png'},
    {type: 'b', previewImage: 'missing.png'},
    {type: 'c'},
    {type: 'd', previewImage: 'https://cdn.example.com/d.png'},
  ]

  it('flags referenced filenames that do not exist on disk', () => {
    const {missing} = auditPreviewAssets(sections, ['a.png', 'orphan.png'])
    expect(missing.map((s) => s.type)).toEqual(['b'])
  })

  it('reports sections without any preview', () => {
    const {withoutPreview} = auditPreviewAssets(sections, ['a.png'])
    expect(withoutPreview.map((s) => s.type)).toEqual(['c'])
  })

  it('reports unreferenced files and ignores external URLs', () => {
    const {unused} = auditPreviewAssets(sections, ['a.png', 'orphan.png'])
    expect(unused).toEqual(['orphan.png'])
  })

  it('does not report data: or blob: previews as missing files', () => {
    const {missing} = auditPreviewAssets(
      [
        {type: 'e', previewImage: 'data:image/png;base64,AAA'},
        {type: 'f', previewImage: 'blob:https://studio.example.com/123'},
      ],
      [],
    )
    expect(missing).toEqual([])
  })
})
