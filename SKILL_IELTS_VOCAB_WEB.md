# 📘 BÍ KÍP & TÀI LIỆU HƯỚNG DẪN: XÂY DỰNG WEB HỌC TỪ VỰNG CHUYÊN NGHIỆP (IELTS VOCAB MASTER SKILL)

Tài liệu này lưu lại toàn bộ **kiến trúc, công nghệ và Prompt mẫu (Prompt Skill)** để bạn có thể tái tạo hoặc áp dụng cho bất kỳ chủ đề từ vựng / giáo trình nào khác trong tương lai.

---

## 🚀 1. Cách Lưu Lại & Sử Dụng Ứng Dụng Này

### A. Sử dụng trực tiếp trên Điện thoại / Laptop
- **Link chia sẻ (Shared Web URL):**  
  `https://ais-pre-rjyphkkw33tbywqbwlpw2n-194677328848.asia-southeast1.run.app`
- Bạn có thể **Bookmark (Lưu dấu trang)** link trên hoặc chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** trên điện thoại (Safari / Chrome) để mở học như một ứng dụng di động thực thụ.

### B. Tải mã nguồn về máy tính (Export Code)
- Bạn có thể tải toàn bộ mã nguồn dự án qua nút **Export** / **Download ZIP** hoặc kết nối với **GitHub** ở góc giao diện Google AI Studio.
- Chạy dự án ở máy cá nhân:
  ```bash
  npm install
  npm run dev
  ```

---

## 🎯 2. Prompt Mẫu Chuẩn (Copy để dùng cho các dự án sau)

Khi bạn muốn AI Studio xây dựng một web học từ vựng mới (cho Topic khác như Business, Medical, TOEIC, HSK,...), bạn chỉ cần copy đoạn Prompt sau:

```text
Hãy xây dựng một Web App học từ vựng chuyên sâu chuẩn học thuật, thiết kế giao diện hiện đại, tinh tế với các tính năng sau:
1. Trình bày dữ liệu chuẩn theo định dạng bảng song ngữ (Từ vựng, Loại từ, Phiên âm IPA, Nghĩa tiếng Việt, Từ đồng nghĩa/Trái nghĩa có dịch nghĩa tiếng Việt, Ví dụ thực tế).
2. Tích hợp bộ lọc từ thông minh: Lọc theo Thứ trong tuần (Mon - Sun, Tổng hợp), lọc theo loại từ, tìm kiếm tức thì, lọc từ Có sao ★ / Đang học / Đã thuộc.
3. Chức năng Che cột thông minh (Study Mask): Có thanh công cụ che cột Từ, Nghĩa, Đồng/Trái nghĩa, Câu ví dụ để người học tự kiểm tra; khi rê chuột hoặc chạm nhẹ vào ô thì từ sẽ hiện ra tức thì.
4. Highlight và ghi chú trực tiếp: Người dùng có thể bôi đen chữ để đổi màu highlight, in đậm, gạch chân ngay tại ô từ vựng; đồng thời tự động đồng bộ từ đó vào "Sổ Tay" trên thanh menu.
5. Phát âm Audio TTS chuẩn: Tích hợp phát âm tiếng Anh chuẩn cho mọi từ, cụm từ, từ đồng nghĩa và câu ví dụ, hỗ trợ chọn giọng US/UK và chỉnh tốc độ đọc (0.7x - 1.3x).
6. Đa chế độ luyện tập:
   - Chế độ Bảng chuẩn PDF (kèm nút xem file gốc).
   - Chế độ Thẻ ghi nhớ (Flashcard 3D).
   - Chế độ Trắc nghiệm (Quiz trắc nghiệm 4 đáp án có giải thích).
   - Chế độ Mini-game Nối từ siêu tốc (Word Match).
7. Hệ thống Giao diện đa sắc màu dễ thương (Cute Theme Skins):
   - Cho phép đổi giữa các tông màu: Hồng Hoa Anh Đào (Sakura), Tím Lavender, Trà Sữa Matcha, Cam Đào Mật Ong, Xanh Biển Đại Dương, Xanh Ngọc Học Thuật.
   - Hỗ trợ Chế độ Sáng / Tối (Light & Dark mode).
   - Hỗ trợ Chế độ Dọc (Mobile view) và Chế độ Ngang (Laptop/Desktop).
8. Trợ lý học tập Corgi hoạt hình (Gamification): Tính điểm kinh nghiệm EXP, thăng cấp từ Hạt Mầm lên Bậc Thầy khi thuộc từ, kèm các câu động viên đáng yêu và hiệu ứng thả tim.
9. Nút khôi phục / Reset: Cho phép người dùng đặt lại tiến độ học tập hoặc khôi phục cài đặt gốc ban đầu bất cứ lúc nào.
```

---

## 🏗️ 3. Kiến Trúc Kỹ Thuật Đã Triển Khai (Dành cho Lập Trình Viên)

| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Framework** | React 19 + TypeScript + Vite | Hiệu năng cao, tải trang tức thì, bảo mật kiểu dữ liệu |
| **Styling** | Tailwind CSS v4 + CSS Custom Properties | Hệ thống giao diện đa màu sắc (`[data-theme]`), Dark Mode |
| **Icons** | Lucide React | Bộ icon hiện đại, nhẹ và đồng bộ |
| **Âm thanh** | Web Speech API (TTS) & Web Audio API | Đọc từ vựng đa giọng (US/UK) + âm thanh chime khi tương tác |
| **Lưu trữ** | LocalStorage Engine | Tự động ghi nhớ tiến độ, sao đánh dấu, highlight và ghi chú offline |
| **In ấn** | Print Media CSS (`@media print`) | Hỗ trợ in đề học tập gọn gàng, tự ẩn thanh công cụ |

---

## 💡 4. Cách Tùy Biến Thêm Dữ Liệu Từ Vựng
- Mọi dữ liệu từ vựng nằm tại thư mục `/src/data/`:
  - `topic1Environment.ts`: Từ vựng Chủ đề Môi trường (Environment).
  - `topic2Education.ts`: Từ vựng Chủ đề Giáo dục (Education).
  - `allVocab.ts`: Tập hợp danh sách và các hàm lọc từ.
- Khi muốn bổ sung từ mới, chỉ cần thêm một object chuẩn vào danh sách tương ứng:
  ```typescript
  {
    id: 'env-mon-01',
    word: 'biodiversity',
    type: 'n',
    phonetic: '/ˌbaɪ.oʊ.daɪˈvɜːr.sə.ti/',
    meaningVi: 'sự đa dạng sinh học',
    synonyms: [{ word: 'ecological diversity', meaningVi: 'sự đa dạng sinh thái' }],
    antonyms: [],
    example: 'Preserving biodiversity is crucial for our planet.',
    day: 'mon',
    topic: 'environment',
    tableType: 'academic'
  }
  ```
