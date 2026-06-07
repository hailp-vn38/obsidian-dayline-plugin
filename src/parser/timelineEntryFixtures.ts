export const LEGACY_TIMELINE_ENTRY_FIXTURE = `## 08:15 ^tl-20260607-081500-a3f9

<!-- timeline-entry
{
  "schemaVersion": 1,
  "id": "tl-20260607-081500-a3f9",
  "type": "checkin",
  "date": "2026-06-07",
  "time": "08:15",
  "createdAt": "2026-06-07T08:15:00.000Z",
  "updatedAt": "2026-06-07T08:15:00.000Z",
  "tags": ["work"],
  "source": "manual",
  "attachments": []
}
-->

Legacy entry without source context.
`;

export const SOURCE_LINKED_TIMELINE_ENTRY_FIXTURE = `## 09:30 ^tl-20260607-093000-b4c1

<!-- timeline-entry
{
  "schemaVersion": 1,
  "id": "tl-20260607-093000-b4c1",
  "type": "checkin",
  "date": "2026-06-07",
  "time": "09:30",
  "createdAt": "2026-06-07T09:30:00.000Z",
  "updatedAt": "2026-06-07T09:30:00.000Z",
  "tags": ["project"],
  "source": "quick-capture",
  "sourceContext": {
    "type": "selection",
    "path": "Projects/App redesign.md",
    "linktext": "Projects/App redesign",
    "subpath": "#Meeting notes",
    "display": "App redesign",
    "capturedAt": "2026-06-07T09:30:00.000Z"
  },
  "attachments": []
}
-->

Context: [[Projects/App redesign#Meeting notes|App redesign]]

Selected note text.
`;
