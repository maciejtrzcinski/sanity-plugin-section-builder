import {describe, expect, it} from 'vitest'

import {resolveConfig} from '../config'
import {detectSections, toKebabCase} from '../detect'

const TYPES = [
  {name: 'heroSection', type: 'object'},
  {name: 'faqSection', type: 'object'},
  {name: 'aiAppsSection', type: 'object'},
  {name: 'quoteSectionTitled', type: 'object'}, // does not match default predicate
  {name: 'blogPost', type: 'document'}, // not a section
  {name: 'siteSettings', type: 'document'},
]

describe('toKebabCase', () => {
  it('kebab-cases camelCase names', () => {
    expect(toKebabCase('heroSection')).toBe('hero-section')
    expect(toKebabCase('aiAppsSection')).toBe('ai-apps-section')
  })
})

describe('detectSections', () => {
  it('detects types ending in Section by default', () => {
    const sections = detectSections(TYPES)
    expect(sections.map((s) => s.type)).toEqual(['heroSection', 'faqSection', 'aiAppsSection'])
  })

  it('derives preview filenames by convention', () => {
    const sections = detectSections(TYPES)
    expect(sections.find((s) => s.type === 'heroSection')?.previewImage).toBe('hero-section.png')
  })

  it('honors include for non-matching types', () => {
    const sections = detectSections(TYPES, {include: ['quoteSectionTitled']})
    expect(sections.map((s) => s.type)).toContain('quoteSectionTitled')
  })

  it('honors exclude', () => {
    const sections = detectSections(TYPES, {exclude: ['faqSection']})
    expect(sections.map((s) => s.type)).not.toContain('faqSection')
  })

  it('supports a custom predicate', () => {
    const sections = detectSections(TYPES, {isSection: (d) => d.name.startsWith('ai')})
    expect(sections.map((s) => s.type)).toEqual(['aiAppsSection'])
  })

  it('sorts by name', () => {
    const sections = detectSections(TYPES, {sort: 'name'})
    expect(sections.map((s) => s.type)).toEqual(['aiAppsSection', 'faqSection', 'heroSection'])
  })

  it('pins ordered types to the front, keeping the rest stable', () => {
    const sections = detectSections(TYPES, {order: ['faqSection']})
    expect(sections.map((s) => s.type)).toEqual(['faqSection', 'heroSection', 'aiAppsSection'])
  })

  it('combines sort then order (alphabetical rest, pinned front)', () => {
    const sections = detectSections(TYPES, {sort: 'name', order: ['heroSection']})
    expect(sections.map((s) => s.type)).toEqual(['heroSection', 'aiAppsSection', 'faqSection'])
  })

  it('applies overrides last', () => {
    const sections = detectSections(TYPES, {overrides: {heroSection: {previewImage: 'custom.png'}}})
    expect(sections.find((s) => s.type === 'heroSection')?.previewImage).toBe('custom.png')
  })

  it('maps groups', () => {
    const sections = detectSections(TYPES, {
      group: (name) => (name === 'faqSection' ? 'index' : undefined),
    })
    expect(sections.find((s) => s.type === 'faqSection')?.group).toBe('index')
    expect(sections.find((s) => s.type === 'heroSection')?.group).toBeUndefined()
  })
})

describe('resolveConfig with detect', () => {
  it('resolves sections from a detect spec', () => {
    const resolved = resolveConfig({
      previewBaseUrl: '/p',
      detect: {types: TYPES, include: ['quoteSectionTitled']},
    })
    expect(resolved.sections.map((s) => s.type)).toEqual([
      'heroSection',
      'faqSection',
      'aiAppsSection',
      'quoteSectionTitled',
    ])
    expect(resolved.previewUrlByType.get('heroSection')).toBe('/p/hero-section.png')
  })

  it('throws when neither sections nor detect is provided', () => {
    expect(() => resolveConfig({})).toThrowError(/Provide either `sections` or `detect`/)
  })
})
