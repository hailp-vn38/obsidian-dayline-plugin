# AI code guidelines for Obsidian plugins

Tài liệu này tổng hợp các kinh nghiệm khi dùng AI code để sửa lỗi và cảnh báo trong Obsidian Community Plugin. Mục tiêu là giúp AI tạo thay đổi nhỏ, dễ review, không làm plugin bị từ chối khi submit hoặc release.

## Nguyên tắc chính

AI chỉ nên được dùng như một kỹ sư hỗ trợ, không phải người quyết định cuối cùng. Mỗi thay đổi cần có phạm vi rõ, lý do kỹ thuật rõ, và có kiểm chứng bằng build, lint, scan tĩnh và test trong Obsidian.

Ưu tiên sửa nguyên nhân gốc thay vì che cảnh báo. Với Obsidian plugin, các cảnh báo thường liên quan trực tiếp đến bảo mật, quyền riêng tư, tương thích API, CSS ảnh hưởng theme, hoặc provenance của release assets.

## Quy trình nên dùng khi AI code

1. Đọc ngữ cảnh trước khi sửa.

   Kiểm tra `manifest.json`, `versions.json`, `package.json`, workflow release, cấu trúc `src/`, `styles.css`, và các thay đổi đang có trong `git status`.

2. Chỉ sửa đúng phạm vi.

   Một cảnh báo nên dẫn đến một nhóm thay đổi nhỏ. Tránh để AI refactor rộng hoặc đổi UI không liên quan.

3. Luôn scan source và bundle.

   Một số cảnh báo không xuất hiện trong TypeScript mà xuất hiện trong `main.js` sau khi bundle.

4. Build và lint sau mỗi nhóm thay đổi.

   Tối thiểu chạy:

   ```bash
   npm run build
   npm run lint -- --format stylish
   git diff --check
   ```

5. Test thủ công trong Obsidian.

   CSS, modal, popout window, clipboard, vault access và interaction state không thể xác nhận đủ chỉ bằng lint.

## Security and source code

### Nên làm

- Không dùng dynamic `<script>` injection.
- Không dùng `eval`, `new Function`, remote code loading, hoặc auto-update code ngoài GitHub release.
- Bundle dependency vào `main.js` bằng build pipeline chính thức.
- Scan bundle sau build để chắc không còn pattern nguy hiểm:

  ```bash
  rg -n "createElement\\([\"']script|createEl\\([\"']script|script\\.src|<script|eval\\(|new Function" main.js src
  ```

- Nếu cần network request, phải có lý do tính năng rõ ràng, opt-in nếu gửi dữ liệu nhạy cảm, và mô tả trong README/settings.

### Không nên làm

- Không để AI thêm loader tải code từ CDN.
- Không sửa cảnh báo obfuscation bằng cách đổi tên biến hoặc minify khác đi.
- Không ship code sinh runtime script để "workaround" thư viện.

## ESLint directive comments

### Nên làm

- Directive comment phải có mô tả rõ vì sao cần thiết.
- Disable rule trong phạm vi nhỏ nhất có thể.
- Nếu disable dài hạn, phải có `eslint-enable` tương ứng.
- Ưu tiên sửa code để không cần disable.

Ví dụ tốt:

```ts
/* eslint-disable-next-line react-hooks/immutability -- Draft state is normalized before persistence and React never mutates the stored reference. */
```

### Không nên làm

- Không dùng directive trống như `/* eslint-disable */`.
- Không disable toàn file nếu chỉ có một dòng vi phạm.
- Không disable các rule Obsidian không cho phép, ví dụ `obsidianmd/no-static-styles-assignment`.

## Obsidian API compatibility

### Nên làm

- Giữ `manifest.json.minAppVersion` đúng với API mới nhất mà plugin dùng.
- Cập nhật `versions.json` khi bump version.
- Nếu lint báo `obsidianmd/no-unsupported-api`, chọn một trong hai hướng:
  - Thay API mới bằng API cũ tương thích hơn.
  - Bump `minAppVersion` và ghi rõ trong release.
- Với popout window, dùng `activeDocument`/document phù hợp với context thay vì hard-code global `document`.

### Không nên làm

- Không bump `minAppVersion` chỉ để im cảnh báo nếu plugin không thật sự cần API mới.
- Không dùng API desktop-only nếu `isDesktopOnly` là `false`.
- Không sửa `manifest.json` mà quên `versions.json`.

## CSS review

### Nên làm

- Tránh `!important`. Dùng CSS variables, selector specificity rõ ràng, hoặc class state cụ thể.
- Khi bỏ `!important`, phải test UI vì cascade có thể đổi.
- Scope CSS vào surface của plugin như `.dayline-view-container`, `.pt-checkin-modal`, `.dayline-embed`.
- Dùng CSS variables để gom các giá trị reset:

  ```css
  .dayline-view-container {
    --dayline-reset-background: transparent;
    --dayline-reset-border: 0;
    --dayline-reset-box-shadow: none;
  }
  ```

