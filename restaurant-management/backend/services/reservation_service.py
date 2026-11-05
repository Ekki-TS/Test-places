import re
import secrets
import string
from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.branch_model import Branch
from models.customer_model import Customer
from models.reservation_model import (
    STATUS_CANCELLED,
    STATUS_CONFIRMED,
    STATUS_PENDING,
    Reservation,
)
from schemas.reservation_schema import ReservationCreate, ReservationOut
from services.branch_service import get_active_branch

# ---- Quy định nghiệp vụ (có thể chỉnh) ----
MIN_ADVANCE_MINUTES = 60      # phải đặt trước ít nhất 60 phút
MAX_ADVANCE_DAYS = 60         # đặt trước tối đa 60 ngày
CANCEL_BEFORE_MINUTES = 120   # chỉ hủy được trước giờ hẹn 2 tiếng
SLOT_STEP_MINUTES = 30
# (ca, giờ bắt đầu, giờ của khung cuối cùng)
SERVICE_PERIODS = (
    ("lunch", (11, 30), (14, 0)),
    ("dinner", (18, 0), (21, 30)),
)


def _build_slots() -> list[tuple[str, str]]:
    slots = []
    for period, start, end in SERVICE_PERIODS:
        m = start[0] * 60 + start[1]
        last = end[0] * 60 + end[1]
        while m <= last:
            slots.append((f"{m // 60:02d}:{m % 60:02d}", period))
            m += SLOT_STEP_MINUTES
    return slots


SLOTS = _build_slots()
SLOT_TIMES = {t for t, _ in SLOTS}

_ALPHABET = string.ascii_uppercase + string.digits


def _generate_code(db: Session) -> str:
    for _ in range(10):
        code = "RB" + "".join(secrets.choice(_ALPHABET) for _ in range(6))
        if not db.query(Reservation).filter(Reservation.code == code).first():
            return code
    raise RuntimeError("Không tạo được mã đặt bàn")


def to_out(r: Reservation) -> dict:
    return ReservationOut(
        id=r.id,
        code=r.code,
        full_name=r.customer.full_name,
        phone=r.customer.phone,
        email=r.customer.email,
        branch_id=r.branch_id,
        branch_name=r.branch.name,
        branch_address=f"{r.branch.address}, {r.branch.city}",
        table_id=r.table_id,
        reservation_time=r.reservation_time,
        party_size=r.party_size,
        preference=r.preference,
        note=r.note,
        status=r.status,
        created_at=r.created_at,
    ).model_dump(mode="json")


def _used_seats(db: Session, branch_id: int, start: datetime, end: datetime) -> dict:
    """Tổng số khách đã đặt theo từng giờ (không tính đơn đã hủy)."""
    rows = (
        db.query(Reservation.reservation_time, func.sum(Reservation.party_size))
        .filter(
            Reservation.branch_id == branch_id,
            Reservation.reservation_time >= start,
            Reservation.reservation_time < end,
            Reservation.status != STATUS_CANCELLED,
        )
        .group_by(Reservation.reservation_time)
        .all()
    )
    return {t: int(total or 0) for t, total in rows}


def get_availability(db: Session, branch_id: int, day: date, party_size: int = 1) -> dict:
    branch: Branch = get_active_branch(db, branch_id)
    today = date.today()
    if day < today or day > today + timedelta(days=MAX_ADVANCE_DAYS):
        raise ValueError("Ngày đặt bàn không hợp lệ")

    start = datetime.combine(day, datetime.min.time())
    used = _used_seats(db, branch.id, start, start + timedelta(days=1))
    earliest = datetime.now() + timedelta(minutes=MIN_ADVANCE_MINUTES)

    slots = []
    for time_str, period in SLOTS:
        hour, minute = map(int, time_str.split(":"))
        slot_dt = start.replace(hour=hour, minute=minute)
        remaining = max(branch.total_seats - used.get(slot_dt, 0), 0)
        slots.append(
            {
                "time": time_str,
                "period": period,
                "remaining": remaining,
                "available": slot_dt >= earliest and remaining >= party_size,
            }
        )
    return {
        "branch_id": branch.id,
        "date": day.isoformat(),
        "party_size": party_size,
        "slots": slots,
    }


