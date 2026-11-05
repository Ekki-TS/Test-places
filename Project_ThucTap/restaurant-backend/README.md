# Backend: Hệ thống quản lý nhà hàng (Nhóm 6)

Backend dùng FastAPI, SQLAlchemy và MySQL. Cấu hình đọc từ file .env.

## Module đã triển khai

- CRUD chi nhánh: `/api/branches`.
- Module khách đặt bàn: `/api/reservations`.
- Các model khách hàng, bàn ăn và đặt bàn được ánh xạ từ các bảng đã khai báo trong `sql/init.sql`.
- Tài liệu API: http://127.0.0.1:8000/docs.

## API khách đặt bàn

| Method | URL | Chức năng |
|---|---|---|
| GET | `/api/reservations/branches` | Danh sách chi nhánh đang hoạt động |
| GET | `/api/reservations/availability?branch_id=1&reserved_at=2026-11-10T19:00:00&party_size=2` | Kiểm tra bàn phù hợp |
| POST | `/api/reservations` | Tạo yêu cầu đặt bàn |
| POST | `/api/reservations/lookup` | Tra cứu bằng mã đặt bàn và số điện thoại |
| POST | `/api/reservations/cancel` | Hủy đặt bàn bằng mã và số điện thoại |

Body tạo đặt bàn:

```json
{
  "branch_id": 1,
  "guest_name": "Nguyen Van A",
  "guest_phone": "0901234567",
  "email": "a@example.com",
  "party_size": 2,
  "reserved_at": "2026-11-10T19:00:00",
  "note": "Cho tôi bàn gần cửa sổ"
}
```

Quy tắc: chi nhánh phải đang hoạt động; thời gian phải ở tương lai và nằm trong giờ mở cửa; số khách từ 1 đến 30; bàn phải đủ sức chứa và không trùng lịch đặt đang hoạt động. Mỗi lượt đặt giữ bàn trong khoảng 2 giờ. Khách tra cứu/hủy cần cung cấp đúng mã đặt bàn và số điện thoại.

## Cài đặt và chạy

Yêu cầu Python 3.10 trở lên và Docker Desktop (hoặc MySQL cài sẵn).

```bash
docker compose up -d
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
copy .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Mở http://127.0.0.1:8000/docs để kiểm tra API. Docker khởi tạo MySQL tại cổng 3307 theo cấu hình mẫu.

Nếu dùng MySQL/XAMPP cài sẵn, chạy `sql/init.sql` và chỉnh DB_PORT, DB_USER, DB_PASSWORD trong file .env.
