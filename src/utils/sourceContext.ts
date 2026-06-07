import type { App, Editor, TFile } from "obsidian";

import type { TimelineSourceContext, TimelineSourceContextType } from "../models/TimelineEntry";
import { toIsoString } from "./date";

interface CreateSourceContextOptions {
	app: App;
	file: TFile;
	type: TimelineSourceContextType;
	subpath?: string;
	capturedAt?: Date;
}

export function createSourceContext({
	app,
	file,
	type,
	subpath,
	capturedAt = new Date(),
}: CreateSourceContextOptions): TimelineSourceContext {
	return {
		type,
		path: file.path,
		linktext: app.metadataCache.fileToLinktext(file, "", false),
		subpath,
		display: file.basename,
		capturedAt: toIsoString(capturedAt),
	};
}

export function createSourceContextFromView(
	app: App,
	view: { file: TFile | null } | null,
	editor?: Editor,
	type: TimelineSourceContextType = "note",
): TimelineSourceContext | null {
	const file = view?.file;
	if (!file) {
		return null;
	}

	return createSourceContext({
		app,
		file,
		type,
		subpath: editor ? findNearestHeadingSubpath(editor) : undefined,
	});
}

export function buildSourceContextLink(context: TimelineSourceContext): string {
	const target = `${context.linktext}${context.subpath ?? ""}`;
	const display = context.display?.trim();
	return display ? `[[${target}|${display}]]` : `[[${target}]]`;
}

export function buildSourceContextLine(context: TimelineSourceContext): string {
	return `Context: ${buildSourceContextLink(context)}`;
}

export function getSourceContextTarget(context: TimelineSourceContext): string {
	return `${context.linktext}${context.subpath ?? ""}`;
}

export function getSourceContextLabel(context: TimelineSourceContext): string {
	return context.display?.trim() || context.linktext;
}

export function isValidTimelineSourceContext(value: unknown): value is TimelineSourceContext {
	if (!value || typeof value !== "object") {
		return false;
	}

	const context = value as Partial<TimelineSourceContext>;
	return (
		(context.type === "note" ||
			context.type === "selection" ||
			context.type === "file") &&
		typeof context.path === "string" &&
		context.path.length > 0 &&
		typeof context.linktext === "string" &&
		context.linktext.length > 0 &&
		typeof context.capturedAt === "string" &&
		(context.subpath === undefined || typeof context.subpath === "string") &&
		(context.display === undefined || typeof context.display === "string")
	);
}

function findNearestHeadingSubpath(editor: Editor): string | undefined {
	const cursor = editor.getCursor();
	for (let lineNumber = cursor.line; lineNumber >= 0; lineNumber--) {
		const line = editor.getLine(lineNumber).trim();
		const match = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
		const headingText = match?.[2]?.trim();
		if (headingText) {
			return `#${headingText}`;
		}
	}

	return undefined;
}
