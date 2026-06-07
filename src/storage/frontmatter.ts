import { TFile } from "obsidian";

import type { ParsedTimelineEntry, TimelineSourceContext } from "../models/TimelineEntry";
import type { TimelinePluginSettings } from "../models/TimelineSettings";
import { buildSourceContextLink } from "../utils/sourceContext";

const REQUIRED_MANAGED_KEYS = ["entry_count", "updated_at"];
const OPTIONAL_MANAGED_KEYS = [
	"dayline_tags",
	"dayline_sources",
	"dayline_attachment_count",
	"dayline_image_count",
	"dayline_audio_count",
	"dayline_file_count",
	"dayline_last_entry_at",
];

export async function updateTimelineFrontmatter(
	file: TFile,
	entries: ParsedTimelineEntry[],
	updatedAt: string,
	settings: TimelinePluginSettings,
): Promise<void> {
	await file.vault.process(file, (content) => {
		if (!content.startsWith("---\n")) {
			return content;
		}

		const frontmatterEnd = content.indexOf("\n---\n", 4);
		if (frontmatterEnd === -1) {
			return content;
		}

		const frontmatter = content.slice(4, frontmatterEnd);
		const body = content.slice(frontmatterEnd + 5);
		const date = getFrontmatterValue(frontmatter, "date");
		const nextFrontmatter = applyManagedFrontmatter(
			frontmatter,
			buildManagedFrontmatterValues(entries, updatedAt, settings, date),
			getManagedKeys(settings),
		);

		return `---\n${nextFrontmatter}\n---\n${body}`;
	});
}

type FrontmatterValue = string | number | string[];

function buildManagedFrontmatterValues(
	entries: ParsedTimelineEntry[],
	updatedAt: string,
	settings: TimelinePluginSettings,
	date: string,
): Record<string, FrontmatterValue | null> {
	const values: Record<string, FrontmatterValue | null> = {
		entry_count: entries.length,
		updated_at: updatedAt,
	};

	if (!settings.propertyEnrichmentEnabled) {
		return values;
	}

	const tags = uniqueSorted(entries.flatMap((entry) => entry.meta.tags));
	const sources = uniqueSorted(
		entries
			.map((entry) => entry.meta.sourceContext)
			.filter((context): context is TimelineSourceContext => Boolean(context))
			.map((context) => buildSourceContextLink(context)),
	);
	const attachmentCounts = entries.flatMap((entry) => entry.meta.attachments).reduce(
		(counts, attachment) => {
			counts.total += 1;
			if (attachment.type === "image") counts.image += 1;
			if (attachment.type === "audio") counts.audio += 1;
			if (attachment.type === "file") counts.file += 1;
			return counts;
		},
		{ total: 0, image: 0, audio: 0, file: 0 },
	);
	const lastEntryAt = entries
		.map((entry) => entry.meta.createdAt)
		.sort((left, right) => right.localeCompare(left))[0] ?? "";

	values.dayline_tags = tags.length > 0 ? tags : null;
	values.dayline_sources = sources.length > 0 ? sources : null;
	values.dayline_attachment_count = attachmentCounts.total;
	values.dayline_image_count = attachmentCounts.image;
	values.dayline_audio_count = attachmentCounts.audio;
	values.dayline_file_count = attachmentCounts.file;
	values.dayline_last_entry_at = lastEntryAt || null;

	if (settings.dailyNotesMode === "link" && date) {
		values[getDailyNotePropertyKey(settings)] = `[[${date}]]`;
	}

	return values;
}

function applyManagedFrontmatter(
	frontmatter: string,
	values: Record<string, FrontmatterValue | null>,
	managedKeys: string[],
): string {
	let nextFrontmatter = frontmatter;
	for (const key of managedKeys) {
		nextFrontmatter = removeFrontmatterKey(nextFrontmatter, key);
	}

	const lines = nextFrontmatter.trimEnd().split("\n").filter((line) => line.length > 0);
	for (const [key, value] of Object.entries(values)) {
		if (value === null) {
			continue;
		}

		lines.push(...serializeFrontmatterValue(key, value));
	}

	return lines.join("\n");
}

function removeFrontmatterKey(frontmatter: string, key: string): string {
	const lines = frontmatter.split("\n");
	const output: string[] = [];
	let skipping = false;

	for (const line of lines) {
		const startsKey = new RegExp(`^${escapeRegExp(key)}\\s*:`).test(line);
		if (startsKey) {
			skipping = true;
			continue;
		}

		if (skipping) {
			const isContinuation = /^\s+/.test(line) || /^\s*-\s+/.test(line);
			if (isContinuation) {
				continue;
			}

			skipping = false;
		}

		output.push(line);
	}

	return output.join("\n");
}

function serializeFrontmatterValue(key: string, value: FrontmatterValue): string[] {
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return [];
		}

		return [`${key}:`, ...value.map((item) => `  - ${quoteYamlString(item)}`)];
	}

	return [`${key}: ${value}`];
}

function getManagedKeys(settings: TimelinePluginSettings): string[] {
	return [
		...REQUIRED_MANAGED_KEYS,
		...OPTIONAL_MANAGED_KEYS,
		getDailyNotePropertyKey(settings),
	];
}

function getDailyNotePropertyKey(settings: TimelinePluginSettings): string {
	return sanitizeFrontmatterKey(settings.dailyNoteLinkProperty || "daily_note");
}

function getFrontmatterValue(frontmatter: string, key: string): string {
	const pattern = new RegExp(`^${escapeRegExp(key)}\\s*:\\s*(.*?)\\s*$`, "m");
	return pattern.exec(frontmatter)?.[1]?.trim() ?? "";
}

function uniqueSorted(values: string[]): string[] {
	return Array.from(new Set(values.map((value) => value.replace(/^#/, "").trim()).filter(Boolean)))
		.sort((left, right) => left.localeCompare(right));
}

function quoteYamlString(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

function sanitizeFrontmatterKey(value: string): string {
	return value
		.trim()
		.replace(/[^A-Za-z0-9_-]+/g, "_")
		.replace(/^_+|_+$/g, "") || "daily_note";
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
