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
})
