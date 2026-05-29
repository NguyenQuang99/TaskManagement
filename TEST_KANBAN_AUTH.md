# TEST_KANBAN_AUTH — Auth, Kanban, filters

Checklist thủ công sau các thay đổi auth cache, drag/drop, loading và filter.

**Chuẩn bị:** dev server chạy (`npm run dev`), `.env` Firebase hợp lệ, ít nhất **2 tài khoản** (user A, user B), DevTools → tab **Network** (tùy chọn).

---

## 8 bước

- [ ] **1. Login email**  
  Mở `/`, nhập email + password hợp lệ → **Login**.  
  **Kỳ vọng:** chuyển tới board (thường `/kanban`); không lỗi console; profile/header có thông tin user.

- [ ] **2. Login Google (nếu có)**  
  Đăng xuất (hoặc dùng trình duyệt ẩn danh). Tại `/`, bấm nút **Sign in with Google** (nếu provider đã bật trên Firebase).  
  **Kỳ vọng:** popup Google thành công → vào app; nếu chưa cấu hình Google thì ghi chú *N/A* và bỏ qua.

- [ ] **3. Vào `/kanban`**  
  Truy cập trực tiếp `/kanban` (đã đăng nhập).  
  **Kỳ vọng:** skeleton pulse trong từng cột lúc load; sau đó task thật hoặc “No tasks yet.”; badge số task (không kẹt `—` mãi). Nếu load lỗi → banner đỏ + **Retry** (không phải hint filter).

- [ ] **4. Drag task**  
  Kéo 1 task sang cột khác (hoặc reorder trong cột) và thả **trong** vùng cột.  
  **Kỳ vọng:** vị trí UI đúng; persist (Network có `updateTask` / tương đương, không persist cả 4 cột); không “Maximum update depth”.

- [ ] **5. Cancel drag**  
  Bắt đầu kéo task, thả **ra ngoài** board (hoặc nhấn **Esc**).  
  **Kỳ vọng:** task về đúng vị trí trước khi kéo; không gọi persist; không crash.

- [ ] **6. Logout**  
  Menu user → **Logout** → xác nhận.  
  **Kỳ vọng:** về `/` (login); không còn dữ liệu user trên UI protected.

- [ ] **7. Login user khác (cùng tab)**  
  Đăng nhập **user B** (không đóng tab). Vào `/kanban`.  
  **Kỳ vọng:** **không flash** task/profile của user A; board chỉ data của B (hoặc trống nếu B chưa có task).

- [ ] **8. Filter assignee + search `?q=`**  
  - **Assignee:** mở Custom filters → **Assigned to** → chọn 1 user (hoặc Unassigned).  
    **Kỳ vọng:** cột chỉ còn task khớp; cột có task gốc nhưng bị lọc hết → **“No tasks match filters”** (amber), không nhầm lỗi load.  
  - **Search:** thêm query URL `?q=` + từ khóa (vd. `/kanban?q=hello`) hoặc ô search header nếu đồng bộ `q`.  
    **Kỳ vọng:** chỉ task khớp title/description; cột trống do search → “No tasks match filters”; xóa `q` / bỏ filter → board trở lại đầy đủ.

---

## Ghi chú nhanh

| Triệu chứng | Xem |
|-------------|-----|
| Flash task user cũ | `authQueryCache`, query key kanban theo `uid`, reset `tasksByColumn` |
| Drag crash / depth | không `setState` trong `dragOver` |
| Banner đỏ | `kanbanInitialLoadFailed` + Retry |
| “No tasks match filters” | filter/search, không phải load fail |

**Tài liệu liên quan:** `TESTING_DND.md`
