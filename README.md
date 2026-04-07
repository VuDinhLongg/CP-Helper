# CP Helper - Algorithm Visualizer & Online IDE

Một nền tảng web đa nhiệm được xây dựng nhằm hỗ trợ cộng đồng Lập trình thi đấu (Competitive Programming) và trực quan hóa các cấu trúc dữ liệu - thuật toán cơ bản. Dự án được thực hiện trong khuôn khổ môn Thực tập cơ sở tại PTIT.

## Tính năng nổi bật

### 1. Trực quan hóa thuật toán (Algorithm Visualizer)
* **Mô phỏng đồ thị:** Hỗ trợ trực quan hóa các thuật toán tìm đường phổ biến như **BFS**, **DFS** và **Dijkstra** trên ma trận lưới.
* **Tương tác kéo thả (Drag & Drop):** Tự do thay đổi vị trí điểm Xuất phát và Đích mượt mà.
* **Thiết lập vật cản:** Click và giữ chuột để vẽ tường (Maze), hoặc sử dụng tính năng "Tạo vật cản ngẫu nhiên" để thử thách thuật toán.
* **Hiệu ứng Animation:** Loang màu theo từng bước duyệt thuật toán và tự động vẽ đường chỉ vàng truy vết đường đi ngắn nhất với 3 chế độ tốc độ (Nhanh, Thường, Chậm).

### 2. Môi trường lập trình trực tuyến (Online IDE)
* **Trình soạn thảo chuyên nghiệp:** Tích hợp lõi **Monaco Editor** (trình soạn thảo mã nguồn của VS Code) mang lại trải nghiệm gõ code mượt mà, hỗ trợ Syntax Highlighting.
* **Đa ngôn ngữ:** Hỗ trợ các ngôn ngữ phổ biến trong Lập trình thi đấu gồm C++, Java và Python.
* **Dark Theme:** Giao diện tối ưu hóa cho lập trình viên, chống mỏi mắt với bố cục CSS Flexbox/Grid co giãn hoàn hảo.

### 3. Hệ thống kiểm thử tự động (Stress Tester) - *Đang phát triển*
* Cung cấp không gian làm việc đa luồng với 3 trình soạn thảo độc lập: Trình sinh test (Generator), Giải pháp Brute-force và Giải pháp Tối ưu (Optimized).
* *Sắp ra mắt: Kết nối Piston API để biên dịch và chấm chéo mã nguồn tự động.*

## Công nghệ sử dụng
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (Không sử dụng Framework để tối ưu hiệu năng).
* **Thư viện bên thứ ba:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) (via CDN).
* **API (Dự kiến):** Piston API (Thực thi mã nguồn từ xa).

## Hướng dẫn cài đặt & Sử dụng
Dự án được phát triển hoàn toàn thuần Frontend, không yêu cầu cài đặt môi trường Backend phức tạp.

1. Clone repository về máy:
   ```bash
   git clone [https://github.com/LonggVuz/cp-helper.git](https://github.com/LonggVuz/cp-helper.git)
