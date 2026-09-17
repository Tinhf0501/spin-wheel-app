# Spin Wheel

Ứng dụng vòng quay ngẫu nhiên chạy trực tiếp trên trình duyệt, giúp chọn nhanh một phương án với xác suất được chia đều.

## Tính năng

- Tạo, chỉnh sửa, xóa và sắp xếp từ 2 đến 12 lựa chọn.
- Chọn kết quả ngẫu nhiên công bằng bằng Web Crypto API khi trình duyệt hỗ trợ.
- Animation giảm tốc, confetti và toast thông báo kết quả.
- Lưu danh sách, kết quả gần đây và giao diện sáng/tối trên trình duyệt.
- Hiển thị ngày, giờ và tooltip đầy đủ cho kết quả có tên dài.
- Giao diện responsive cho desktop và mobile.
- Panel tùy chỉnh dạng bottom sheet trên màn hình nhỏ.
- Popup xác nhận cho các thao tác xóa dữ liệu.
- Nút cuộn lên đầu trang trên nội dung dài.
- Hỗ trợ bàn phím, trình đọc màn hình và `prefers-reduced-motion`.
- Không sử dụng framework hoặc thư viện JavaScript bên ngoài.

## Cách sử dụng

1. Nhập tên lựa chọn và nhấn **Thêm** hoặc phím `Enter`.
2. Sửa tên, thay đổi thứ tự hoặc xóa lựa chọn trong phần **Tùy chỉnh**.
3. Thêm ít nhất 2 lựa chọn rồi nhấn **Quay**.
4. Xem kết quả trên vòng quay, toast và mục **Kết quả quay gần đây**.

Trên mobile và tablet, nhấn nút **Tùy chỉnh · số lượng** để mở danh sách lựa chọn.
Khi giao diện chuyển thành một cột, kết quả quay gần đây được đặt ngay dưới vòng quay; trên desktop, phần này nằm trong cột tùy chỉnh bên phải.

## Giới hạn

- Tối thiểu 2 và tối đa 12 lựa chọn.
- Mỗi tên dài tối đa 42 ký tự.
- Giao diện vòng quay có thể rút gọn tên dài bằng dấu `…`; nội dung gốc vẫn được giữ nguyên.
- Lưu tối đa 8 kết quả gần nhất và hiển thị 5 kết quả trên giao diện.

## Lưu trữ dữ liệu

Dữ liệu chỉ được lưu trong `localStorage` của trình duyệt hiện tại và không được gửi lên server.

| Key | Nội dung |
| --- | --- |
| `spin-wheel-options-v2` | Danh sách lựa chọn |
| `spin-wheel-history-v2` | Kết quả quay gần đây |
| `spin-wheel-theme-v2` | Theme sáng hoặc tối |

Dữ liệu có thể mất khi người dùng xóa dữ liệu website, sử dụng chế độ ẩn danh hoặc chuyển sang trình duyệt/thiết bị khác.

## Chạy dự án

Có thể mở trực tiếp `index.html`, hoặc chạy static server trong thư mục dự án:

```bash
python3 -m http.server 8080
```

Sau đó truy cập [http://localhost:8080](http://localhost:8080).

## Cấu trúc dự án

```text
spin-wheel-app/
├── index.html   # Cấu trúc giao diện và các dialog
├── style.css    # Theme, responsive layout và animation
├── script.js    # State, vòng quay, lưu trữ và tương tác
└── README.md
```

## Công nghệ

- HTML5 và native `<dialog>`.
- CSS3, Canvas 2D và responsive design.
- Vanilla JavaScript.
- Web Crypto API và Web Storage API.
- Google Fonts cho DM Sans và Manrope; khi không có mạng, giao diện dùng system font.

## Trình duyệt

Khuyến nghị sử dụng phiên bản mới của Chrome, Edge, Firefox hoặc Safari. Trình duyệt cần hỗ trợ Canvas, `localStorage`, CSS custom properties và native `<dialog>`.

## Kiểm tra trước khi phát hành

- Thử luồng thêm, sửa, xóa và quay với 2–12 lựa chọn.
- Kiểm tra Chrome Android và Safari iPhone, bao gồm bàn phím ảo và xoay màn hình.
- Kiểm tra theme sáng/tối và chế độ giảm chuyển động.
- Xác nhận dữ liệu vẫn tồn tại sau khi refresh.
- Kiểm tra dialog tùy chỉnh, popup xác nhận, toast và tooltip.
