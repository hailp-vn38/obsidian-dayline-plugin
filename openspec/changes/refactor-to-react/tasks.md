## 1. Setup Environment and Dependencies

- [x] 1.1 Add `react` and `react-dom` to `package.json` dependencies.
- [x] 1.2 Add `@types/react` and `@types/react-dom` to `package.json` devDependencies.
- [x] 1.3 Update `tsconfig.json` to include `"jsx": "react-jsx"` and allow `.tsx` files in `include`.
- [x] 1.4 Update linting configuration (`eslint.config.mts`) for React linting rules and `.tsx` support.

## 2. Shared Context and Root Component Setup

- [x] 2.1 Rename `TimelineView.ts` to `TimelineView.tsx`.
- [x] 2.2 Refactor `TimelineView`'s `onOpen`/`onClose` to use `createRoot` and `root.render()`.
- [x] 2.3 Create a `PluginContext` to supply Obsidian `App` and `Plugin` instances down the React tree.
- [x] 2.4 Create a `<TimelineRoot />` wrapper component to maintain top-level state (filters, drafts, recordings) and data loading.

## 3. UI Component Migration

- [x] 3.1 Migrate `renderTimelineToolbar.ts` to a `<TimelineToolbar />` React component.
- [x] 3.2 Migrate `renderTimelineList.ts` to a `<TimelineList />` React component that iterates and renders timeline data arrays.
- [x] 3.3 Migrate `renderTimelineEntry.ts` and attachment rendering into a `<TimelineEntry />` React component.
- [x] 3.4 Implement an effect hook inside `<TimelineEntry />` to utilize Obsidian's `MarkdownRenderer.render` correctly.

## 4. Composer and Actions Refactoring

- [x] 4.1 Migrate `renderComposerPanel.ts` and helper components (draft tags, attachments, recordings) into a `<ComposerPanel />` React component tree.
- [x] 4.2 Restructure draft/recording states to use React Hooks instead of imperative variable mutators.
- [x] 4.3 Ensure entry actions and context menu handlers (`timelineEntryActions`, `timelineMenu`) can be safely called from React components.

## 5. Integration and Final Validation

- [x] 5.1 Ensure Obsidian workspace events (e.g., refresh callbacks from `timelineIndex`) properly trigger React state updates so the UI redraws automatically.
- [x] 5.2 Test CSS styles and verify identical appearance with the previous imperative DOM implementation.
- [ ] 5.3 Perform a full build (`npm run build`) and manual check inside Obsidian.
