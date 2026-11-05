import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import get_db
from responses import error_response, success_response
from services import branch_service

logger = logging.getLogger(__name__)

# Prefix riêng cho web khách để không trùng với router quản lý chi nhánh của module 1
router = APIRouter(prefix="/customer/branches", tags=["Customer - Branches"])


@router.get("")
def list_branches(request: Request, db: Session = Depends(get_db)):
    try:
        return success_response(request, "Lấy danh sách chi nhánh thành công", branch_service.list_active_branches(db))
    except Exception:
        logger.exception("Failed to load active customer branches")
        return error_response(request, "Lỗi hệ thống, vui lòng thử lại", "Internal Server Error", 500)