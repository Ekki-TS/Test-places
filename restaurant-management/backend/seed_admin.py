# Chạy một lần để tạo tài khoản admin đầu tiên:  python seed_admin.py
from database import SessionLocal
from models.role_model import Role
from models.user_model import User
from security import hash_password

ADMIN_EMAIL = "admin@restaurant.com"
ADMIN_PASSWORD = "Admin@123"  # đổi mật khẩu này sau khi đăng nhập
ROLE_NAMES = ["admin", "manager", "cashier", "waiter", "kitchen"]


def main():
    db = SessionLocal()
    try:
        # Thêm các vai trò còn thiếu
        for name in ROLE_NAMES:
            if db.query(Role).filter(Role.name == name).first() is None:
                db.add(Role(name=name))
        db.commit()

        if db.query(User).filter(User.email == ADMIN_EMAIL).first() is not None:
            print("Tài khoản admin đã tồn tại, không tạo thêm")
            return

        admin_role = db.query(Role).filter(Role.name == "admin").first()
        admin = User(
            role_id=admin_role.id,
            branch_id=None,
            full_name="Quản trị viên",
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("Đã tạo tài khoản admin: " + ADMIN_EMAIL)
    except Exception as e:
        db.rollback()
        print("Lỗi: " + str(e))
    finally:
        db.close()


if __name__ == "__main__":
    main()