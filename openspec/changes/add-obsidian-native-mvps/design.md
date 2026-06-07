## Context

Dayline hiện có các nền tảng phù hợp để mở rộng theo hướng Obsidian-native:

- Plugin lifecycle, commands, ribbon icon và custom `ItemView` được đăng ký trong `src/main.ts`.
- Entry được lưu trong daily Markdown file dưới dạng heading có block ID và hidden JSON metadata.
- Timeline index đọc toàn bộ entry từ vault và đã hỗ trợ filter/search/tag.
- Reading view hiện đã dùng Markdown post processor để hiển thị metadata timeline.
- Command `create-quick-check-in-from-selection` đã lấy selected text, nhưng chưa lưu quan hệ với source note.

Ba MVP trong change này cùng theo một nguyên tắc: Dayline phải lưu dữ liệu trong vault bằng Markdown/metadata dễ đọc, và phải để Obsidian core features hiểu được càng nhiều càng tốt. Metadata ẩn phục vụ Dayline UI; wikilink thật phục vụ Obsidian Backlinks, Graph view, Page preview, rename link handling và người dùng đọc file thô.

## Goals / Non-Goals

**Goals:**

- MVP 1: Tạo check-in gắn với current note/selection/file và hiển thị được liên kết nguồn trong timeline.
- MVP 2: Cho phép nhúng timeline đã lọc vào note bằng fenced code block `dayline`.
- MVP 3: Làm Dayline day file thân thiện hơn với Properties, Daily notes và Bases.
- Giữ plugin local-first, offline, mobile-compatible ở mức không dùng Node/Electron API mới.
- Không thêm external dependency nếu có thể triển khai bằng Obsidian API và React hiện có.
- Không phá entry cũ; entry không có source context vẫn phải parse, index, render, edit, duplicate, delete bình thường.

**Non-Goals:**

- Không xây AI summarization, cloud sync, telemetry hoặc external capture service.
- Không thay thế Daily notes core plugin; chỉ tích hợp bằng cấu trúc file/properties/link.
- Không build query language phức tạp như Dataview; `dayline` block chỉ hỗ trợ bộ filter nhỏ, rõ ràng.
- Không migrate toàn bộ storage format sang một schema mới không tương thích.
- Không triển khai entry templates trong change này; có thể làm sau khi linked check-ins ổn định.

## Decisions

### 1. Source context lưu trong metadata và wikilink thật

Thêm optional `source`-style context vào `TimelineEntryMeta`, ví dụ:

```ts
interface TimelineSourceContext {
	type: "note" | "selection" | "file";
	path: string;
	linktext: string;
	subpath?: string;
	display?: string;
	selectedText?: string;
	capturedAt: string;
}
```

`source` hiện đang là `"manual" | "quick-capture" | "imported"`, nên không nên tái sử dụng tên đó cho object mới. Tên đề xuất: `context` hoặc `sourceContext`; nên chọn `sourceContext` để rõ nghĩa và tránh breaking change.

Entry Markdown khi có source context sẽ có một dòng wikilink thật, ví dụ:

```md
Context: [[Projects/App redesign#Meeting notes|App redesign]]
```

Rationale:

- Metadata ẩn giúp Dayline filter nhanh và render chip ổn định.
- Wikilink thật giúp Obsidian nhận ra link bằng cơ chế native.
- Nếu Obsidian tự cập nhật wikilink khi rename, Dayline vẫn có thể resolve lại path bằng metadata cache khi cần.

Alternative considered: chỉ lưu source trong JSON metadata. Cách này đơn giản hơn nhưng Graph/Backlinks không thấy quan hệ, làm mất điểm Obsidian-native quan trọng nhất.

### 2. Capture context qua commands và context menu

Thêm các entry point:

- Command: `create-linked-check-in`
- Editor command: `create-linked-check-in-from-selection`
- Editor context menu item: `Add selection to Dayline`
- File menu item: `Add file to Dayline`

Tất cả entry point gọi chung một service/helper, ví dụ `captureSourceContext(app, editor?, view?, file?)`, rồi mở composer/modal với `initialContent` và `sourceContext`.

Rationale:

- Context capture là logic Obsidian-specific, không nên nhúng sâu vào React component.
- Composer chỉ nên nhận draft state đã chuẩn hóa.
- Context menu giúp workflow tự nhiên hơn command palette khi đang viết note.

Alternative considered: chỉ thêm command palette. Cách này dễ hơn nhưng bỏ lỡ File Explorer và editor menu, là hai bề mặt Obsidian người dùng dùng thường xuyên.

### 3. Index mở rộng nhưng không quét ngoài timeline folder

`TimelineIndexService` chỉ đọc timeline Markdown files như hiện tại. Khi parse entry, index thêm:

- `sourcePath?: string`
- `sourceLinktext?: string`
- `sourceSubpath?: string`
- `sourceDisplay?: string`
- `hasSourceContext: boolean`

Không quét toàn vault để tìm backlinks ngược trong MVP 1. Filter `current note` dùng active file path và metadata đã index.

Rationale:

- Giữ startup nhẹ.
- Tránh coupling với metadataCache resolvedLinks/unresolvedLinks cho MVP đầu.
- Entry cũ không có source context vẫn index được.

Alternative considered: dùng `metadataCache.resolvedLinks` để suy ra source links từ Markdown body. Cách này mạnh hơn nhưng phức tạp và có timing risk khi cache chưa resolved.

### 4. Timeline UI thêm source chip và filter current note

Trong React timeline:

- `TimelineEntry` hiển thị chip nguồn nếu `item.sourceContext` tồn tại.
- Click chip mở source note bằng `workspace.openLinkText`.
- Toolbar/filter thêm mode `source: current note` hoặc button nhỏ trong header khi active file tồn tại.
- Entry menu thêm `Open linked source` khi có source context.

