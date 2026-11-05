from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import reservation as reservation_crud
from app.db.session import get_db
from app.schemas.reservation import (
    AvailabilityOut,
    ReservationCreate,
    ReservationLookup,
    ReservationOut,
)

router = APIRouter(prefix="/reservations", tags=["Customer Booking"])


@router.get("/branches")
def list_booking_branches(db: Session = Depends(get_db)):
    branches = reservation_crud.get_active_branches(db)
    return [
        {
            "id": branch.id,
            "name": branch.name,
            "address": branch.address,
            "phone": branch.phone,
            "open_time": branch.open_time,
            "close_time": branch.close_time,
        }
        for branch in branches
    ]


@router.get("/availability", response_model=AvailabilityOut)
def check_availability(
    branch_id: int = Query(gt=0),
    reserved_at: datetime = Query(),
    party_size: int = Query(ge=1, le=30),
    db: Session = Depends(get_db),
):
    branch = reservation_crud.get_active_branch(db, branch_id)
    if branch is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy chi nhánh đang hoạt động")

    if reserved_at <= reservation_crud.local_now():
        raise HTTPException(status_code=400, detail="Thời gian đặt bàn phải ở tương lai")

    if not (branch.open_time <= reserved_at.time() < branch.close_time):
        raise HTTPException(status_code=400, detail="Thời gian đặt bàn nằm ngoài giờ hoạt động của chi nhánh")

    tables = reservation_crud.get_available_tables(db, branch_id, reserved_at, party_size)
    return AvailabilityOut(
        available=bool(tables),
        available_tables=len(tables),
        message="Còn bàn phù hợp" if tables else "Hết bàn phù hợp vào thời gian này",
    )


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_booking(data: ReservationCreate, db: Session = Depends(get_db)):
    try:
        return reservation_crud.create_reservation(db, data)
    except ValueError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/lookup", response_model=ReservationOut)
def find_booking(data: ReservationLookup, db: Session = Depends(get_db)):
    reservation = reservation_crud.lookup_reservation(db, data.code, data.phone)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đặt bàn với mã và số điện thoại này")
    return reservation


@router.post("/cancel", response_model=ReservationOut)
def cancel_booking(data: ReservationLookup, db: Session = Depends(get_db)):
    reservation = reservation_crud.lookup_reservation(db, data.code, data.phone)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đặt bàn với mã và số điện thoại này")
    try:
        return reservation_crud.cancel_reservation(db, reservation)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