- Nếu theme hoặc Obsidian core override mạnh hơn, tăng specificity có kiểm soát:

  ```css
  .dayline-view-container.dayline-view-container button.timeline-icon-button {
    border: var(--dayline-reset-border);
    background: var(--dayline-reset-background);
    box-shadow: var(--dayline-reset-box-shadow);
  }
  ```

- Scan CSS trước khi release:

  ```bash
  rg -n "!important|:has\\(|column-gap" styles.css
  ```

### Không nên làm

- Không thay `!important` bằng selector global như `body button`.
- Không dùng `:has()` cho UI plugin nếu có thể thay bằng class state từ TypeScript/React.
- Không dùng browser feature bị Obsidian target hỗ trợ một phần nếu có fallback đơn giản, ví dụ multicolumn.
- Không sửa style bằng `element.style.foo = ...` nếu rule Obsidian không cho phép static style assignment. Dùng class và CSS.

## Vault access

### Nên làm

- Chỉ đọc vùng cần thiết, ví dụ folder timeline đã cấu hình.
- Dùng traversal có giới hạn thay vì `vault.getFiles()` hoặc `getMarkdownFiles()` toàn vault.
- Debounce/throttle khi phản ứng với file events.
- Ghi rõ trong README nếu plugin cần quét file/folder.

### Không nên làm

- Không enumerate toàn bộ vault trong `onload`.
- Không đọc nội dung tất cả Markdown file để tìm dữ liệu nếu có thể giới hạn theo folder hoặc metadata.
- Không lưu file path/nội dung không cần thiết.

## Clipboard access

### Nên làm

- Chỉ đọc/ghi clipboard khi người dùng bấm nút hoặc chạy command rõ ràng.
- Mô tả quyền clipboard trong README.
- Không gửi clipboard content ra ngoài.

### Không nên làm

- Không đọc clipboard khi plugin load.
- Không dùng clipboard như storage tạm.
- Không đọc clipboard trong background listener không có hành động trực tiếp từ người dùng.

## Dependencies

### Nên làm

- Giữ dependency nhỏ và browser-compatible.
- Chạy audit khi Obsidian review báo vulnerability:

  ```bash
  npm audit
  ```

- Update dependency nếu bản vá có sẵn và không làm tăng bundle đáng kể.
- Nếu vulnerability không ảnh hưởng vì code path không dùng, ghi chú rõ trong review/release notes.

### Không nên làm

- Không thêm package lớn cho tác vụ nhỏ.
- Không ship dependency có advisory đã biết nếu có bản vá dễ cập nhật.
- Không import dependency theo cách khiến esbuild không bundle được.

## Release and artifact provenance

### Nên làm

- Release assets cần có:
  - `main.js`
  - `manifest.json`
  - `styles.css` nếu plugin dùng CSS
- Tag release phải khớp version trong `manifest.json`.
- Build release bằng GitHub Actions khi cần artifact attestations.
- Attest release assets bằng workflow, sau đó verify:

  ```bash
  gh attestation verify main.js --repo OWNER/REPO
  gh attestation verify styles.css --repo OWNER/REPO
  gh attestation verify manifest.json --repo OWNER/REPO
  ```

### Không nên làm

- Không attach file build từ máy local nếu mục tiêu là có GitHub artifact attestations.
- Không quên upload từng asset riêng lẻ.
- Không release khi `manifest.json`, `versions.json`, `package.json` lệch version.

## Checklist trước khi nhờ AI sửa lỗi Obsidian review

- Đưa nguyên văn lỗi/cảnh báo cho AI.
- Yêu cầu AI phân loại: blocker, warning, recommendation.
- Yêu cầu AI tìm source location bằng `rg`.
- Yêu cầu AI sửa theo phạm vi nhỏ.
- Yêu cầu AI không revert thay đổi đang có của user.
- Yêu cầu AI chạy build/lint/scan.
- Yêu cầu AI ghi rõ file đã sửa và cảnh báo nào đã xử lý.

Prompt gợi ý:

```text
Hãy xử lý cảnh báo Obsidian này trong phạm vi nhỏ nhất. Trước khi sửa hãy kiểm tra source liên quan, không revert thay đổi khác trong working tree. Sau khi sửa chạy npm run build, npm run lint, git diff --check và scan lại pattern gây cảnh báo. Báo rõ file đã sửa và cảnh báo nào còn lại.
```

## Definition of done

Một thay đổi do AI code chỉ nên coi là xong khi:

- `npm run build` pass.
- `npm run lint` pass.
- `git diff --check` pass.
- Pattern scan cho cảnh báo liên quan sạch.
- Không có thay đổi ngoài phạm vi.
- UI chính đã được test trong Obsidian nếu có sửa CSS hoặc component.
- README/release notes đã mô tả quyền nhạy cảm như vault enumeration, clipboard, network hoặc telemetry.

