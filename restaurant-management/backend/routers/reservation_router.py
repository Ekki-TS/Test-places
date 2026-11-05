from datetime import date

from fastapi import APIRouter, Body, Depends, Query, Request
from pydantic import ValidationError
from sqlalchemy.orm import Session

from database import get_db
from responses import error_response, success_response
from schemas.reservation_schema import PHONE_PATTERN, ReservationCreate, clean_phone
from services import reservation_service

router = APIRouter(prefix="/reservations", tags=["Reservations"])

# Dữ liệu vào được kiểm tra thủ công (thay vì để FastAPI trả 422) để mọi lỗi
# đều có đủ 6 trường theo quy ước của nhóm và frontend đọc được "message".


def _bad(request: Request, message: str, status: int = 400, error: str = "Bad Request"):
    return error_response(request, message, error, status)


def _server_error(request: Request):
    return error_response(request, "Lỗi hệ thống, vui lòng thử lại", "Internal Server Error", 500)


def _validation_message(e: ValidationError) -> str:
    err = e.errors()[0]
    msg = err.get("msg", "Dữ liệu không hợp lệ")
    if msg.startswith("Value error, "):
        return msg[len("Value error, "):]
    field = ".".join(str(x) for x in err.get("loc", ()))
    return f"Thiếu hoặc sai thông tin: {field}" if field else "Dữ liệu không hợp lệ"


@router.post("")
def create_reservation(request: Request, payload: dict = Body(default=None), db: Session = Depends(get_db)):
    if not isinstance(payload, dict):
        return _bad(request, "Dữ liệu gửi lên không hợp lệ")
    try:
        data = ReservationCreate(**payload)
    except ValidationError as e:
        return _bad(request, _validation_message(e))

    try:
        result = reservation_service.create_reservation(db, data)
        return success_response(request, "Đặt bàn thành công", result, 201)
    except LookupError as e:
        db.rollback()
        return _bad(request, str(e), 404, "Not Found")
    except ValueError as e:
        db.rollback()
        return _bad(request, str(e))
    except Exception:
        db.rollback()
        return _server_error(request)


@router.get("/availability")
def get_availability(
    request: Request,
    branch_id: str = "",
    day_: str = Query("", alias="date"),
    party_size: str = "1",
    db: Session = Depends(get_db),
):
    try:
        branch = int(branch_id)
        day = date.fromisoformat(day_)
        size = int(party_size)
    except ValueError:
        return _bad(request, "Chi nhánh, ngày hoặc số khách không hợp lệ")
    if size < 1 or size > 20:
        return _bad(request, "Số khách phải từ 1 đến 20")

    try:
        result = reservation_service.get_availability(db, branch, day, size)
        return success_response(request, "Lấy khung giờ thành công", result)
    except LookupError as e:
        return _bad(request, str(e), 404, "Not Found")
    except ValueError as e:
        return _bad(request, str(e))
    except Exception:
        return _server_error(request)


@router.get("/lookup")
def lookup_reservations(
    request: Request,
    phone: str = "",
    code: str = "",
    db: Session = Depends(get_db),
):
    phone = clean_phone(phone)
    code = reservation_service.normalize_code(code)
    if not phone and not code:
        return _bad(request, "Vui lòng nhập mã đặt bàn hoặc số điện thoại")
    if phone and not PHONE_PATTERN.match(phone):
        return _bad(request, "Số điện thoại không hợp lệ")
    if not phone and not (4 <= len(code) <= 12):
        return _bad(request, "Mã đặt bàn không hợp lệ")
    try:
        if phone:
            result = reservation_service.lookup_reservations(db, phone, code or None)
        else:
            result = reservation_service.lookup_by_code(db, code)
        return success_response(request, "Tra cứu thành công", result)
    except Exception:
        return _server_error(request)


@router.patch("/{code}/cancel")
def cancel_reservation(request: Request, code: str, payload: dict = Body(default=None), db: Session = Depends(get_db)):
    phone = clean_phone((payload or {}).get("phone", "")) if isinstance(payload, dict) else ""
    if not PHONE_PATTERN.match(phone):
        return _bad(request, "Vui lòng nhập số điện thoại đã dùng khi đặt bàn")
    try:
        result = reservation_service.cancel_reservation(db, code, phone)
        return success_response(request, "Hủy đặt bàn thành công", result)
    except LookupError as e:
        db.rollback()
        return _bad(request, str(e), 404, "Not Found")
    except ValueError as e:
        db.rollback()
        return _bad(request, str(e))
    except Exception:
        db.rollback()
        return _server_error(request)