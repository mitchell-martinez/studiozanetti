import { describe, expect, it } from 'vitest'
import type { WPFormField } from '~/types/wordpress'
import { validateClientFormValues } from '../clientForm'

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