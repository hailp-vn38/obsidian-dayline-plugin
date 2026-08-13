import React, { useEffect, useRef, useState } from "react";
import { TFile, type App } from "obsidian";

import { usePlugin } from "../../context/PluginContext";
import { t } from "../../i18n";
import type { TimelineIndexItem } from "../../models/TimelineEntry";
import type { TimelineLanguage } from "../../models/TimelineSettings";
import { getSourceContextLabel } from "../../utils/sourceContext";
import { ObsidianIcon } from "../shared/ObsidianIcon";
import { useMarkdown } from "../../hooks/useMarkdown";

interface LinkedSourcePreviewProps {
	entry: TimelineIndexItem;
	language: TimelineLanguage;
	onOpenSource: (item: TimelineIndexItem) => void;
}

interface LinkedSourcePreviewState {
	status: "loading" | "ready" | "empty" | "missing";
	sourcePath: string;
	markdown: string;
}

const MAX_PREVIEW_CHARS = 700;
const MAX_PREVIEW_LINES = 14;
const MAX_CACHED_PREVIEWS = 100;

interface PreviewCacheSlot {
	mtime: number;
	markdown: Promise<string>;
}

const previewCache = new WeakMap<App, Map<string, PreviewCacheSlot>>();

export const LinkedSourcePreview: React.FC<LinkedSourcePreviewProps> = ({
	entry,
	language,
	onOpenSource,
}) => {
	const { app } = usePlugin();
	const previewRootRef = useRef<HTMLDivElement>(null);
	const [isNearViewport, setIsNearViewport] = useState(
		() => !("IntersectionObserver" in window),
	);
	const [preview, setPreview] = useState<LinkedSourcePreviewState>({
		status: "loading",
		sourcePath: entry.sourceContext?.path ?? entry.sourcePath,
		markdown: "",
	});
	const sourceContext = entry.sourceContext;
	const sourcePath = sourceContext?.path ?? "";
	const linktext = sourceContext?.linktext ?? "";
	const hasSourceContext = Boolean(sourceContext);
	const markdownRef = useMarkdown({
		markdown: preview.status === "ready" ? preview.markdown : "",
		sourcePath: preview.sourcePath,
	});

	useEffect(() => {
		const root = previewRootRef.current;
		if (!root) return;
		if (isNearViewport) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((candidate) => candidate.isIntersecting)) {
					setIsNearViewport(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "300px 0px" },
		);
		observer.observe(root);
		return () => observer.disconnect();
	}, [isNearViewport]);

	useEffect(() => {
		let cancelled = false;

		async function loadPreview(): Promise<void> {
			if (!hasSourceContext || !isNearViewport) return;

			setPreview({
				status: "loading",
				sourcePath,
				markdown: "",
			});

			const file = resolveSourceFile(app, sourcePath, linktext);
			if (!(file instanceof TFile) || file.extension !== "md") {
				if (!cancelled) {
					setPreview({
						status: "missing",
						sourcePath,
						markdown: "",
					});
				}
				return;
			}

			const markdown = await getCachedSourcePreview(app, file);
			if (cancelled) return;

			setPreview({
				status: markdown ? "ready" : "empty",
				sourcePath: file.path,
				markdown,
			});
		}

		void loadPreview().catch((error: unknown) => {
			if (!cancelled) {
				setPreview({
					status: "missing",
					sourcePath,
					markdown: "",
				});
			}
			console.error("Unable to load linked source preview", error);
		});

		return () => {
			cancelled = true;
		};
	}, [app, hasSourceContext, isNearViewport, sourcePath, linktext]);

	if (!sourceContext) {
		return null;
	}

	const label = getSourceContextLabel(sourceContext);

	return (
		<div ref={previewRootRef} className="pt-linked-source-preview">
			<button
				type="button"
				className="pt-linked-source-preview-header"
				aria-label={`Open ${label}`}
				onClick={() => onOpenSource(entry)}
			>
				<ObsidianIcon iconId="file-text" />
				<span className="pt-linked-source-preview-title">{label}</span>
				<span className="pt-linked-source-preview-meta">
					{t(language, "timeline.linkedSourcePreview")}
				</span>
			</button>
			{preview.status === "ready" && (
				<div
					ref={markdownRef}
					className="pt-linked-source-preview-body markdown-rendered"
				/>
			)}
			{preview.status === "empty" && (
				<div className="pt-linked-source-preview-note">
					{t(language, "timeline.linkedSourceEmpty")}
				</div>
			)}
			{preview.status === "missing" && (
				<div className="pt-linked-source-preview-note">
					{t(language, "timeline.linkedSourceMissing")}
				</div>
			)}
		</div>
	);
};

function resolveSourceFile(app: App, path: string, linktext: string): TFile | null {
	const fileByPath = app.vault.getAbstractFileByPath(path);
	if (fileByPath instanceof TFile) {
		return fileByPath;
	}

	return app.metadataCache.getFirstLinkpathDest(linktext, "") ?? null;
}

function createSourcePreview(markdown: string): string {
	const withoutFrontmatter = markdown
		.replace(/^---\n[\s\S]*?\n---\n?/, "")
		.replace(/<!--\s*timeline-entry\s*[\s\S]*?\s*-->/g, "")
		.trim();

	if (!withoutFrontmatter) {
		return "";
	}

	const lines = withoutFrontmatter.split("\n").slice(0, MAX_PREVIEW_LINES);
	const linePreview = lines.join("\n").trim();
	const truncated =
		withoutFrontmatter.split("\n").length > MAX_PREVIEW_LINES
			? `${linePreview}\n...`
			: linePreview;

	if (truncated.length <= MAX_PREVIEW_CHARS) {
		return truncated;
	}

	const clipped = truncated.slice(0, MAX_PREVIEW_CHARS).trimEnd();
	const lastLineBreak = clipped.lastIndexOf("\n");
	if (lastLineBreak > MAX_PREVIEW_CHARS * 0.55) {
		return `${clipped.slice(0, lastLineBreak).trimEnd()}\n...`;
	}

	const lastSpace = clipped.lastIndexOf(" ");
	if (lastSpace > MAX_PREVIEW_CHARS * 0.55) {
		return `${clipped.slice(0, lastSpace).trimEnd()}...`;
	}

	return `${clipped}...`;
}

async function getCachedSourcePreview(app: App, file: TFile): Promise<string> {
	let appCache = previewCache.get(app);
	if (!appCache) {
		appCache = new Map<string, PreviewCacheSlot>();
		previewCache.set(app, appCache);
	}

	const cached = appCache.get(file.path);
	if (cached?.mtime === file.stat.mtime) {
		return cached.markdown;
	}

	const markdown = app.vault.cachedRead(file).then(createSourcePreview);
	appCache.set(file.path, { mtime: file.stat.mtime, markdown });
	if (appCache.size > MAX_CACHED_PREVIEWS) {
		const oldestPath = Array.from(appCache.keys())[0];
		if (typeof oldestPath === "string") {
			appCache.delete(oldestPath);
		}
	}
	try {
		return await markdown;
	} catch (error) {
		if (appCache.get(file.path)?.markdown === markdown) {
			appCache.delete(file.path);
		}
		throw error;
	}
}
