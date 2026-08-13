# Kế hoạch tối ưu hiệu năng Dayline

## Mục tiêu

- Giữ thời gian tải plugin ổn định khi thư mục Dayline có nhiều năm dữ liệu.
- Không quét index hoặc render lại timeline khi file không liên quan thay đổi.
- Không chạy migration toàn bộ dữ liệu khi người dùng chỉ đổi setting giao diện.
- Giữ sidebar và Reading view phản hồi tốt trên desktop lẫn mobile.
- Mọi tối ưu phải giữ nguyên định dạng Markdown hiện tại và không làm mất dữ liệu.

## Thứ tự thực hiện

Thực hiện lần lượt từ P0 đến P2. Không bắt đầu P1 trước khi các mục P0 đã có kiểm tra hồi quy và được test thủ công trong Obsidian.

## P0 — Bắt buộc làm trước

### 1. Tách lưu setting khỏi rebuild và migration

Vấn đề hiện tại: `saveSettings()` tạo lại service, rebuild index hai lần, cập nhật frontmatter của mọi day-file và refresh UI cho mọi loại thay đổi setting.

File chính:

- `src/main.ts`
- `src/settings/SettingsTab.ts`
- `src/storage/timelineRepository.ts`

Việc phải làm:

- [x] Tạo hàm chỉ lưu dữ liệu, ví dụ `persistSettings()`, chỉ gọi `saveData()`.
- [x] Phân loại setting theo tác động:
  - UI-only: màu, ngôn ngữ, calendar, Markdown rendering, source preview và Reading view mode.
  - Index/storage path: timeline folder và file organization.
  - Frontmatter: property enrichment, Daily notes mode và property key.
  - Rewrite Markdown: `writeTagsAsObsidianTags`.
- [x] Setting UI-only chỉ lưu và refresh view; không rebuild index, không cập nhật toàn bộ frontmatter.
- [x] Setting ảnh hưởng index chỉ tạo lại service và rebuild đúng một lần.
- [x] Setting frontmatter chỉ chạy `refreshAllDayProperties()` khi giá trị thực sự thay đổi.
- [x] Rewrite entry Markdown chỉ chạy một lần, sau đó refresh index một lần.
- [x] Debounce text input và color picker; không chạy tác vụ nặng theo từng phím hoặc từng bước kéo màu.
- [x] Chặn các lần lưu setting chạy chồng nhau bằng queue hoặc mutex đơn giản.

Tiêu chí hoàn thành:

- Đổi màu không tạo bất kỳ lượt đọc day-file nào.
- Nhập timeline folder không khởi động nhiều rebuild đồng thời.
- Mỗi thay đổi storage hợp lệ chỉ có tối đa một full rebuild.
- Tắt/bật property enrichment chỉ có tối đa một lượt cập nhật toàn bộ properties.

### 2. Chỉ xử lý vault event liên quan đến Dayline

Vấn đề hiện tại: sửa hoặc xóa file bất kỳ trong vault có thể refresh UI hoặc full rebuild timeline.

File chính:

- `src/main.ts`
- `src/index/TimelineIndexService.ts`
- `src/storage/timelinePaths.ts` hoặc một helper path dùng chung

Việc phải làm:

- [x] Tạo helper chuẩn hóa và kiểm tra file có thuộc timeline folder hay không.
- [x] `create` và `modify`: return sớm nếu không phải Markdown file trong timeline folder.
- [x] `delete`: không full rebuild nếu path không thuộc timeline folder.
- [x] `rename`: chỉ cập nhật index khi old path hoặc new path thuộc timeline folder.
- [x] Bổ sung API xóa cache theo file/path mà không quét lại toàn bộ thư mục.
- [x] Gộp nhiều event liên tiếp theo path và chỉ refresh timeline view một lần cho mỗi batch.
- [x] Chọn một nguồn điều phối refresh sau mutation; tránh vừa refresh chủ động vừa refresh lại qua vault event.

Tiêu chí hoàn thành:

- Chỉnh sửa 100 lần một note ngoài Dayline không làm revision của timeline view thay đổi.
- Xóa file ngoài Dayline không gọi `timelineIndex.rebuild()`.
- Create/edit/delete một entry chỉ parse lại day-file liên quan và chỉ render view một lần.
- Rename file hoặc folder Dayline không để lại item cũ trong index.

