import { describe, expect, it } from 'vitest'
import type { WPFormField } from '~/types/wordpress'
import {
  getPrefilledClientFormValues,
  parseFormPrefillHash,
  validateClientFormValues,
} from '../clientForm'

describe('getPrefilledClientFormValues', () => {
  const personalFields: WPFormField[] = [
    { field_id: 'name', label: 'Name', type: 'text', required: true },
    { field_id: 'email', label: 'Email', type: 'email' },
    { field_id: 'phone', label: 'Phone', type: 'tel' },
    { field_id: 'comments', label: 'Comments', type: 'textarea' },
    { field_id: 'event_date', label: 'Date', type: 'date' },
    { field_id: 'attendees', label: 'Attendees', type: 'number' },
    {
      field_id: 'service',
      label: 'Service',
      type: 'select',
      options: [{ value: 'wedding', label: 'Wedding' }],
    },
    {
      field_id: 'interests',
      label: 'Interests',
      type: 'checkbox',
      options: [
        { value: 'photos', label: 'Photos' },
        { value: 'album', label: 'Album' },
      ],
    },
  ]

  it('round-trips personal details, choices, numbers and repeated selections from a fragment', () => {
    const values = {
      name: 'Zoë & Alex',
      email: 'zoe+events@example.com',
      phone: '+61 412 345 678',
      comments: 'First line: café & flowers\nSecond line: #wedding? yes = please',
      event_date: '2027-11-14',
      attendees: '0',
      service: 'wedding',
    }
    const params = new URLSearchParams(values)
    params.append('interests', 'photos')
    params.append('interests', 'album')
    expect(
      getPrefilledClientFormValues(
        personalFields,
        '',
        'contact-enquiry',
        `#contact-enquiry?${params}`,
      ),
    ).toEqual({ ...values, interests: ['photos', 'album'] })
  })

  it('fills only the exact form named in the fragment and ignores conflicting query data', () => {
    expect(
      getPrefilledClientFormValues(
        personalFields,
        '?name=Query',
        'contact-enquiry',
        '#contact-enquiry?name=Fragment',
      ),
    ).toEqual({ name: 'Fragment' })
    expect(
      getPrefilledClientFormValues(
        personalFields,
        '?name=Query',
        'other-form',
        '#contact-enquiry?name=Fragment',
      ),
    ).toEqual({})
  })

  it('ignores unknown fields, invalid choices and control parameters', () => {
    expect(
      getPrefilledClientFormValues(
        personalFields,
        '',
        'contact-enquiry',
        '#contact-enquiry?name=Alex&service=invalid&interests=invalid&website=spam&submit=true&requestSubmitterCopy=true',
      ),
    ).toEqual({ name: 'Alex' })
  })

  it('handles plain anchors, encoded form identifiers and malformed fragment identifiers', () => {
    expect(parseFormPrefillHash('#contact-enquiry')).toBeNull()
    expect(parseFormPrefillHash('#%zz?name=Alex')).toBeNull()
    expect(parseFormPrefillHash('#contact%20enquiry?name=Alex')).toEqual({
      formId: 'contact enquiry',
      search: 'name=Alex',
    })
    expect(
      getPrefilledClientFormValues(personalFields, '', 'contact-enquiry', '#%zz?name=Alex'),
    ).toEqual({})
  })

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

  it('matches form_id and field ids when URL uses different hyphen/underscore casing conventions', () => {
    const fields: WPFormField[] = [
      {
        field_id: 'package_choice',
        label: 'Package choice',
        type: 'select',
        options: [
          { label: 'The Prince', value: 'the_prince' },
          { label: 'Short & Sweet', value: 'short_and_sweet' },
        ],
      },
    ]

    expect(
      getPrefilledClientFormValues(
        fields,
        '?FORM-ID=LGBT_WEDDING_FORM&package-choice=THE-PRINCE',
        'lgbt-wedding-form',
      ),
    ).toEqual({
      package_choice: 'the_prince',
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
