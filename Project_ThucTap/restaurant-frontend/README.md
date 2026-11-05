# Frontend: Hệ thống quản lý nhà hàng (Nhóm 6)

Frontend sử dụng HTML, CSS và JavaScript thuần, không cần npm hoặc build.

## Trang hiện có

- Trang chủ: kiểm tra kết nối Frontend → Backend → MySQL.
- Trang Chi nhánh: ví dụ CRUD nội bộ.
- Trang Khách đặt bàn: `pages/customer/booking.html`.

## Module khách đặt bàn

Trang đặt bàn hỗ trợ:
- Chọn chi nhánh đang hoạt động.
- Chọn ngày, giờ và số lượng khách.
- Kiểm tra bàn phù hợp trước khi gửi yêu cầu.
- Gửi thông tin liên hệ và ghi chú.
- Hiển thị mã đặt bàn sau khi tạo thành công.
- Tra cứu hoặc hủy đặt bàn bằng mã đặt bàn và số điện thoại.

Frontend gọi API qua `js/api.js`; địa chỉ backend cấu hình tại `js/config.js`.

## Cách chạy

1. Chạy backend và MySQL theo README trong thư mục restaurant-backend.
2. Mở terminal tại thư mục frontend.
3. Chạy:

```bash
python -m http.server 5500
```

4. Mở http://127.0.0.1:5500.
5. Chọn menu **Đặt bàn**.

Có thể dùng VS Code Live Server thay cho Python HTTP server. Không nên mở file HTML trực tiếp bằng đường dẫn file:// vì trình duyệt có thể hạn chế request API.
