# Troubleshooting WordPress editing

Protect the work first, then determine whether the problem is in the editor, saved WordPress data, preview, or the public frontend.

## First response

1. Stop repeating the action. Repeated saves, uploads, or refreshes can overwrite recoverable state or create duplicates.
2. If important unsaved text is still visible, copy it somewhere safe without closing the editor.
3. Read the complete notice. Record the current screen, item title, action taken, approximate time, and exact observed result.
4. Check whether WordPress shows saving, saved, failed, or an input-limit warning.
5. Save a draft only when it is safe, then compare editor fields, refreshed preview, and public page as separate states.

## Diagnose by symptom

- **Change appears in the editor but not preview:** wait for autosave, then use **Refresh Preview** once. New pages must be saved as drafts first.
- **Change appears in preview but not publicly:** confirm the item was published/updated rather than only saved as a draft. Refresh the public page once.
- **Published page is missing from navigation:** publishing and menu placement are separate; inspect Appearance > Menus.
- **Page uses the wrong header:** inspect Page Settings > Menu Override or its Site Menus assignment.
- **Gallery change appears on several pages:** the pages share one Gallery Library entry; this is expected reuse.
- **Image details changed elsewhere:** attachment metadata is shared wherever the same Media Library item is reused.
- **Form looks correct but delivery fails:** stop test submissions, note the form/page and delivery mode, and contact the webmaster. Website Help cannot inspect delivery logs.
- **A section is missing after save:** look for collapsed/removed Page Block rows and any `max_input_vars` warning. Do not keep saving a large page after that warning.
- **An item seems deleted:** check the relevant list's Trash before recreating it.
- **A field or block described in the handbook is absent:** the deployed WordPress code may be older or the field group may not be loaded; contact the webmaster.

## Safe browser checks

After preserving work, try one normal refresh. If the issue remains, note browser/device, whether it occurs in another normal browser window, and whether other WordPress pages work. Do not clear all browser data, disable security controls, install plugins, or recreate content as a first troubleshooting step.

Do not paste passwords, API keys, private recipient addresses, customer enquiries, server details, or confidential screenshots into Website Help. It cannot inspect logs, deployment status, backups, third-party dashboards, or deleted data.

For the webmaster, include the goal, current screen/page, expected outcome, exact observed result, repeatable steps, visible error text, publication status, and whether unsaved work remains. A screenshot is useful only after checking it contains no confidential information.