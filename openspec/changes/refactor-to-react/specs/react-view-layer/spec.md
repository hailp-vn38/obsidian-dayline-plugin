## ADDED Requirements

### Requirement: Declarative React Timeline View

The plugin SHALL render its Timeline view using React instead of manual DOM creation.

#### Scenario: Opening the view

- **WHEN** the user opens the Timeline view in Obsidian
- **THEN** an overarching React component is mounted to the view's content element
- **THEN** all timeline data, filters, and composer states are initialized as React states or context

### Requirement: Componentization of UI elements

The UI SHALL be broken down into modular React components such as TimelineList, TimelineEntry, ComposerPanel, and TimelineToolbar.

#### Scenario: Rendering the component tree

- **WHEN** the Timeline data is fetched and supplied to the root component
- **THEN** the TimelineList component maps the data to TimelineEntry components
- **THEN** the components are updated efficiently when data or filters change

### Requirement: React and Obsidian API interop

The React components SHALL safely interface with Obsidian APIs like `MarkdownRenderer`.

#### Scenario: Rendering markdown content inside a React component

- **WHEN** a TimelineEntry is rendered containing Markdown text
- **THEN** a `useEffect` hook triggers `MarkdownRenderer.render` onto a referenced HTML container after mount
- **THEN** the rendered results persist correctly during normal component lifecycles
