# 🚀 CP Helper - Trợ thủ đắc lực cho Lập trình thi đấu

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?logo=bootstrap&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)
![C/C++](https://img.shields.io/badge/C%2FC%2B%2B-00599C?logo=c%2B%2B&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?logo=openjdk&logoColor=white)

**CP Helper** là một nền tảng Web đa nhiệm "Tất cả trong một" được thiết kế đặc biệt dành cho sinh viên IT và cộng đồng Lập trình thi đấu. Dự án giúp trực quan hóa các thuật toán đồ thị phức tạp, cung cấp môi trường soạn thảo mã nguồn chuyên nghiệp và đặc biệt là hệ thống tự động sinh test đối chứng để dò tìm lỗi logic.

🎓 *Dự án được thực hiện trong khuôn khổ môn **Thực tập cơ sở** tại Học viện Công nghệ Bưu chính Viễn thông (PTIT).*

---

## ✨ Các tính năng nổi bật

### 1. Trực quan hóa thuật toán (Algorithm Visualizer)
Hỗ trợ mô phỏng luồng hoạt động của các thuật toán đồ thị kinh điển (BFS, DFS, Dijkstra) trên không gian hai chiều với cơ chế kéo thả tương tác vật lý trực tiếp.
* **Tự động xử lý ngoại lệ:** Tự động tính toán và điền bù các đỉnh bị thiếu trong danh sách cạnh người dùng nhập vào.
* **Cấu trúc dữ liệu tối ưu:** Tự cài đặt cấu trúc dữ liệu Hàng đợi ưu tiên (`MinHeap`) bằng JavaScript nguyên bản để tối ưu hóa triệt để thuật toán Dijkstra.

![Demo Algorithm Visualizer](static/assets/demo-algo-dark.png)

![Demo Algorithm Visualizer](static/assets/demo-algo-warm.png)

### 2. Môi trường lập trình trực tuyến (Online IDE)
Không gian lập trình tinh gọn, tích hợp trình soạn thảo mã nguồn mở Monaco Editor (nhân lõi của VS Code).
* **Quản lý đa sắc thái (Theme Switching):** Hỗ trợ chuyển đổi mượt mà giữa chế độ Nền tối (Dark Theme) và Nền ấm (Warm Theme) giúp bảo vệ thị lực.
* **Không gian linh hoạt:** Tích hợp hệ thống vách ngăn co giãn (Resizer) cho phép tùy biến tỷ lệ khu vực code và input/output.
* **Cảnh báo lỗi thông minh:** Lỗi biên dịch (Compile Error) được bắt và hiển thị nổi bật thông qua hệ thống Cửa sổ nổi (Pop-up Modal) của Bootstrap.

![Demo Online IDE](static/assets/demo-editor-dark.png)

![Demo Online IDE](static/assets/demo-editor-warm.png)

### 3. Hệ thống Sinh test đối chứng tự động (Stress Tester)
"Vũ khí" giải quyết bài toán Time Limit Exceeded (TLE) và Wrong Answer (WA). Khởi chạy đồng thời 3 luồng mã nguồn: Trình sinh test ngẫu nhiên (Generator), Thuật toán chuẩn (Brute-force) và Thuật toán tối ưu (Optimized).
* **Định danh mã lỗi chi tiết:** Phân tách và bắt chính xác các trạng thái AC, WA, TLE, RTE, CE. Dừng vòng lặp và xuất ngay Hack Case khi phát hiện kết quả sai lệch.
* **Hộp cát đa thư mục (Multi-folder Sandboxing):** Kiến trúc xử lý tiến trình ngầm chia tách thư mục tạm độc lập, giải quyết triệt để rủi ro xung đột bộ nhớ và trùng lặp tên lớp (đặc biệt hiệu quả với ngôn ngữ Java).

![Demo Stress Tester](static/assets/demo-gentest-dark.png)

![Demo Stress Tester](static/assets/demo-gentest-warm.png)

---

## 🛠️ Kiến trúc Công nghệ (Local Client-Server)

Dự án được triển khai theo mô hình Máy chủ cục bộ, tận dụng tài nguyên hệ điều hành để biên dịch mã nguồn an toàn:

* **Giao diện & Tương tác (Frontend):** * HTML5, CSS3, Vanilla JS kết hợp thư viện giao diện **Bootstrap 5.3**.
  * Trực quan hóa đồ họa vector bằng **SVG**.
  * Nhúng lõi soạn thảo **Monaco Editor**.
* **Máy chủ cục bộ (Backend):**
  * Vi khung **Python / Flask API** tiếp nhận yêu cầu biên dịch.
  * Thư viện `subprocess` để điều phối tiến trình biên dịch (g++, javac, python).
  * Thư viện `tempfile` cấp phát và thu hồi vùng nhớ (Sandboxing) tránh tồn đọng rác hệ thống.

---

## ⚙️ Hướng dẫn Cài đặt & Khởi chạy

Vì hệ thống thao tác trực tiếp với các tiến trình gốc của hệ điều hành để biên dịch mã nguồn, bạn cần chạy nền tảng này ở môi trường cục bộ (Localhost).

### Yêu cầu hệ thống:
* Đã cài đặt **Python 3.8+** trên máy.
* Cài đặt sẵn các trình biên dịch tương ứng nếu muốn chạy mã nguồn: `g++` (C/C++), `JDK 11+` (Java).

### Các bước khởi chạy:

**1. Tải mã nguồn về máy:**
```bash
git clone https://github.com/VuDinhLongg/CP-Helper.git

cd CP-Helper
```

**2. Cài đặt thư viện cho Backend:**
```bash
pip install flask flask-cors
```

**3. Khởi động Máy chủ Thực thi:**
```bash
python app.py
```
*(Đảm bảo terminal thông báo Máy chủ đang chạy ở địa chỉ `http://127.0.0.1:5000`)*

**4. Khởi chạy Giao diện:**
Chỉ cần mở tệp `templates/index.html` trực tiếp bằng trình duyệt (Chrome, Edge, Firefox) hoặc chạy thông qua tiện ích Live Server của VS Code.