Rationale:

- Source context là thông tin của entry, hiển thị gần tags/attachments là tự nhiên.
- Filter current note biến Dayline thành activity log theo note/project.

Alternative considered: tạo view riêng cho source-linked entries. Không cần thiết cho MVP và sẽ làm phân mảnh UI.

### 5. Embedded `dayline` code block dùng parser nhỏ, không dùng eval

Thêm `registerMarkdownCodeBlockProcessor("dayline", ...)` để render query block:

````md
```dayline
source: current
tag: work
date: this-week
limit: 10
```
````

Parser chỉ nhận key/value đơn giản:

- `source`: `current`, vault path, hoặc wikilink text
- `tag`: một tag không có `#`
- `date`: `today`, `yesterday`, `this-week`, `all`, hoặc `YYYY-MM-DD..YYYY-MM-DD`
- `limit`: số nguyên trong khoảng cấu hình an toàn, mặc định 20
- `attachments`: `any`, `image`, `audio`, `file`, `none`

Không hỗ trợ JavaScript expression, regex tùy ý, nested query, sort expression hoặc eval.

Renderer có thể dùng React component `TimelineEmbedRoot` hoặc DOM renderer nhẹ. Nếu dùng React, mount root trong code block và unmount bằng child lifecycle của Markdown post processor để tránh leak.

Rationale:

- Người dùng Obsidian quen nhúng dynamic block trong note.
- Query format nhỏ đủ cho MVP và dễ test.
- Không dùng eval giúp giảm risk bảo mật và policy review.

Alternative considered: dùng Dataview-style syntax. Không cần thiết, dễ tăng scope và có thể tạo kỳ vọng quá lớn.

### 6. Day-file properties phục vụ Bases/Daily notes, không biến mỗi entry thành một file

Dayline hiện lưu nhiều entry trong một day file. MVP 3 giữ model đó và tăng chất lượng frontmatter:

```yaml
---
type: timeline-day
date: 2026-06-07
timeline_version: 1
entry_count: 4
dayline_tags:
  - work
  - idea
dayline_sources:
  - "[[Projects/App redesign]]"
dayline_attachment_count: 2
dayline_last_entry_at: 2026-06-07T14:21:00.000Z
---
```

Optional setting:

- `dailyNotesMode`: `off | link | mirror-folder`
- `dailyNoteLinkProperty`: default `daily_note`

Rationale:

- Bases query theo file-level properties, nên day file properties là mức tích hợp tự nhiên nhất.
- Không tạo một file cho mỗi entry, tránh thay đổi storage model lớn.
- Daily notes liên kết theo date/property, không cần phụ thuộc vào core plugin API riêng.

Alternative considered: tạo shadow note riêng cho mỗi entry để Bases query từng entry. Cách này mạnh hơn nhưng tạo quá nhiều file, tăng migration complexity và phá tính nhỏ gọn của Dayline.

## Risks / Trade-offs

- Source metadata và wikilink có thể lệch nhau sau rename hoặc edit thủ công → Dùng wikilink thật làm nguồn hiển thị ưu tiên khi có thể, và thêm command “Repair Dayline metadata” ở task sau nếu cần.
- Code block renderer có thể làm reading view chậm nếu query nhiều entry → Giới hạn `limit`, reuse `timelineIndex`, không đọc file trong mỗi render nếu index đã sẵn.
- React root trong Markdown code block có nguy cơ leak nếu không cleanup → Mount qua lifecycle child và unmount rõ ràng.
- Entry cũ không có `sourceContext` → Parser/validator phải coi field này là optional.
- Day-file properties có thể ghi đè property user tự thêm → Chỉ quản lý key có prefix `dayline_` và các key hiện có của Dayline; không động vào key lạ.
- Daily notes folder/template của user rất đa dạng → MVP chỉ tạo link/property, không cố tự động viết vào Daily note trừ khi setting bật rõ ràng.

## Migration Plan

1. Schema metadata vẫn `schemaVersion: 1`; `sourceContext` là optional field để không cần migration bắt buộc.
2. `validateTimelineEntry` chấp nhận entry cũ không có `sourceContext`.
3. Khi edit/duplicate entry, preserve `sourceContext` mặc định; duplicate có thể giữ link nguồn vì vẫn là cùng context.
4. Khi create/update/delete entry, update lại day-file properties bằng dữ liệu parse mới nhất.
5. Thêm setting migration-safe: người dùng có thể tắt property enrichment nếu không muốn Dayline cập nhật thêm frontmatter.
6. README ghi rõ các key frontmatter mà Dayline quản lý.

Rollback:

- Nếu tắt tính năng source context, entry cũ vẫn hiển thị như normal check-in; wikilink trong Markdown vẫn là text hợp lệ.
- Nếu tắt embedded query, fenced code block còn nguyên trong Markdown và không mất dữ liệu.
- Nếu tắt property enrichment, properties hiện có không bị xóa tự động; chỉ ngừng cập nhật.

## Open Questions

- Tên metadata nên là `sourceContext` hay `linkedSource`? Đề xuất `sourceContext`.
- Có nên lưu selected text trong metadata hay chỉ trong content? Đề xuất không lưu thêm trong metadata để tránh duplicate nội dung nhạy cảm; chỉ lưu link/path/subpath.
- Filter current note nên đặt trong toolbar hay header quick action? Đề xuất bắt đầu trong filter panel để scope UI nhỏ.
- `dayline` block có nên render attachments trong MVP không? Đề xuất có setting/query `attachments`, mặc định render giống timeline compact.
