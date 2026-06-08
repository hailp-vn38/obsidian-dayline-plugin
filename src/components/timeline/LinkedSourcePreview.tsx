import React, { useEffect, useState } from "react";
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
	refreshRevision: number;
	onOpenSource: (item: TimelineIndexItem) => void;
}

interface LinkedSourcePreviewState {
	status: "loading" | "ready" | "empty" | "missing";
	sourcePath: string;
	markdown: string;
}

const MAX_PREVIEW_CHARS = 700;
const MAX_PREVIEW_LINES = 14;

export const LinkedSourcePreview: React.FC<LinkedSourcePreviewProps> = ({
	entry,
	language,
	refreshRevision,
	onOpenSource,
}) => {
	const { app } = usePlugin();
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
		let cancelled = false;

		async function loadPreview(): Promise<void> {
			if (!hasSourceContext) return;

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

			const markdown = createSourcePreview(await app.vault.cachedRead(file));
			if (cancelled) return;

			setPreview({
				status: markdown ? "ready" : "empty",
				sourcePath: file.path,
				markdown,
			});
		}

		void loadPreview();

		return () => {
			cancelled = true;
		};
	}, [app, hasSourceContext, sourcePath, linktext, refreshRevision]);

	if (!sourceContext) {
		return null;
	}

	const label = getSourceContextLabel(sourceContext);

	return (
		<div className="pt-linked-source-preview">
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
