# Website Help context, privacy, and conversation history

Website Help is a guidance assistant inside WordPress. It can explain the Studio Zanetti editing workflow, but it cannot click controls, save content, publish, upload files, alter settings, or run webmaster tasks.

## What context it can use

Every question includes basic screen information such as the current WordPress area and whether unsaved changes may exist. On supported editors, you may also allow a narrow read-only context request. Website Help asks for one approved scope at a time, for at most two rounds, and the browser shows a consent prompt before reading editor fields.

Approved context can include the current item title/status, a block outline, selected visible block fields, a gallery count, or a specific safe field group. It excludes passwords, credentials, nonces, cookies, uploaded file data, private recipient addresses, customer enquiries, default personal values, raw URLs, and private integration mappings. If you decline a requested scope, that answer stops and your question remains available so you can clarify it or retry with editor context disabled.

The answer's **Context used** disclosure lists the screen, item, block names, and scopes consulted. It does not retain a copy of the raw editor snapshot.

## Conversation history

- Conversations are private to the logged-in WordPress user who created them.
- Use **New conversation** when changing to an unrelated task.
- Rename a conversation so it is easier to find later.
- Pin ongoing work so it stays prominent.
- Search by wording from the question or answer, and filter by a recorded page or screen.
- Delete one conversation when it is no longer useful, or delete all history from the Website Help page.

Local conversation history keeps questions, answers, source topic IDs, status, optional webmaster requests, and a minimal context summary. It remains until the user deletes it. Provider requests disable provider-side response storage, but the selected handbook excerpts, bounded conversation context, and explicitly approved editor context are sent to the configured AI provider to produce the answer.

## What not to share

Do not type passwords, API keys, customer messages, unpublished personal information, private recipient addresses, or server credentials into a question. If a support request needs confidential information, contact the webmaster through the established private channel rather than placing it in Website Help.