def _validate_time(t: datetime) -> None:
    now = datetime.now()
    if t < now + timedelta(minutes=MIN_ADVANCE_MINUTES):
        raise ValueError(f"Vui lòng đặt trước ít nhất {MIN_ADVANCE_MINUTES} phút")
    if t > now + timedelta(days=MAX_ADVANCE_DAYS):
        raise ValueError(f"Chỉ nhận đặt bàn trước tối đa {MAX_ADVANCE_DAYS} ngày")
    if t.strftime("%H:%M") not in SLOT_TIMES:
        raise ValueError("Khung giờ không nằm trong giờ phục vụ của nhà hàng")


def create_reservation(db: Session, data: ReservationCreate) -> dict:
    _validate_time(data.reservation_time)
    branch = get_active_branch(db, data.branch_id)

    # Kiểm tra còn đủ chỗ trong khung giờ này
    used = _used_seats(
        db,
        branch.id,
        data.reservation_time,
        data.reservation_time + timedelta(minutes=1),
    ).get(data.reservation_time, 0)
    if used + data.party_size > branch.total_seats:
        raise ValueError("Khung giờ này đã hết chỗ, vui lòng chọn giờ khác")

    customer = db.query(Customer).filter(Customer.phone == data.phone).first()
    if customer is None:
        customer = Customer(full_name=data.full_name, phone=data.phone, email=data.email)
        db.add(customer)
        db.flush()
    else:
        customer.full_name = data.full_name
        if data.email:
            customer.email = data.email

    # Chặn đặt trùng: cùng khách, cùng giờ, chưa hủy
    duplicate = (
        db.query(Reservation)
        .filter(
            Reservation.customer_id == customer.id,
            Reservation.reservation_time == data.reservation_time,
            Reservation.status != STATUS_CANCELLED,
        )
        .first()
    )
    if duplicate:
        raise ValueError("Bạn đã có đặt bàn vào khung giờ này")

    reservation = Reservation(
        code=_generate_code(db),
        customer_id=customer.id,
        branch_id=branch.id,
        reservation_time=data.reservation_time,
        party_size=data.party_size,
        preference=data.preference,
        note=data.note,
        status=STATUS_PENDING,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return to_out(reservation)


def lookup_reservations(db: Session, phone: str, code: str | None = None) -> list[dict]:
    customer = db.query(Customer).filter(Customer.phone == phone).first()
    if customer is None:
        return []
    query = db.query(Reservation).filter(Reservation.customer_id == customer.id)
    if code:
        query = query.filter(Reservation.code == normalize_code(code))
    rows = query.order_by(Reservation.reservation_time.desc()).all()
    return [to_out(r) for r in rows]


def normalize_code(code: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", code or "").upper()


def _mask_phone(phone: str) -> str:
    return phone[:4] + " *** " + phone[-3:] if len(phone) >= 8 else "***"


def lookup_by_code(db: Session, code: str) -> list[dict]:
    """Tra cứu chỉ bằng mã: ẩn số điện thoại và email để người lạ không dò ra thông tin khách."""
    reservation = (
        db.query(Reservation).filter(Reservation.code == normalize_code(code)).first()
    )
    if reservation is None:
        return []
    out = to_out(reservation)
    out["phone"] = _mask_phone(out["phone"])
    out["email"] = None
    out["phone_masked"] = True
    return [out]


def cancel_reservation(db: Session, code: str, phone: str) -> dict:
    reservation = (
        db.query(Reservation).filter(Reservation.code == normalize_code(code)).first()
    )
    # Bắt buộc đúng số điện thoại để người lạ không hủy hộ được
    if reservation is None or reservation.customer.phone != phone:
        raise LookupError("Không tìm thấy đặt bàn")
    if reservation.status == STATUS_CANCELLED:
        raise ValueError("Đặt bàn đã được hủy trước đó")
    if reservation.status not in (STATUS_PENDING, STATUS_CONFIRMED):
        raise ValueError("Không thể hủy đặt bàn ở trạng thái này")
    if reservation.reservation_time < datetime.now() + timedelta(minutes=CANCEL_BEFORE_MINUTES):
        raise ValueError(
            f"Chỉ hủy được trước giờ hẹn ít nhất {CANCEL_BEFORE_MINUTES // 60} tiếng. "
            "Vui lòng gọi hotline để được hỗ trợ"
        )

    reservation.status = STATUS_CANCELLED
    db.commit()
    db.refresh(reservation)
    return to_out(reservation)