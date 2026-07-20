(function () {
  'use strict'

  var trigger = document.querySelector('.sz-add-post-button[data-editor-id="content"]')
  if (!trigger) return

  var dialog = document.createElement('dialog')
  dialog.setAttribute('aria-labelledby', 'sz-post-button-title')
  dialog.innerHTML =
    '<form method="dialog" style="width:min(420px,calc(100vw - 48px));padding:8px">' +
    '<h2 id="sz-post-button-title" style="margin:0 0 20px">Add Button</h2>' +
    '<p><label for="sz-post-button-text"><strong>Text</strong></label>' +
    '<input id="sz-post-button-text" class="widefat" type="text" required maxlength="255"></p>' +
    '<p><label for="sz-post-button-link"><strong>Link</strong></label>' +
    '<input id="sz-post-button-link" class="widefat" type="text" required placeholder="/contact"></p>' +
    '<fieldset style="margin:20px 0"><legend><strong>Alignment</strong></legend>' +
    '<label><input type="radio" name="sz-post-button-alignment" value="left"> Left</label> ' +
    '<label style="margin-left:16px"><input type="radio" name="sz-post-button-alignment" value="center" checked> Centre</label>' +
    '</fieldset>' +
    '<p class="sz-post-button-error" role="alert" style="display:none;color:#b32d2e"></p>' +
    '<div style="display:flex;justify-content:flex-end;gap:8px">' +
    '<button type="button" class="button sz-post-button-cancel">Cancel</button>' +
    '<button type="submit" class="button button-primary">Insert Button</button>' +
    '</div></form>'
  document.body.appendChild(dialog)

  var form = dialog.querySelector('form')
  var textInput = dialog.querySelector('#sz-post-button-text')
  var linkInput = dialog.querySelector('#sz-post-button-link')
  var error = dialog.querySelector('.sz-post-button-error')

  function showError(message) {
    error.textContent = message
    error.style.display = 'block'
  }

  function isAllowedLink(value) {
    if (/^(\/[^/]|\/($)|#|\?)/.test(value)) return true

    try {
      var url = new URL(value)
      return ['http:', 'https:', 'mailto:', 'tel:'].indexOf(url.protocol) !== -1
    } catch (_error) {
      return false
    }
  }

  function createMarkup(text, link, alignment) {
    var wrapper = document.createElement('p')
    var anchor = document.createElement('a')
    wrapper.className = 'sz-post-button sz-post-button--' + alignment
    anchor.className = 'sz-post-button__link'
    anchor.setAttribute('href', link)
    anchor.textContent = text
    wrapper.appendChild(anchor)
    return wrapper.outerHTML
  }

  function insertContent(html) {
    var editor = window.tinymce && window.tinymce.get('content')
    if (editor && !editor.isHidden()) {
      editor.execCommand('mceInsertContent', false, html)
      return
    }

    if (window.QTags && typeof window.QTags.insertContent === 'function') {
      window.QTags.insertContent(html)
      return
    }

    var textarea = document.getElementById('content')
    if (!textarea) return
    var start = textarea.selectionStart || 0
    textarea.setRangeText(html, start, textarea.selectionEnd || start, 'end')
  }

  trigger.addEventListener('click', function () {
    form.reset()
    error.style.display = 'none'
    dialog.showModal()
    textInput.focus()
  })

  dialog.querySelector('.sz-post-button-cancel').addEventListener('click', function () {
    dialog.close()
  })

  form.addEventListener('submit', function (event) {
    event.preventDefault()
    var text = textInput.value.trim()
    var link = linkInput.value.trim()
    var alignment = form.elements['sz-post-button-alignment'].value

    if (!text || !link) {
      showError('Enter both button text and a link.')
      return
    }
    if (!isAllowedLink(link)) {
      showError('Enter a full web address, email or phone link, or a site-relative link beginning with /.')
      return
    }

    insertContent(createMarkup(text, link, alignment))
    dialog.close()
  })
})()