# Website Help context, privacy, and conversation history

Website Help is a guidance assistant inside WordPress. It can explain the Studio Zanetti editing workflow, but it cannot click controls, save content, publish, upload files, alter settings, or run webmaster tasks.

## What context it can use

Every question includes basic screen information such as the current WordPress area and whether unsaved changes may exist. On supported editors, you may also allow a narrow read-only context request. Website Help asks for one approved scope at a time, for at most two rounds, and the browser shows a consent prompt before reading editor fields.

Approved context can include the current item title/status, a block outline, selected visible block fields, a gallery count, or a specific safe field group. It excludes passwords, credentials, nonces, cookies, uploaded file data, private recipient addresses, customer enquiries, default personal values, raw URLs, and private integration mappings. If you decline a requested scope, that answer stops and your question remains available so you can clarify it or retry with editor context disabled.

The answer's **Context used** disclosure lists the screen, item, block names, and scopes consulted. It does not retain a copy of the raw editor snapshot.

## Conversation history

- Conversations are private to the logged-in WordPress user who created them.
- Use **New chat** when changing to an unrelated task. You can start typing while the new chat opens; that text will not be cleared when it finishes opening.
- Select **History** to search or reopen an earlier conversation. In the drawer and on smaller screens, **Back to chat** returns to your question. The full-page workspace can show history alongside the conversation on a wide screen.
- Select **Full page** in the drawer header to continue the same saved conversation in the full-page workspace. Unsent text and a first answer still being prepared do not transfer, so wait for that answer before expanding. Opening the full page does not change who can access a conversation.
- Open the options button beside a conversation to **Rename**, **Pin**, or **Delete** it. Rename a conversation so it is easier to find later; pin ongoing work so it stays prominent.
- Search by wording from the question or answer, and filter by a recorded page or screen.
- Delete one conversation when it is no longer useful. To delete all history, open **History options** (the three dots beside **Your conversations**) and choose **Delete all history**. You will be asked to confirm before anything is deleted.

The compact suggested-question buttons put a question in the message box; they do not send it automatically. Type in **Type a message...** and select the up-arrow **Send message** button inside the input when ready. While an answer is being prepared, that button shows a loading indicator and cannot send another request. If the request fails, your question stays in the box so you can retry. Errors remain visible when switching between history and chat. **Latest messages** appears only when you have scrolled away from the end of a longer conversation.

The message box starts at a comfortable single-line height. It grows upward as you add more lines, while the send arrow stays in the bottom-right corner. Longer drafts scroll inside the box once it reaches its height limit. Clearing or sending the draft returns the box to its starting height.

Replies can show headings, paragraphs, bold, emphasis, numbered or bulleted lists, quotes, and code. New replies keep that structure when you reopen them. Older saved replies may still lack paragraph breaks removed by a previous version. Your own messages are displayed as you typed them, without interpreting formatting.

On supported editors, **Use my current unsaved edits when needed** below the input controls whether the assistant may request unsaved editor details. The consent prompt still asks for your approval before those details are read.

Keyboard users can press Escape to close a conversation's options, then leave history, then close the help drawer. Closing the drawer returns focus to the control that opened it.

Local conversation history keeps questions, answers, source topic IDs, status, optional webmaster requests, and a minimal context summary. It remains until the user deletes it. Provider requests disable provider-side response storage, but the selected handbook excerpts, bounded conversation context, and explicitly approved editor context are sent to the configured AI provider to produce the answer.

Use the flag beside an answer when its guidance appears inaccurate. After confirmation, Website Help emails the stored question and answer to the webmaster for review. It does not send raw editor context. An answer can be reported once, and its reported status remains visible in that conversation.

## What not to share

Do not type passwords, API keys, customer messages, unpublished personal information, private recipient addresses, or server credentials into a question. If a support request needs confidential information, contact the webmaster through the established private channel rather than placing it in Website Help.