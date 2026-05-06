import { describe, expect, it } from 'vitest'
import type { WPFormField } from '~/types/wordpress'
import { getPrefilledClientFormValues, validateClientFormValues } from '../clientForm'

describe('getPrefilledClientFormValues', () => {
  it('reads matching query params when form_id matches the current form', () => {
    const fields: WPFormField[] = [
      {
        field_id: 'package_choice',
        label: 'Package choice',
        type: 'select',
        options: [
          { label: 'Short & Sweet', value: 'short_and_sweet' },
          { label: 'Full Day', value: 'full_day' },
        ],
      },
    ]

    expect(
      getPrefilledClientFormValues(
        fields,
        '?form_id=lgbt-wedding-enquiry&package_choice=short_and_sweet',
        'lgbt-wedding-enquiry',
      ),
    ).toEqual({
      package_choice: 'short_and_sweet',
    })
  })

  it('ignores query params meant for a different form', () => {
    const fields: WPFormField[] = [
      {
        field_id: 'package_choice',
        label: 'Package choice',
        type: 'select',
        options: [
          { label: 'Short & Sweet', value: 'short_and_sweet' },
          { label: 'Full Day', value: 'full_day' },
        ],
      },
    ]

    expect(
      getPrefilledClientFormValues(
        fields,
        '?form_id=other-form&package_choice=short_and_sweet',
        'lgbt-wedding-enquiry',
      ),
    ).toEqual({})
  })

  it('matches select and radio options by trimmed value to tolerate accidental whitespace in WordPress values', () => {
    const fields: WPFormField[] = [
      {
        field_id: 'package_choice',
        label: 'Package choice',
        type: 'select',
        options: [
          { label: 'Short & Sweet', value: ' short_and_sweet ' },
          { label: 'Full Day', value: 'full_day' },
        ],
      },
    ]

    expect(
      getPrefilledClientFormValues(
        fields,
        '?form_id=lgbt-wedding-form&package_choice=short_and_sweet',
        'lgbt-wedding-form',
      ),
    ).toEqual({
      package_choice: ' short_and_sweet ',
    })
  })
})

describe('validateClientFormValues', () => {
  it('treats the reserved Name field as required even when the required flag is false', () => {
    const fields: WPFormField[] = [
      {
        field_id: 'name',
        label: 'Name',
        type: 'text',
        required: false,
        vsco_field_key: 'FirstName',
      },
      {
        field_id: 'email',
        label: 'Email',
        type: 'email',
        required: false,
      },
    ]

    expect(validateClientFormValues(fields, { name: '', email: '' })).toEqual({
      name: 'Name is required.',
    })
  })

  it('accepts optional non-reserved fields when they are blank', () => {
    const fields: WPFormField[] = [
      {
        field_id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        vsco_field_key: 'FirstName',
      },
      {
        field_id: 'phone',
        label: 'Phone',
        type: 'tel',
        required: false,
      },
    ]

    expect(validateClientFormValues(fields, { name: 'Mitchell', phone: '' })).toEqual({})
  })
})