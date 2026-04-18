# 🚀 CP Helper - Trợ thủ đắc lực cho Lập trình thi đấu

**CP Helper** là một nền tảng Web đa nhiệm "Tất cả trong một" được thiết kế đặc biệt dành cho sinh viên IT và cộng đồng Lập trình thi đấu. Dự án giúp trực quan hóa các thuật toán đồ thị phức tạp, cung cấp môi trường soạn thảo mã nguồn chuyên nghiệp và đặc biệt là hệ thống tự động sinh test đối chứng để dò tìm lỗi logic.

Dự án được thực hiện trong khuôn khổ môn **Thực tập cơ sở** tại Học viện Công nghệ Bưu chính Viễn thông (PTIT).

---

## ✨ Các tính năng cốt lõi

### 1. 🕸️ Trực quan hóa thuật toán (Algorithm Visualizer)
Thay vì mô phỏng trên ma trận lưới đơn điệu, phân hệ này hỗ trợ mô phỏng không gian Đồ thị Đỉnh - Cạnh chuyên sâu:
* **Khởi tạo linh hoạt:** Dựng đồ thị trực tiếp từ **Danh sách cạnh**, hỗ trợ cả đồ thị có trọng số.
* **Bố cục thông minh & Kéo thả:** Tự động sắp xếp các đỉnh theo dạng lưới toán học, kết hợp với độ lệch ngẫu nhiên để chống việc các cạnh đè lên nhau. Hỗ trợ thao tác kéo thả siêu mượt để người dùng tự do căn chỉnh hình dáng đồ thị.
* **Hiệu ứng mô phỏng:** Trình diễn từng bước duyệt của thuật toán **BFS**, **DFS** và **Dijkstra** với hiệu ứng loang màu và tự động làm nổi bật đường đi ngắn nhất. Tích hợp 3 tùy chọn tốc độ (Nhanh, Thường, Chậm).

### 2. 💻 Môi trường lập trình trực tuyến (Online IDE)
Môi trường gõ code chuyên nghiệp ngay trên trình duyệt mà không cần cài đặt phần mềm:
* **Trình soạn thảo mạnh mẽ:** Tích hợp lõi soạn thảo của Visual Studio Code (Monaco Editor), mang lại trải nghiệm gõ phím đỉnh cao, tự động tô màu cú pháp cho **C++, Java, Python**.
* **Giao diện co giãn tự do:** Hệ thống vách ngăn cho phép người dùng tự do kéo thả để thay đổi tỷ lệ diện tích giữa khung gõ Mã nguồn, Dữ liệu vào (Input) và Dữ liệu ra (Output).
* **Xử lý lỗi thông minh:** Hệ thống bắt lỗi biên dịch và hiển thị thông qua Cửa sổ nổi (Pop-up) rộng rãi, tối ưu trải nghiệm người dùng thay vì in dòng chữ báo lỗi nhỏ xíu ra bảng điều khiển.

### 3. 🐞 Hệ thống Sinh test đối chứng tự động (Stress Tester)
"Vũ khí" tối thượng giúp bắt gọn các lỗi Tràn số nguyên hay Sai logic thuật toán:
* **Cơ chế 3 trụ cột:** Chạy đồng thời 3 đoạn mã: `Trình sinh dữ liệu ngẫu nhiên` -> `Thuật toán trâu (chạy chậm nhưng chuẩn)` -> `Thuật toán tối ưu (cần kiểm tra)`.
* **Luồng kiểm thử tự động:** So sánh Kết quả dự kiến và Kết quả thực tế. Tự động dừng vòng lặp và in ra chi tiết Bộ test (Test case) ngay khi phát hiện `KẾT QUẢ SAI`.
* **An toàn & Kiểm soát:** Tích hợp nút **Dừng khẩn cấp** để ngắt luồng. Máy chủ tự động chặn các đoạn mã bị lặp vô hạn (Quá thời gian thực thi - TLE) sau 5 giây.

---

## 🛠️ Kiến trúc & Công nghệ

Dự án áp dụng triết lý **Mã nguồn sạch**, tách biệt rõ ràng các phân hệ và nói không với các bộ khung (Framework) thiết kế web cồng kềnh nhằm tối ưu hóa tốc độ tải trang.

* **Giao diện (Frontend):**
  * HTML5, CSS3 (Tùy chỉnh thanh cuộn, Bố cục Flexbox linh hoạt).
  * JavaScript thuần (Xử lý logic thuật toán, Hiệu ứng chuyển động, và Kết nối API).
  * Thư viện nhúng: Lõi Monaco Editor (qua mạng phân phối nội dung CDN), Bộ biểu tượng FontAwesome.
* **Máy chủ thực thi cục bộ (Backend):**
  * **Python / Flask API:** Đóng vai trò máy chủ tiếp nhận mã nguồn.
  * **Cơ chế Hộp cát an toàn (Sandboxing):** Sử dụng các thư viện hệ thống (`subprocess` & `tempfile`) để tự động cấp phát thư mục ảo khi biên dịch mã nguồn, và dọn sạch rác bộ nhớ ngay sau khi chạy xong.

---

## ⚙️ Hướng dẫn Cài đặt & Chạy dự án

Vì hệ thống hiện tại đã sở hữu một Máy chủ nội bộ cực kỳ mạnh mẽ để thực thi mã nguồn an toàn, bạn cần làm theo các bước sau để khởi chạy:

### Yêu cầu hệ thống:
* Đã cài đặt phần mềm **Python 3.x** trên máy.
* Cài đặt các trình biên dịch tương ứng nếu muốn test code: `g++` (dành cho C++), `JDK` (dành cho Java).

### Các bước khởi chạy:

1. **Tải mã nguồn về máy (Clone):**
    git clone https://github.com/LonggVuz/cp-helper.git
    cd cp-helper

2. **Cài đặt thư viện cho Máy chủ:**
    Mở cửa sổ lệnh (Terminal/CMD) và chạy dòng sau để cài đặt (chỉ cần làm 1 lần):
    pip install flask flask-cors

3. **Khởi động Máy chủ Thực thi (Backend):**
    python app.py
    *(Đảm bảo cửa sổ lệnh thông báo Máy chủ đang chạy ở địa chỉ http://127.0.0.1:5000)*

4. **Mở Giao diện Web (Frontend):**
    Bạn có thể nhấp đúp trực tiếp vào file `index.html` để mở bằng trình duyệt web, hoặc sử dụng tiện ích **Live Server** trên VS Code để có trải nghiệm tốt nhất.

---

## 👨‍💻 Thành viên phát triển

* **Vũ Đình Long** (B23DCAT175)
* **Nguyễn Hữu Trường** (B23DCVT424)
* **Đỗ Minh Tuấn** (B23DCVT436)
