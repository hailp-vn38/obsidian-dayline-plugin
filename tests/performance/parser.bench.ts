import { bench, describe } from "vitest";

import {
	countMalformedTimelineEntryMetas,
	parseTimelineEntries,
} from "../../src/parser/parseTimelineEntries";

for (const entryCount of [100, 500, 2_000]) {
	describe(`${entryCount} timeline entries`, () => {
		const markdown = createTimelineMarkdown(entryCount);

		bench("parse entries", () => {
			parseTimelineEntries(markdown);
		});

		bench("count malformed metadata", () => {
			countMalformedTimelineEntryMetas(markdown);
		});
	});
}

function createTimelineMarkdown(entryCount: number): string {
	const entries = Array.from({ length: entryCount }, (_, index) => {
		const id = `tl-benchmark-${index}`;
		return `## 09:00 ^${id}
<!-- timeline-entry {"schemaVersion":1,"id":"${id}","type":"checkin","date":"2026-08-13","time":"09:00","createdAt":"2026-08-13T02:00:00.000Z","updatedAt":"2026-08-13T02:00:00.000Z","tags":["benchmark"],"source":"manual","attachments":[]} -->
Benchmark entry ${index}`;
	});
	return `---\ntype: timeline-day\n---\n${entries.join("\n\n")}\n`;
}