### 3. Loại bỏ đọc/parse lặp trong Reading view

Vấn đề hiện tại: Markdown post-processor có thể đọc và parse toàn bộ day-file cho mỗi section được Obsidian render.

File chính:

- `src/reading/renderTimelineMetadata.ts`
- `src/main.ts`

Việc phải làm:

- [x] Dùng `ctx.getSectionInfo()` để giới hạn xử lý vào section hiện tại khi có thể.
- [x] Cache kết quả parse theo `file.path` và `file.stat.mtime`.
- [x] Chia sẻ một promise đọc/parse cho mọi post-processor của cùng `file.path` và `mtime`.
- [x] Invalidate cache khi timeline file bị modify, rename hoặc delete.
- [x] Bảo đảm mỗi metadata element chỉ được tạo một lần và listener gắn với DOM được thu hồi cùng section.

Tiêu chí hoàn thành:

- Mở Reading view của một day-file chỉ đọc file tối đa một lần cho cùng một `mtime`.
- Số lượt parse không tăng theo số section Obsidian render.
- Đổi Reading view mode không rebuild timeline index.

## P1 — Làm ngay sau P0

### 4. Không chặn plugin startup bằng full index rebuild

File chính:

- `src/main.ts`
- `src/index/TimelineIndexService.ts`
- `src/views/TimelineView.tsx`

Việc phải làm:

- [x] Đăng ký view, command và listener trước khi xây full index.
- [x] Bắt đầu index sau `workspace.onLayoutReady()` hoặc khi timeline được mở lần đầu.
- [x] Có trạng thái `idle/loading/ready/error` để UI hiển thị loading ngắn gọn.
- [x] Đọc file theo batch có giới hạn concurrency; không dùng `Promise.all()` không giới hạn.
- [x] Cho phép bỏ kết quả của rebuild cũ và chạy lại khi setting folder thay đổi.

Tiêu chí hoàn thành:

- `onload()` không đợi đọc toàn bộ timeline folder.
- Command và ribbon sẵn sàng ngay cả khi index đang xây.
- Không có hai full rebuild chạy đồng thời.

### 5. Cache snapshot của index và giảm render React

File chính:

- `src/index/TimelineIndex.ts`
- `src/index/TimelineIndexService.ts`
- `src/hooks/useTimelineData.ts`
- `src/hooks/useTags.ts`
- `src/components/TimelineRoot.tsx`
- `src/components/timeline/TimelineList.tsx`

Việc phải làm:

- [x] Chỉ sort index khi dữ liệu thay đổi; `getAll()` trả snapshot ổn định giữa hai revision.
- [x] Cache available tags theo index revision.
- [x] Không sort lại danh sách nếu index đã có đúng thứ tự.
- [x] Loại bỏ `uiRevision` khỏi selector timeline vì state React đã đủ kích hoạt render.
- [x] Debounce search input 150 ms.
- [x] Dùng `React.memo`/Preact memo cho entry và timeline list.
- [x] Giới hạn 200 entry mỗi lần và cung cấp action tải thêm khi chọn khoảng lớn/`all`.

Tiêu chí hoàn thành:

- Gõ trong composer không gọi lại `TimelineIndex.getAll()` hoặc tính lại available tags.
- Gõ search không render toàn danh sách ở mỗi key event.
- Chế độ `all` với 2.000 entry không tạo 2.000 Markdown renderer cùng lúc.

### 6. Lazy-load source preview và attachment

File chính:

- `src/components/timeline/LinkedSourcePreview.tsx`
- `src/components/timeline/TimelineAttachments.tsx`
- `src/views/timeline/render/renderTimelineEntryAttachments.ts`

Việc phải làm:

- [x] Chỉ tải linked-source preview khi entry cách viewport tối đa khoảng 300 px.
- [x] Cache preview theo source path và `mtime`; giới hạn cache tối đa 100 source.
- [x] Không reload mọi preview chỉ vì timeline `refreshRevision` tăng.
- [x] Đặt `loading="lazy"` và `decoding="async"` cho image.
- [x] Đặt audio `preload="none"`.
- [x] Giải phóng object URL, recorder track và DOM preview resource khi component đóng.

