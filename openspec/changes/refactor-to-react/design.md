## Context

Currently, `TimelineView.ts` and its helper modules (in `src/views/timeline/*`) create Obsidian views by manually manipulating the DOM using an imperative approach (`createEl`, `createDiv`). The state logic (filters, timeline entries, recording states, draft content) is tightly coupled with DOM redraws (`empty()` and re-`render()`), leading to inefficient updates and hard-to-maintain code. The requirement is to refactor this view layer to use React.

## Goals / Non-Goals

**Goals:**

- Replace manual DOM creation with functional React components.
- Establish a React root inside the Obsidian `ItemView`.
- Migrate all internal UI states (draft, recording, search filters) to React state management (`useState` / Context).
- Maintain existing functionality exactly as is, including timeline rendering, composer actions, attachments logic, and integration with Obsidian's internal APIs (e.g., MarkdownRenderer).
- Create a scalable component structure (e.g., `<TimelineView/>`, `<Composer/>`, `<TimelineList/>`).

**Non-Goals:**

- Do not rewrite the storage or parser logic (e.g., `src/storage/*`, `src/parser/*`).
- Do not introduce drastic UX/UI redesigns. The visual appearance and CSS should remain mostly the same.

## Decisions

- **Entry Point for React**: `TimelineView.ts` will become `.tsx`. In `onOpen()`, we will use `createRoot(this.containerEl.children[1]).render(<TimelineRoot plugin={this.plugin} />)`. `onClose()` will call `root.unmount()`.
- **Component Architecture**:
    - `TimelineRoot`: Manages top-level state (filter state, pulling data from `timelineIndex`).
    - `ComposerPanel`: Manages drafting and recording states.
    - `TimelineList`: Iterates and renders grouped timeline entries.
    - `TimelineEntry`: Individual entry, handles React-based rendering of text and attachments, but delegates Markdown rendering to Obsidian's `MarkdownRenderer.render` inside a `useEffect` using refs.
- **State Management**: Using standard React Hooks (`useState`, `useCallback`, `useMemo`). The centralized `Plugin` instance is passed via a React Context `<PluginContext.Provider>` to avoid prop drilling.
- **File Renaming**: We will change `.ts` files to `.tsx` where React components are used to satisfy TypeScript. `tsconfig.json` requires `"jsx": "react-jsx"`, and we'll install `@types/react` and `@types/react-dom`.

## Risks / Trade-offs

- **Risk:** Markdown Rendering latency and React lifecycle mismatch. Obsidian's imperative `MarkdownRenderer` might clash with React's update cycles.
    - _Mitigation_: Render an empty `<div ref={containerRef}>` and utilize `useEffect` to safely call `MarkdownRenderer` once the container is mounted, with proper cleanup if the component unmounts.
- **Risk:** Custom events and toolbars from Obsidian interacting poorly with React.
    - _Mitigation_: Expose Obsidian callbacks via Context and carefully manage event listeners in hooks.
