# Firestore rules — employee task board

Tài liệu cho `firestore.rules`, `firestore.indexes.json` và cách deploy (`firebase deploy --only firestore`).

---

## Collections

| Path | Mục đích |
|------|----------|
| `Users/{userId}` | Profile (Email, FullName, UserName, avatar, …); `userId` = Auth `uid` |
| `Tasks/{taskId}` | Task Kanban (`columnId`, `title`, `userId`, `order`, `status`, …) |

---

## Rules (tóm tắt)

### `Users/{userId}`

| Thao tác | Điều kiện |
|----------|-----------|
| **read** | `request.auth != null` (mọi user đăng nhập đọc được profile mọi người — phục vụ assignee filter / `getAllUsers`) |
| **create / update / delete** | `request.auth.uid == userId` (chỉ sửa document của chính mình) |

### `Tasks/{taskId}`

| Thao tác | Điều kiện |
|----------|-----------|
| **read** | `request.auth != null` |
| **create** | `request.resource.data.userId == request.auth.uid` |
| **update / delete** | `resource.data.userId == request.auth.uid` **và** `request.resource.data.userId == request.auth.uid` (không đổi owner sang user khác) |

---

## Trade-off: board chung vs owner-only write

### Mô hình hiện tại (đã chọn)

- **Đọc task:** mọi user đã đăng nhập thấy **toàn bộ** task trên board (`getTasksByColumnPage`, filter assignee, search).
- **Ghi task:** chỉ user có `userId` trùng `auth.uid` mới **create / update / delete** được document đó.

Đây là **shared read + owner-only write** (board công ty, quyền sửa theo người được gán task).

### So với board “chỉ thấy task của mình”

| | Shared read (hiện tại) | Owner-only read |
|--|------------------------|-----------------|
| Kanban hiển thị | Task mọi người | Chỉ task `userId == auth.uid` |
| Rule read `Tasks` | `auth != null` | `resource.data.userId == auth.uid` |
| Filter assignee | Có ý nghĩa (lọc trong pool chung) | Gần như trùng “chỉ của tôi” |
| Độ phức tạp query | Giữ nguyên app | Cần `where("userId", "==", uid)` + index |

App hiện tại giả định **board chung**; đổi sang owner-only read phải sửa query + rules + UX filter.

### Hệ quả với Kanban drag & drop

`updateTask` sau drag gửi `columnId`, `order`, `status`, đôi khi `userId`. Rule yêu cầu **task gốc** thuộc về người đang kéo:

- User A **kéo task của A** → persist OK.
- User A **kéo task của B** (vẫn thấy trên board) → Firestore **từ chối** update (`permission-denied`).

Đó là chủ đích của owner-only write: không cho sửa/xóa task người khác qua client. Nếu product cần “manager kéo task mọi người”, phải nới rule (vd. role admin) hoặc Cloud Function — **không** nằm trong rules tối thiểu này.

### `Users` read rộng

Mọi user đăng nhập đọc được `Users/*` để:

- `getAllUsers()` — dropdown assignee, filter chip.
- Hiển thị tên/avatar assignee trên card.

Trade-off: email/tên lộ trong org (thường chấp nhận được nội bộ). Thu hẹp read (chỉ `Users/{ownUid}`) sẽ **gãy** assignee list trừ khi đổi sang API/claim khác.

---

## Composite index (`firestore.indexes.json`)

Query trong `getTasksByColumnPage`:

```text
where("columnId", "==", columnId)
orderBy(documentId())   // __name__
limit(n)
startAfter(cursor)      // phân trang
```

Firestore cần composite index:

- `columnId` ASC  
- `__name__` ASC  

File `firestore.indexes.json` khai báo sẵn. Sau deploy, nếu console báo thiếu index, link trong lỗi cũng có thể tạo cùng cấu hình.

Query `getTasksByColumn` (chỉ `where columnId`, không `orderBy`) thường dùng index đơn tự động; không bắt buộc thêm entry trong file indexes.

---

## Deploy

```bash
firebase login
firebase use <project-id>
firebase deploy --only firestore
```

Chỉ rules:

```bash
firebase deploy --only firestore:rules
```

Chỉ indexes:

```bash
firebase deploy --only firestore:indexes
```

---

## Kiểm tra nhanh (manual)

1. Đăng nhập user A → đọc `/kanban`, thấy task (read OK).
2. Tạo task gán `userId` = A → create OK.
3. User B sửa document task của A (DevTools / script) → **denied**.
4. User A kéo task của A → `updateTask` OK (nếu payload vẫn giữ `userId` = A).
5. Phân trang cột Todo → không lỗi “requires an index” sau khi deploy indexes.

**Liên quan:** `TEST_KANBAN_AUTH.md`, `TESTING_DND.md`
