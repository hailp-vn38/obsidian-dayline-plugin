## 1. Data Model and Parser Support

- [x] 1.1 Add `TimelineSourceContext` type and optional `sourceContext` field to `TimelineEntryMeta`, `TimelineEntryDraft`, and `TimelineIndexItem`.
- [x] 1.2 Update timeline entry validation so `sourceContext` is optional and entry metadata without it remains valid.
- [x] 1.3 Update parser/index mapping to expose source context fields for rendering and filtering.
- [x] 1.4 Add focused parser/index tests or fixtures for entries with and without `sourceContext`.

## 2. Source Context Capture

- [x] 2.1 Create a source context helper that derives source path, link text, display label, and optional subpath from active editor, Markdown view, or selected file.
- [x] 2.2 Add command `create-linked-check-in` for current active note context.
- [x] 2.3 Add editor command `create-linked-check-in-from-selection` that seeds composer content from selection and stores source context.
- [x] 2.4 Register editor context menu action for adding current selection to Dayline.
- [x] 2.5 Register file menu action for adding a selected Markdown file to Dayline.
- [x] 2.6 Ensure all new commands and menu registrations are cleaned up through Obsidian registration helpers.

## 3. Repository Persistence and Markdown Link Output

- [x] 3.1 Update quick check-in modal options and composer submit flow to carry optional source context.
- [x] 3.2 Update `TimelineRepository.createTextEntry` to persist source context in metadata.
- [x] 3.3 Generate a real Obsidian wikilink line for source-linked entries outside the hidden JSON metadata block.
- [x] 3.4 Preserve source context during edit and duplicate operations unless the user explicitly removes it.
- [x] 3.5 Verify existing attachment embedding behavior still works when a source link line is present.

## 4. Timeline UI for Linked Entries

- [x] 4.1 Add a source chip to timeline entries that have source context.
- [x] 4.2 Add source navigation from the chip using Obsidian link opening APIs.
- [x] 4.3 Add an `Open linked source` entry menu action when source context exists.
- [x] 4.4 Add a current-note filter state and toolbar control.
- [x] 4.5 Update empty states so current-note filtering has clear but short copy.
- [x] 4.6 Add or update styles for source chips and source-filter controls without disrupting current timeline layout.

## 5. Embedded `dayline` Query Blocks

- [x] 5.1 Register a `dayline` Markdown code block processor in plugin load.
- [x] 5.2 Implement a safe key/value parser for `source`, `tag`, `date`, `limit`, and `attachments`.
- [x] 5.3 Convert parsed query options into existing timeline filter/index predicates.
- [x] 5.4 Implement compact embedded timeline rendering for reading view.
- [x] 5.5 Add cleanup lifecycle for any React root, DOM listener, or Obsidian child created by embedded rendering.
- [x] 5.6 Add invalid-query and empty-query states that do not break reading view.

## 6. Day-File Properties and Daily Notes Alignment

- [x] 6.1 Define Dayline-managed frontmatter keys and document which keys are required versus optional aggregates.
- [x] 6.2 Extend frontmatter update logic to preserve user-owned keys while updating Dayline-managed keys.
- [x] 6.3 Calculate aggregate tags, source links, attachment counts, and last entry timestamp from parsed entries.
- [x] 6.4 Add settings for property enrichment enablement.
- [x] 6.5 Add settings for Daily notes alignment mode and daily note link property name.
- [x] 6.6 Recalculate optional aggregate properties after create, edit, duplicate, delete, and relevant index rebuild flows.

## 7. Documentation and Settings Copy

- [x] 7.1 Update README with linked check-in workflow, source link storage format, and privacy behavior.
- [x] 7.2 Update README with `dayline` code block examples and supported query keys.
- [x] 7.3 Update README with Dayline-managed frontmatter properties and Bases/Daily notes examples.
- [x] 7.4 Add English and Vietnamese i18n strings for new commands, notices, labels, filters, and settings.
- [x] 7.5 Keep in-app strings short and sentence case.

## 8. Validation

- [x] 8.1 Run `npm run lint` and fix reported issues.
- [x] 8.2 Run `npm run build` and verify production bundle succeeds.
- [ ] 8.3 Manually test linked check-in from selection, current note, editor menu, and file menu in Obsidian.
- [ ] 8.4 Manually test source chip navigation and current-note filtering in the sidebar timeline.
- [ ] 8.5 Manually test embedded `dayline` blocks in reading view with source, tag, date, limit, and attachment filters.
- [ ] 8.6 Manually test property enrichment with custom frontmatter keys to confirm user properties are preserved.
- [x] 8.7 Confirm no network requests, telemetry, or outside-vault file access were introduced.
