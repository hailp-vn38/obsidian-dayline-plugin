import { useEffect, useRef } from "react";
import { Component, MarkdownRenderer } from "obsidian";

import { usePlugin } from "../context/PluginContext";

interface UseMarkdownOptions {
	markdown: string;
	sourcePath: string;
	onRendered?: (container: HTMLElement) => void;
}

export function useMarkdown({
	markdown,
	sourcePath,
	onRendered,
}: UseMarkdownOptions) {
	const { app } = usePlugin();
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !markdown.trim()) return;

		container.empty();
		const component = new Component();
		component.load();

		let isMounted = true;

		void MarkdownRenderer.render(
			app,
			markdown,
			container,
			sourcePath,
			component,
		)
			.then(() => {
				if (!isMounted) return;
				onRendered?.(container);
			})
			.catch((error: unknown) => {
				console.error(error);
			});

		return () => {
			isMounted = false;
			component.unload();
		};
	}, [app, markdown, onRendered, sourcePath]);

	return containerRef;
}