Tiêu chí hoàn thành:

- Entry ngoài viewport không đọc source note và không tải image/audio.
- Một source note được nhiều entry liên kết chỉ bị đọc một lần cho cùng `mtime`.

## P2 — Củng cố và duy trì

### 7. Thêm test và benchmark hồi quy

File dự kiến:

- `package.json`
- `src/**/*.test.ts`
- `tests/performance/**`

Việc phải làm:

- [x] Thêm Vitest ở dev dependency và script `npm test`.
- [x] Unit test path matching cho file/folder Dayline.
- [x] Unit test phân loại và thực thi tác động của settings.
- [x] Test incremental refresh/remove và batch vault-event của index.
- [x] Test cache invalidation theo path và `mtime`.
- [x] Benchmark parser bằng fixture 100, 500 và 2.000 entry.
- [ ] Ghi số đo startup, refresh và render trước/sau tối ưu.

Ngưỡng mục tiêu ban đầu:

- Thay đổi file ngoài Dayline: 0 lần parse timeline, 0 lần refresh timeline.
- Thay đổi một day-file: chỉ đọc/parse file đó một lần trong một batch event.
- Tác vụ UI-only setting: không đọc vault.
- Embedded `dayline` block tiếp tục giới hạn tối đa 100 item.

### 8. Dọn kiến trúc sau khi hiệu năng ổn định

File chính:

- `src/main.ts`
- `src/storage/timelineRepository.ts`
- `src/settings/SettingsTab.ts`
- `src/views/timeline/render/**`

Việc phải làm:

- [x] Giảm `main.ts` xuống khoảng 230 dòng; tách commands và workspace integrations ra module riêng.
- [x] Tách settings effects và hàng đợi áp dụng settings thành service riêng.
- [x] Tách vault-event batching/index refresh thành `TimelineEventCoordinator`.
- [x] Xóa ba renderer DOM không còn reachable sau React migration.
- [x] Giữ renderer attachment dùng chung vì React timeline vẫn sử dụng.
- [ ] Hoàn tất manual test desktop/mobile trong Obsidian.

## Kết quả benchmark tự động

Đo bằng `npm run benchmark` trên Node 24.5.0 ngày 2026-08-13. Đây là baseline để phát hiện hồi quy parser; số đo UI/startup thực tế vẫn cần lấy trong Obsidian.

| Dữ liệu | Parse trung bình | Throughput xấp xỉ |
|---|---:|---:|
| 100 entry | 0,090 ms | 11.098 lần/giây |
| 500 entry | 0,424 ms | 2.359 lần/giây |
| 2.000 entry | 1,698 ms | 589 lần/giây |

## Trình tự triển khai đề xuất

1. Viết test cho path matching và settings effect classification.
2. Hoàn thành P0.1: tách settings save/migration.
3. Hoàn thành P0.2: lọc và gộp vault events.
4. Hoàn thành P0.3: cache Reading view.
5. Đo lại bằng vault test nhỏ và lớn; sửa hồi quy trước khi tiếp tục.
6. Triển khai lazy startup và cơ chế chống rebuild chồng nhau.
7. Cache index snapshot, tối ưu selectors và giới hạn render.
8. Lazy-load preview/attachment.
9. Dọn kiến trúc và hoàn tất manual validation trong OpenSpec.

## Checklist phát hành

- [x] `npm run lint` pass.
- [x] TypeScript type-check pass.
- [x] 15 test tự động pass.
- [x] `npm run build` tạo production bundle thành công.
- [ ] Không có listener, timer, React root, Markdown component hoặc media track bị leak sau reload/unload.
- [ ] Test Obsidian desktop với timeline nhỏ và lớn.
- [ ] Test Obsidian mobile hoặc thiết bị cấu hình thấp nếu có thể.
- [ ] Kiểm tra create/edit/delete/duplicate, source link, Reading view và embedded `dayline` block.
- [ ] Kiểm tra user-owned frontmatter không bị thay đổi.
- [ ] Cập nhật OpenSpec tasks sau khi manual validation hoàn tất.
