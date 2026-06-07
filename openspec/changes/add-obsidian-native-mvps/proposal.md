## Why

Dayline đã lưu entry dưới dạng Markdown cục bộ và có timeline ở sidebar, nhưng entry vẫn còn khá tách biệt khỏi phần còn lại của vault. Bước tiếp theo là biến Dayline entry thành nội dung Obsidian đúng nghĩa bằng cách tận dụng internal links, context menu của editor/file explorer, Markdown post-processing, note properties, Daily notes và metadata thân thiện với Bases.

## What Changes

- Thêm check-in gắn ngữ cảnh để capture current note, selected text, heading hoặc block context và lưu vào metadata của entry.
- Ghi một wikilink thật vào nội dung linked entry để Backlinks, Graph view, Page preview và cơ chế rename link của Obsidian có thể hoạt động tự nhiên.
- Thêm context menu trong editor và file explorer để tạo Dayline entry từ current note, selected text hoặc selected file.
- Thêm UI cho linked entry trong timeline, gồm source-note chip, filter theo source note và action mở source.
- Thêm fenced code block `dayline` để render timeline đã lọc ngay trong Markdown reading view của bất kỳ note nào.
- Thêm properties cho Dayline day file và tùy chọn đồng bộ với Daily notes để timeline file có thể query bằng Obsidian Bases.
- Giữ toàn bộ tính năng local-first và vault-only. Không thêm network call, cloud service, telemetry hoặc runtime dependency bên ngoài.

## Capabilities

### New Capabilities

- `context-linked-check-ins`: Capture Dayline entry từ ngữ cảnh note/editor/file của Obsidian và liên kết ngược về nội dung nguồn trong vault.
- `embedded-timeline-queries`: Render timeline đã lọc từ fenced `dayline` code block trong Markdown reading view.
- `timeline-day-properties`: Duy trì properties thân thiện với Bases/Daily notes trên Dayline day file và đảm bảo hành vi migration an toàn.

### Modified Capabilities

- None.

## Impact

- `src/main.ts`: Register thêm commands, editor/file context menu handlers và Markdown code block processor.
- `src/models/TimelineEntry.ts`: Mở rộng entry metadata và index item với optional source context.
- `src/storage/timelineRepository.ts`: Nhận source context khi tạo draft và persist vào metadata lẫn Markdown content.
- `src/index/TimelineIndexService.ts`: Index source context để filter và render.
- `src/components/**`: Thêm source chip, source filter và reusable timeline rendering khi phù hợp.
- `src/reading/**`: Thêm renderer cho `dayline` code block mà không phá behavior metadata reading-view hiện tại.
- `src/settings/**`: Thêm settings cho cách ghi source link, Daily notes behavior và property migration.
- `README.md`: Document storage format, Obsidian integrations, privacy behavior và ví dụ sử dụng.
- Dự kiến không cần thêm external dependency.
