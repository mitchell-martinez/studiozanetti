(function ($) {
  const RESERVED_FIELD_ID = 'name';
  const RESERVED_FIELD_LABEL = 'Name';
  const RESERVED_FIELD_TYPE = 'text';
  const RESERVED_VSCO_KEY = 'FirstName';
  const RESERVED_AUTOCOMPLETE = 'name';
  const FORM_BLOCK_SELECTOR = '.layout[data-layout="form_block"]';
  const FIELDS_REPEATER_SELECTOR = '.acf-field-repeater[data-name="fields"]';

  const normalize = (value) => String(value || '').trim().toLowerCase();

  const getRepeaterBody = ($repeater) =>
    $repeater.find('> .acf-input > .acf-repeater > .acf-table > tbody').first();

  const getRepeaterRows = ($repeater) => getRepeaterBody($repeater).children('.acf-row:not(.acf-clone)');

  const getFieldWrapper = ($row, fieldName) => $row.find(`.acf-field[data-name="${fieldName}"]`).first();

  const getInput = ($row, fieldName, selector) => getFieldWrapper($row, fieldName).find(selector).first();

  const getTextInput = ($row, fieldName) => getInput($row, fieldName, 'input[type="text"]');

  const getSelectInput = ($row, fieldName) => getInput($row, fieldName, 'select');

  const getToggleInput = ($row, fieldName) =>
    getFieldWrapper($row, fieldName).find('input[type="checkbox"]').last();

  const isReservedRow = ($row) => {
    const fieldId = normalize(getTextInput($row, 'field_id').val());
    const vscoKey = normalize(getTextInput($row, 'vsco_field_key').val());
    return fieldId === RESERVED_FIELD_ID || vscoKey === normalize(RESERVED_VSCO_KEY);
  };

  const moveRowToTop = ($repeater, $row) => {
    const $body = getRepeaterBody($repeater);
    if (!$body.length || !$row.length) {
      return;
    }

    const $firstRow = getRepeaterRows($repeater).first();
    if ($firstRow.length && $firstRow[0] === $row[0]) {
      return;
    }

    $body.prepend($row);
  };

  const lockReservedRow = ($repeater, $row) => {
    if (!$row.length) {
      return;
    }

    $row.attr('data-sz-reserved-name-row', 'true');
    $row.find('> .acf-row-handle.remove, > td.acf-row-handle.remove').hide();
    $row.find('> .acf-row-handle.order, > td.acf-row-handle.order').css({
      pointerEvents: 'none',
      opacity: 0.45,
    });

    const $fieldIdInput = getTextInput($row, 'field_id');
    $fieldIdInput.val(RESERVED_FIELD_ID).prop('readonly', true).trigger('input');

    const $labelInput = getTextInput($row, 'label');
    if (!$labelInput.val()) {
      $labelInput.val(RESERVED_FIELD_LABEL).trigger('input');
    }

    const $typeField = getFieldWrapper($row, 'type');
    const $typeInput = getSelectInput($row, 'type');
    $typeInput.val(RESERVED_FIELD_TYPE).trigger('change');
    $typeField.hide();

    const $requiredField = getFieldWrapper($row, 'required');
    const $requiredInput = getToggleInput($row, 'required');
    if (!$requiredInput.prop('checked')) {
      $requiredInput.prop('checked', true).trigger('change');
    }
    $requiredField.hide();

    const $vscoKeyInput = getTextInput($row, 'vsco_field_key');
    $vscoKeyInput.val(RESERVED_VSCO_KEY).prop('readonly', true).trigger('input');

    const $autocompleteInput = getTextInput($row, 'autocomplete');
    if ($autocompleteInput.length && !String($autocompleteInput.val() || '').trim()) {
      $autocompleteInput.val(RESERVED_AUTOCOMPLETE).trigger('input');
    }

    moveRowToTop($repeater, $row);
  };

  const ensureReservedRow = ($repeater) => {
    const $rows = getRepeaterRows($repeater);
    const $reservedRow = $rows.filter((index, element) => isReservedRow($(element))).first();

    if ($reservedRow.length) {
      lockReservedRow($repeater, $reservedRow);
      return;
    }

    const $addButton = $repeater.find('> .acf-input > .acf-repeater > .acf-actions .acf-button').first();
    if (!$addButton.length) {
      return;
    }

    const previousRowCount = $rows.length;
    $addButton.trigger('click');

    window.requestAnimationFrame(() => {
      const $nextRows = getRepeaterRows($repeater);
      const nextIndex = Math.max(0, $nextRows.length - 1);
      const $newRow =
        $nextRows.length > previousRowCount ? $nextRows.eq(nextIndex) : $nextRows.last();

      if (!$newRow.length) {
        return;
      }

      lockReservedRow($repeater, $newRow);
    });
  };

  const syncFormBlock = ($layout) => {
    const $repeater = $layout.find(FIELDS_REPEATER_SELECTOR).first();
    if (!$repeater.length) {
      return;
    }

    ensureReservedRow($repeater);
  };

  const syncWithin = ($root) => {
    const $rootElement = $root instanceof $ ? $root : $($root || document);
    const $layouts = $rootElement.is(FORM_BLOCK_SELECTOR)
      ? $rootElement
      : $rootElement.find(FORM_BLOCK_SELECTOR);

    $layouts.each((index, layout) => {
      syncFormBlock($(layout));
    });
  };

  const scheduleSync = ($root) => {
    window.requestAnimationFrame(() => {
      syncWithin($root);
    });
  };

  if (typeof acf !== 'undefined' && acf.addAction) {
    acf.addAction('ready', ($el) => scheduleSync($el || document));
    acf.addAction('append', ($el) => scheduleSync($el || document));
  } else {
    $(document).ready(() => scheduleSync(document));
  }

  $(document).on('click', `${FORM_BLOCK_SELECTOR} ${FIELDS_REPEATER_SELECTOR} .acf-actions .acf-button`, (event) => {
    scheduleSync($(event.currentTarget).closest(FORM_BLOCK_SELECTOR));
  });

  $(document).on(
    'change input',
    `${FORM_BLOCK_SELECTOR} ${FIELDS_REPEATER_SELECTOR} .acf-field[data-name="field_id"] input, ${FORM_BLOCK_SELECTOR} ${FIELDS_REPEATER_SELECTOR} .acf-field[data-name="vsco_field_key"] input, ${FORM_BLOCK_SELECTOR} ${FIELDS_REPEATER_SELECTOR} .acf-field[data-name="type"] select, ${FORM_BLOCK_SELECTOR} ${FIELDS_REPEATER_SELECTOR} .acf-field[data-name="required"] input[type="checkbox"]`,
    (event) => {
      scheduleSync($(event.currentTarget).closest(FORM_BLOCK_SELECTOR));
    },
  );
})(jQuery);