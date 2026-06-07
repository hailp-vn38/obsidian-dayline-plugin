## ADDED Requirements

### Requirement: Maintain Dayline-managed day-file properties
The system SHALL update Dayline-managed frontmatter properties on timeline day files when entries are created, edited, duplicated, deleted, or reindexed.

#### Scenario: Create entry updates properties
- **WHEN** a new entry is created in a day file
- **THEN** the file frontmatter contains updated `entry_count`, `updated_at`, and Dayline-managed aggregate properties

#### Scenario: Delete entry updates properties
- **WHEN** an entry is deleted from a day file
- **THEN** the file frontmatter reflects the new entry count and aggregate values

#### Scenario: Reindex preserves properties
- **WHEN** the plugin rebuilds the timeline index
- **THEN** Dayline-managed properties can be recalculated from parsed entries without requiring external state

### Requirement: Preserve user-owned frontmatter
The system MUST preserve frontmatter keys that are not managed by Dayline.

#### Scenario: Update day file with custom property
- **WHEN** a timeline day file contains a custom user property
- **THEN** Dayline updates only its managed keys
- **AND** the custom user property remains unchanged

#### Scenario: Existing Dayline keys update
- **WHEN** a timeline day file already contains Dayline-managed keys
- **THEN** Dayline replaces those values with current calculated values

### Requirement: Expose Bases-friendly aggregate data
The system SHALL write aggregate values in frontmatter formats that Obsidian Properties and Bases can query.

#### Scenario: Aggregate tags are written as list
- **WHEN** a day file has entries with tags
- **THEN** the frontmatter contains a `dayline_tags` list of unique tags

#### Scenario: Aggregate sources are written as links
- **WHEN** a day file has entries with source context
- **THEN** the frontmatter contains a `dayline_sources` list with source wikilinks or link text values

#### Scenario: Attachment count is written as number
- **WHEN** a day file has entries with attachments
- **THEN** the frontmatter contains numeric attachment aggregate properties

### Requirement: Support optional Daily notes alignment
The system SHALL provide settings for connecting Dayline day files to Daily notes without requiring the Daily notes core plugin to be enabled.

#### Scenario: Daily notes integration disabled
- **WHEN** Daily notes alignment is set to `off`
- **THEN** Dayline does not add Daily-note-specific properties

#### Scenario: Daily note link property enabled
- **WHEN** Daily notes alignment is set to link mode
- **THEN** Dayline writes a configured property linking the timeline date to the corresponding daily note target

#### Scenario: Daily note target missing
- **WHEN** the configured Daily note target file does not exist
- **THEN** Dayline writes a valid unresolved wikilink or skips the property according to settings

### Requirement: Keep property enrichment configurable
The system SHALL allow users to disable Dayline property enrichment while keeping existing timeline storage functional.

#### Scenario: Property enrichment disabled
- **WHEN** the user disables Dayline property enrichment in settings
- **THEN** new entry operations continue to update required legacy frontmatter keys
- **AND** optional aggregate properties are not added or refreshed

#### Scenario: Property enrichment enabled again
- **WHEN** the user re-enables Dayline property enrichment
- **THEN** Dayline recalculates aggregate properties from parsed timeline entries

### Requirement: Document managed properties
The system SHALL document the frontmatter keys Dayline manages and the meaning of each key.

#### Scenario: User reads README
- **WHEN** the user opens Dayline documentation
- **THEN** the documentation lists managed properties, optional properties, and how they interact with Obsidian Bases/Daily notes
