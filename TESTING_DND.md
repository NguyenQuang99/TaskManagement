# Kanban drag & drop — manual test checklist

Áp dụng cho board `/kanban` (React + @dnd-kit + `useKanbanDnD`).

**Chuẩn bị:** đăng nhập, mở DevTools → tab **Network** (lọc Firestore/API `updateTask` nếu có). Ghi nhận vị trí ban đầu của 1–2 task trước mỗi case.

---

## Checklist (10 case)

- [ ] **1. Same column — reorder**  
  Kéo task trong cùng một cột (vd. Todo), thả lên task khác trong cột đó.  
  **Kỳ vọng:** thứ tự UI đổi; chỉ task trong cột đó có `order` đổi được persist (không persist cả 4 cột).

- [ ] **2. Cross column — drop on task**  
  Kéo task từ cột A sang cột B, thả lên một task trong B.  
  **Kỳ vọng:** task nằm đúng cột B; tối thiểu task được kéo được `updateTask` (`columnId` + `order`); không lỗi console.

- [ ] **3. Cross column — drop on column / empty zone**  
  Kéo task sang cột trống hoặc vùng “No tasks yet” (empty drop zone).  
  **Kỳ vọng:** task xuất hiện cuối cột (hoặc vị trí hợp lệ); persist tương tự case 2.

- [ ] **4. Cancel — thả ngoài board (`over === null`)**  
  Kéo task sang cột khác (preview overlay), thả ra ngoài vùng board/cột.  
  **Kỳ vọng:** UI **về đúng** vị trí snapshot lúc bắt đầu kéo; **không** gọi persist; không “Maximum update depth”.

- [ ] **5. Cancel — phím Esc (`onDragCancel`)**  
  Bắt đầu kéo, nhấn **Esc**.  
  **Kỳ vọng:** board rollback về snapshot; `activeId` clear; không persist.

- [ ] **6. Drop không đổi vị trí**  
  Kéo task rồi thả lại đúng chỗ (hoặc thả vào vùng không đổi index/cột).  
  **Kỳ vọng:** không có request `updateTask` (delta rỗng).

- [ ] **7. DragOver không mutate list (ổn định khi kéo)**  
  Trong lúc kéo cross-column, quan sát list Sortable: task gốc vẫn ở cột cũ (mờ), card theo chuột qua **DragOverlay**; không crash khi di chuyển qua nhiều cột.  
  **Kỳ vọng:** không lỗi depth; chỉ khi **thả** mới đổi layout cột.

- [ ] **8. Nhiều task cùng cột — reorder ảnh hưởng order lân cận**  
  Cột có ≥3 task: kéo task giữa lên/xuống.  
  **Kỳ vọng:** mọi task trong cột có **index** đổi so với snapshot đều được persist (không chỉ một task nếu index khác thay đổi).

- [ ] **9. Persist fail (mock)**  
  Tạm thời làm fail `updateTask` (vd. comment mock trong `usePersistKanbanMutation` / chặn network / Firestore rules). Thả task hợp lệ vào cột khác.  
  **Kỳ vọng:** UI rollback snapshot; `refreshBoardTasks()` chạy; console có log lỗi; sau khi bỏ mock, drag vẫn hoạt động.

- [ ] **10. Persist success — snapshot mới**  
  Sau drag thành công, kéo lại task đó rồi **thả ngoài board**.  
  **Kỳ vọng:** rollback về vị trí **sau lần drag thành công** (không về vị trí từ lúc load trang lần đầu).

---

## Ghi chú nhanh

| Triệu chứng | Hướng kiểm tra |
|-------------|----------------|
| Maximum update depth | `handleDragOver` không được `setTasksByColumn` khi đang kéo |
| Thả ngoài vẫn lệch cột | `dragSnapshotRef` + restore khi `!over` |
| Quá nhiều `updateTask` | Chỉ delta từ `getKanbanDragPersistUpdates(snapshot, next)` |

**File liên quan:** `src/hooks/useKanbanDnD.js`, `src/hooks/useTaskMutations.js`
