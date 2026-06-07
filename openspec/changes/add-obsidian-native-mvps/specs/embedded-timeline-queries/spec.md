## ADDED Requirements

### Requirement: Register Dayline Markdown code block
The system SHALL support a fenced Markdown code block named `dayline` that renders Dayline entries in Markdown reading view.

#### Scenario: Render basic dayline block
- **WHEN** a Markdown note contains a fenced `dayline` code block
- **THEN** reading view replaces the rendered block area with a Dayline timeline embed
- **AND** the original Markdown source remains unchanged

#### Scenario: Plugin disabled
- **WHEN** the Dayline plugin is disabled
- **THEN** the fenced `dayline` code block remains plain Markdown content

### Requirement: Parse safe query options
The system SHALL parse only a small key/value query format for embedded timeline blocks.

#### Scenario: Parse supported filters
- **WHEN** the code block contains supported keys such as `source`, `tag`, `date`, `limit`, or `attachments`
- **THEN** the renderer applies those filters to timeline index items

#### Scenario: Ignore unsupported keys safely
- **WHEN** the code block contains an unsupported key
- **THEN** the renderer ignores that key or displays a non-blocking warning
- **AND** no JavaScript expression is executed

#### Scenario: Reject unsafe limit
- **WHEN** the code block contains a negative or excessively large `limit`
- **THEN** the renderer clamps the value to a safe configured range

### Requirement: Support source-aware embedded queries
The system SHALL allow embedded timelines to show entries linked to the current note or to a specified source.

#### Scenario: Query current note source
- **WHEN** a `dayline` block contains `source: current`
- **THEN** the embed renders entries whose source context matches the note containing the code block

#### Scenario: Query explicit source path
- **WHEN** a `dayline` block contains a valid vault path as `source`
- **THEN** the embed renders entries whose source context path matches that vault path

#### Scenario: Query note without linked entries
- **WHEN** the query resolves to no matching linked entries
- **THEN** the embed displays a compact empty state instead of failing silently

### Requirement: Support common timeline filters
The system SHALL support date, tag, attachment type, and result limit filters in embedded timeline blocks.

#### Scenario: Query by tag
- **WHEN** a `dayline` block contains `tag: work`
- **THEN** the embed renders only entries containing the `work` tag

#### Scenario: Query by date preset
- **WHEN** a `dayline` block contains `date: this-week`
- **THEN** the embed renders entries within the same week calculation used by the main timeline filters

#### Scenario: Query by attachment type
- **WHEN** a `dayline` block contains `attachments: image`
- **THEN** the embed renders only entries with at least one image attachment

### Requirement: Render embeds without leaking resources
The system MUST clean up any mounted renderer, event listener, or Obsidian child component created for a `dayline` block.

#### Scenario: Reading view rerenders
- **WHEN** Obsidian rerenders a note containing a `dayline` block
- **THEN** the old Dayline embed renderer is unmounted or disposed
- **AND** the new renderer displays the current timeline index state

#### Scenario: Note closes
- **WHEN** the note containing a `dayline` block is closed
- **THEN** associated renderer resources are cleaned up

### Requirement: Preserve main timeline behavior
The system SHALL implement embedded timelines without changing existing sidebar timeline behavior.

#### Scenario: Sidebar timeline remains available
- **WHEN** a note contains one or more `dayline` blocks
- **THEN** the main Dayline sidebar still opens and filters entries as before

#### Scenario: Embedded query uses current index
- **WHEN** new entries are added and the timeline index refreshes
- **THEN** embedded timelines use refreshed index data on the next reading-view render
