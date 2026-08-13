import { describe, expect, it } from "vitest";

import {
	isPathInFolder,
	isTimelineMarkdownPath,
	normalizeVaultPath,
} from "../src/utils/timelinePath";

describe("timeline path helpers", () => {
	it("normalizes separators and surrounding slashes", () => {
		expect(normalizeVaultPath(" /Timeline\\2026//08/ ")).toBe(
			"Timeline/2026/08",
		);
	});

	it("matches the folder itself and descendants without prefix collisions", () => {
		expect(isPathInFolder("Timeline", "Timeline/")).toBe(true);
		expect(isPathInFolder("Timeline/2026/08/13.md", "Timeline")).toBe(true);
		expect(isPathInFolder("Timeline-old/2026.md", "Timeline")).toBe(false);
	});

	it("only accepts Markdown files inside the configured folder", () => {
		expect(isTimelineMarkdownPath("Timeline/2026/08/13.md", "Timeline")).toBe(
			true,
		);
		expect(isTimelineMarkdownPath("Timeline/asset.png", "Timeline")).toBe(false);
		expect(isTimelineMarkdownPath("Notes/13.md", "Timeline")).toBe(false);
	});
});
