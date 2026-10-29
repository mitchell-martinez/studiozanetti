import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect } from '@playwright/test'

const css = readFileSync(resolve('wordpress/mu-plugins/assets/gallery-library-admin.css'), 'utf8')
const script = readFileSync(resolve('wordpress/mu-plugins/assets/gallery-library-admin.js'), 'utf8')
const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#a5c9b8"/></svg>')}`

// ACF's existing sizing rules are deliberately included after our stylesheet in
// one case. The native column percentages must not apply inside each grid cell.
const nativeCss = `
  .acf-gallery { height:400px; position:relative; border:1px solid #ccd0d4; }
  .acf-gallery .acf-gallery-main { position:absolute; inset:0; }
  .acf-gallery .acf-gallery-attachments { position:absolute; inset:0 0 48px; padding:5px; overflow:auto; }
  .acf-gallery .acf-gallery-attachment { width:25%; float:left; position:relative; }
  ${Array.from({ length: 8 }, (_, index) => `.acf-gallery[data-columns="${index + 1}"] .acf-gallery-attachment { width:${100 / (index + 1)}%; }`).join('\n')}
  .acf-gallery .acf-gallery-attachment .margin { margin:5px; position:relative; overflow:hidden; }
  .acf-gallery .acf-gallery-attachment .margin:before { content:""; display:block; padding-top:100%; }
  .acf-gallery .acf-gallery-attachment .thumbnail { position:absolute; inset:0; width:100%; height:100%; transform:translate(50%,50%); }
  .acf-gallery .acf-gallery-attachment .thumbnail img { display:block; width:auto; height:auto; max-height:100%; transform:translate(-50%,-50%); }
  .acf-gallery .acf-gallery-attachment .actions { position:absolute; top:0; right:0; display:none; }
  .acf-gallery .acf-gallery-attachment:hover .actions { display:block; }
  .acf-gallery .acf-gallery-toolbar { position:absolute; inset:auto 0 0; padding:10px; }
  .acf-gallery .acf-gallery-side { position:absolute; inset:0 0 0 auto; width:0; }
  .acf-gallery .ui-resizable-handle { display:block; height:7px; }
`

const card = (id: number) => `
  <div class="acf-gallery-attachment" data-id="${id}">
    <input type="hidden" name="acf[field_sz_gallery_library_images][]" value="${id}">
    <div class="margin"><div class="thumbnail"><img src="${image}" alt="Photograph ${id}"></div></div>
    <div class="actions"><a href="#" class="acf-icon -cancel dark acf-gallery-remove" data-id="${id}" title="Remove"></a></div>
  </div>`

