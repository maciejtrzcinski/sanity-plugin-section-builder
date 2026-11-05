import {describe, expect, it} from 'vitest'

import {sectionField} from '../index'

const SECTIONS = {
  previewBaseUrl: '/p',
  sections: [
    {type: 'heroSection', previewImage: 'hero.png'},
    {type: 'faqSection', group: 'index'},
  ],
}

const gridView = (field: ReturnType<typeof sectionField>) => {
  const view = field.options?.insertMenu?.views?.[0]
  if (view?.name !== 'grid') throw new Error('expected a grid view')
  return view
}

describe('sectionField', () => {
  it('builds a page-builder array with a grid insert menu', () => {
    const field = sectionField(SECTIONS)
    expect(field).toMatchObject({name: 'pageBuilder', title: 'Page Builder', type: 'array'})
    expect(field.of.map((member) => member.type)).toEqual(['heroSection', 'faqSection'])
    expect(gridView(field).previewImageUrl?.('heroSection')).toBe('/p/hero.png')
    expect(gridView(field).previewImageUrl?.('faqSection')).toBeUndefined()
  })

  it('applies the filter to the array members', () => {
    const field = sectionField(SECTIONS, {filter: (s) => s.group === 'index'})
    expect(field.of.map((member) => member.type)).toEqual(['faqSection'])
  })

  it('keeps the insert-menu grid when fieldOptions sets other options', () => {
    const field = sectionField(SECTIONS, {fieldOptions: {options: {sortable: false}}})
    expect(field.options?.sortable).toBe(false)
    expect(gridView(field).previewImageUrl?.('heroSection')).toBe('/p/hero.png')
  })

  it('merges fieldOptions.options.insertMenu with the generated grid view', () => {
    const field = sectionField(SECTIONS, {
      fieldOptions: {options: {insertMenu: {filter: true, showIcons: false}}},
    })
    expect(field.options?.insertMenu).toMatchObject({filter: true, showIcons: false})
    expect(gridView(field).previewImageUrl?.('heroSection')).toBe('/p/hero.png')
  })

  it('lets fieldOptions replace the insert-menu views explicitly', () => {
    const field = sectionField(SECTIONS, {
      fieldOptions: {options: {insertMenu: {views: [{name: 'list'}]}}},
    })
    expect(field.options?.insertMenu?.views).toEqual([{name: 'list'}])
  })

  it('passes other fieldOptions through to the field', () => {
    const field = sectionField(SECTIONS, {fieldOptions: {description: 'Page sections'}})
    expect(field.description).toBe('Page sections')
  })
})
