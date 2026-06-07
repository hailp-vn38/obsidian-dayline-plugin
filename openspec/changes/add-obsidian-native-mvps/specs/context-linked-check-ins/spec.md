## ADDED Requirements

### Requirement: Capture source context from Obsidian surfaces
The system SHALL allow users to create a Dayline check-in from Obsidian editor and file context while preserving the relevant source note or file reference.

#### Scenario: Create linked check-in from editor selection
- **WHEN** the user selects text in an active Markdown editor and runs the linked check-in command
- **THEN** the quick check-in composer opens with the selected text as initial content
- **AND** the draft contains source context for the active Markdown file

#### Scenario: Create linked check-in from current note without selection
- **WHEN** the user runs the linked check-in command from an active Markdown editor with no selected text
- **THEN** the quick check-in composer opens with empty content
- **AND** the draft contains source context for the active Markdown file

#### Scenario: Create linked check-in from file menu
- **WHEN** the user opens the file context menu for a Markdown file and selects the Dayline action
- **THEN** the quick check-in composer opens
- **AND** the draft contains source context for the selected file

### Requirement: Persist source context safely
The system SHALL persist source context as optional timeline entry metadata without invalidating existing entries that do not contain source context.

#### Scenario: Save entry with source context
- **WHEN** the user saves a linked check-in
- **THEN** the entry metadata includes optional `sourceContext` with source path, link text, type, and captured timestamp
- **AND** required legacy metadata fields remain unchanged

#### Scenario: Parse entry without source context
- **WHEN** the timeline index parses an existing entry that has no `sourceContext`
- **THEN** the entry remains valid
- **AND** the entry appears in the timeline normally

### Requirement: Write native Obsidian link into linked entries
The system SHALL write a real Obsidian internal link into the Markdown content of entries with source context.

#### Scenario: Save linked note entry
- **WHEN** the repository creates an entry with source context for a note
- **THEN** the entry Markdown contains a wikilink to the source note
- **AND** the link is outside the hidden JSON metadata comment

#### Scenario: Save linked heading or block entry
- **WHEN** the captured context includes a heading or block subpath
- **THEN** the entry Markdown link includes the subpath
- **AND** opening the source action navigates to the subpath when Obsidian can resolve it

### Requirement: Display and navigate source context in the timeline
The system SHALL show linked source information in timeline entries and let users navigate back to source content.

#### Scenario: Render source chip
- **WHEN** a timeline entry has source context
- **THEN** the timeline entry displays a source chip with a readable note or file label
- **AND** entries without source context do not display an empty source chip

#### Scenario: Open source from chip
- **WHEN** the user selects the source chip
- **THEN** Obsidian opens the linked source using the stored link text and subpath

#### Scenario: Open source from entry menu
- **WHEN** the user opens the entry menu for a linked entry
- **THEN** the menu includes an action to open the linked source

### Requirement: Filter timeline by current note
The system SHALL let users filter Dayline entries to those linked to the currently active note.

#### Scenario: Active note has linked entries
- **WHEN** a Markdown note is active and the user enables the current-note filter
- **THEN** the timeline shows entries whose source context path matches the active note path

#### Scenario: Active note has no linked entries
- **WHEN** a Markdown note is active and no Dayline entries link to it
- **THEN** the timeline shows the empty filtered state

#### Scenario: No active Markdown note
- **WHEN** no Markdown note is active
- **THEN** the current-note filter is unavailable or disabled

### Requirement: Preserve local-first privacy behavior
The system MUST keep source-linked capture fully local to the vault.

#### Scenario: Create linked entry
- **WHEN** the user creates a linked check-in
- **THEN** no network request is made
- **AND** no source content is transmitted outside the vault
