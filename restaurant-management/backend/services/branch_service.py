from sqlalchemy.orm import Session

from models.branch_model import Branch


def branch_to_dict(b: Branch) -> dict:
    return {
        "id": b.id,
        "name": b.name,
        "address": b.address,
        "city": b.city,
        "phone": b.phone,
        "total_seats": b.total_seats,
    }


def list_active_branches(db: Session) -> list[dict]:
    rows = db.query(Branch).filter(Branch.is_active.is_(True)).order_by(Branch.id).all()
    return [branch_to_dict(b) for b in rows]


def get_active_branch(db: Session, branch_id: int) -> Branch:
    branch = (
        db.query(Branch)
        .filter(Branch.id == branch_id, Branch.is_active.is_(True))
        .first()
    )
    if branch is None:
        raise LookupError("Không tìm thấy chi nhánh")
    return branch