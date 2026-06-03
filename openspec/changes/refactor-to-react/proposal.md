## Why

The current `obsidian-personal-timeline-plugin` uses manual DOM manipulation (via Obsidian's `createDiv`, `createEl`) to construct and manage the user interface. As the plugin grows in complexity, managing state, re-rendering UI components, and maintaining the codebase becomes increasingly difficult, bug-prone, and inefficient. Migrating the view layer to React will provide a declarative UI, centralized state management, better component reusability, and a significantly improved developer experience, making the plugin more robust, maintainable, and easier to extend.

## What Changes

- Migrate the UI view layer (`TimelineView`) to React.
- Replace manual DOM creation (`createDiv`, `createEl`) with React components and JSX/TSX.
- Setup a React root and integration with Obsidian's `ItemView` lifecycle (`onOpen`, `onClose`).
- Introduce centralized or hook-based state management (e.g., `useState`, Context API) to handle filters, drafting, and recording states natively in React.
- Restructure the UI codebase into modular React components (e.g., TimelineList, TimelineEntry, TimelineToolbar, Composer).
- Add `react` and `react-dom` dependencies to the project.
- Configure TypeScript and ESBuild to support `.tsx` files.
- Refactor how Obsidian's Markdown rendering (asynchronous, imperative) is handled within React's declarative lifecycle.

## Capabilities

### New Capabilities

- `react-view-layer`: Handles declarative rendering of the Timeline UI using React, including component structure, state management, and Obsidian lifecycle integration.

### Modified Capabilities

- `timeline-view-rendering`: Transitions from existing manual DOM rendering logic to React components.

## Impact

- **Dependencies**: Adds `react`, `react-dom`, `@types/react`, and `@types/react-dom`.
- **Build System**: Modification of `tsconfig.json` and potentially `esbuild.config.mjs` to fully support TSX and React.
- **Codebase**: Transforms `src/views/timeline/*` and `TimelineView.ts` to React `.tsx` components.
- **Plugin Size**: Increased bundle size due to bundling React/ReactDOM.
- **Development Workflow**: Developers will write React components instead of native Obsidian DOM creation.