for (const order of ['before', 'after'] as const) {
  test(`gallery cards keep their size and controls with native styles loaded ${order} overrides`, async ({
    page,
  }) => {
    await page.setContent(`<!doctype html><html lang="en"><head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { margin:0; padding:16px; font:14px/1.4 system-ui; }
        .button { display:inline-block; box-sizing:border-box; padding:2px 8px; font:inherit; border:1px solid #2271b1; color:#2271b1; text-decoration:none; white-space:nowrap; }
        ${order === 'before' ? nativeCss + css : css + nativeCss}
      </style></head><body>
      <div class="acf-field acf-field-gallery" data-key="field_sz_gallery_library_images">
        <div class="acf-input"><div class="acf-gallery" data-columns="8" style="height:400px">
          <div class="acf-gallery-main">
            <div class="acf-gallery-attachments">${Array.from({ length: 38 }, (_, index) => card(index + 1)).join('')}</div>
            <div class="acf-gallery-toolbar"><a href="#" class="button acf-gallery-add">Add to gallery</a></div>
          </div>
          <div class="acf-gallery-side"></div><div class="ui-resizable-handle"></div>
        </div></div>
      </div></body></html>`)
    await page.addScriptTag({
      content: `
        var galleryCalls = [];
        var galleryActions = {};
        var galleryField = {
          $el: [document.querySelector('.acf-field')],
          editAttachment: function(id) { galleryCalls.push(id); },
          selectAttachment: function() { throw new Error('The fixed sidebar should not open'); }
        };
        window.acf = { addAction: function(name, callback) { galleryActions[name] = callback; } };
        window.szGalleryLibrary = {addImage:'Add Image', edit:'Edit', editImage:'Edit image', remove:'Remove', removeImage:'Remove image'};
        window.appendFixtureImage = function() {
          var template = document.createElement('template');
          template.innerHTML = ${JSON.stringify(card(39))};
          document.querySelector('.acf-gallery-attachments').append(template.content);
        };
        document.querySelector('.acf-field').addEventListener('click', function(event) {
          var remove = event.target.closest('.acf-gallery-remove');
          if (remove) { event.preventDefault(); remove.closest('.acf-gallery-attachment').remove(); return; }
          var image = event.target.closest('.margin');
          if (image) galleryField.selectAttachment(Number(image.closest('[data-id]').dataset.id));
        });
        ${script}
        galleryActions['ready_field/key=field_sz_gallery_library_images'](galleryField);
      `,
    })

    const dimensions = await page.evaluate(() => {
      const collection = document.querySelector<HTMLElement>('.acf-gallery-attachments')!
      const column = parseFloat(getComputedStyle(collection).gridTemplateColumns.split(' ')[0])
      const cards = Array.from(collection.querySelectorAll<HTMLElement>('.acf-gallery-attachment'))
      return {
        column,
        widths: cards.map((card) => card.getBoundingClientRect().width),
        images: cards.map((card) => card.querySelector('img')!.getBoundingClientRect().width),
        controlsFit: cards.every((card) => {
          const bounds = card.getBoundingClientRect()
          return Array.from(card.querySelectorAll('button, a')).every((control) => {
            const controlBounds = control.getBoundingClientRect()
            return controlBounds.left >= bounds.left && controlBounds.right <= bounds.right
          })
        }),
        overflow: getComputedStyle(collection).overflowY,
        scrollHeight: collection.scrollHeight,
        clientHeight: collection.clientHeight,
        pageWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }
    })
    expect(dimensions.column).toBeGreaterThanOrEqual(140)
    for (const width of dimensions.widths) expect(width).toBeCloseTo(dimensions.column, 0)
    for (const width of dimensions.images) expect(width).toBeGreaterThan(dimensions.column - 4)
    expect(dimensions.controlsFit).toBe(true)
    expect(dimensions.overflow).toBe('visible')
    expect(dimensions.scrollHeight).toBe(dimensions.clientHeight)
    expect(dimensions.scrollWidth).toBe(dimensions.pageWidth)
    await expect(page.locator('.ui-resizable-handle')).toBeHidden()

    await page.locator('.acf-gallery-attachment').first().hover()
    expect(
      await page
        .locator('.actions')
        .first()
        .evaluate((actions) => getComputedStyle(actions).display),
    ).toBe('flex')
    await page.getByRole('button', { name: 'Edit image Photograph 1', exact: true }).click()
    expect(await page.evaluate(() => Reflect.get(window, 'galleryCalls'))).toEqual([1])
    await page.locator('[data-id="2"] .thumbnail').click()
    expect(await page.evaluate(() => Reflect.get(window, 'galleryCalls'))).toEqual([1, 2])

    await page.evaluate(() => Reflect.get(window, 'appendFixtureImage')())
    await expect(
      page.getByRole('button', { name: 'Edit image Photograph 39', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Edit image Photograph 39', exact: true }).click()
    expect(await page.evaluate(() => Reflect.get(window, 'galleryCalls'))).toEqual([1, 2, 39])
    await page.getByRole('link', { name: 'Remove image Photograph 39', exact: true }).click()
    await expect(page.locator('.acf-gallery-attachment')).toHaveCount(38)
  })
}
