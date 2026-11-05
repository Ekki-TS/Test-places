-- ==========================================================
-- schema.sql - Restaurant Management (MySQL)
-- Chay 1 lan: mysql -u root -p < database/schema.sql
-- (hoac mo bang MySQL Workbench roi Execute)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS restaurant_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE restaurant_db;

-- ==========================================================
-- M1: Auth va nhan su
-- ==========================================================

CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    open_time TIME NOT NULL DEFAULT '10:00:00',
    close_time TIME NOT NULL DEFAULT '22:00:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE      -- admin, manager, cashier, waiter, kitchen
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NULL,                   -- NULL neu la admin tong
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ==========================================================
-- M2: Menu va ban
-- ==========================================================

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_item_options (   -- size, topping...
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    extra_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dining_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',   -- available / occupied / reserved
    UNIQUE (branch_id, table_number),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

-- ==========================================================
-- M3: Web khach va dat ban
-- ==========================================================

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    password_hash VARCHAR(255) NULL,      -- NULL neu khach khong dang ky tai khoan
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,     -- ma de khach tra cuu / huy
    branch_id INT NOT NULL,
    table_id INT NULL,                    -- NULL den khi xep ban
    customer_id INT NULL,                 -- NULL neu khach vang lai
    guest_name VARCHAR(100) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    party_size INT NOT NULL,
    reserved_at DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending / confirmed / seated / cancelled / no_show
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reservations_branch_time (branch_id, reserved_at),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (table_id) REFERENCES dining_tables(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

-- ==========================================================
-- M4: Order va bep
-- ==========================================================

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    table_id INT NOT NULL,
    reservation_id INT NULL,              -- NULL neu khach den khong dat truoc
    waiter_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',      -- open / sent / served / paid / cancelled
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    INDEX idx_orders_branch_status (branch_id, status),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (table_id) REFERENCES dining_tables(id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (waiter_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,    -- luu gia tai thoi diem goi
    status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending / cooking / done / served / cancelled
    note VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_item_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT NOT NULL,
    option_id INT NOT NULL,
    extra_price DECIMAL(10,2) NOT NULL DEFAULT 0,    -- luu gia tai thoi diem goi
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (option_id) REFERENCES menu_item_options(id)
) ENGINE=InnoDB;

-- ==========================================================
-- M5: Thanh toan, kho, bao cao
-- ==========================================================

CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    discount_type VARCHAR(10) NOT NULL,              -- percent / amount
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    usage_limit INT NULL,                            -- NULL = khong gioi han
    used_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    cashier_id INT NOT NULL,
    voucher_id INT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL,                     -- cash / card / transfer
    status VARCHAR(20) NOT NULL DEFAULT 'paid',      -- paid / refunded
    paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL                        -- g, ml, cai...
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipes (                 -- mon dung nguyen lieu nao, bao nhieu
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity_needed DECIMAL(10,2) NOT NULL,
    UNIQUE (menu_item_id, ingredient_id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS branch_inventories (      -- ton kho tung chi nhanh
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,   -- duoi muc nay thi canh bao
    UNIQUE (branch_id, ingredient_id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
) ENGINE=InnoDB;

-- ==========================================================
-- DU LIEU MAU (chay 1 lan tren DB moi tao, chay lai se bi trung)
-- ==========================================================

INSERT IGNORE INTO roles (name) VALUES
    ('admin'), ('manager'), ('cashier'), ('waiter'), ('kitchen');

INSERT INTO branches (name, address, phone) VALUES
    ('Chi nhanh Quan 1', '8/15 Le Thanh Ton, Quan 1, TP.HCM', '02812345678'),
    ('Chi nhanh Ha Noi', '43 Phan Ke Binh, Ba Dinh, Ha Noi', '02487654321');

INSERT INTO categories (name, sort_order) VALUES
    ('Pizza', 1), ('Pasta', 2), ('Salad', 3), ('Do uong', 4);

INSERT INTO menu_items (category_id, name, description, price) VALUES
    (1, 'Pizza Margherita', 'Pizza phu mozzarella va ca chua', 150000),
    (1, 'Pizza Hai San', 'Pizza hai san tuoi', 190000),
    (2, 'My Y Cua', 'My Y sot cua beo', 180000),
    (3, 'Salad Rau Cu', 'Rau cu tuoi trong ngay', 90000),
    (4, 'Nuoc ep cam', 'Cam vat tuoi', 50000);

INSERT INTO menu_item_options (menu_item_id, name, extra_price) VALUES
    (1, 'Size L', 40000),
    (1, 'Them pho mai', 20000);

INSERT INTO dining_tables (branch_id, table_number, capacity) VALUES
    (1, 'A1', 2), (1, 'A2', 4), (1, 'A3', 6),
    (2, 'B1', 2), (2, 'B2', 4);

INSERT INTO ingredients (name, unit) VALUES
    ('Bot mi', 'g'), ('Pho mai mozzarella', 'g'), ('Ca chua', 'g'), ('Cua', 'g');

INSERT INTO recipes (menu_item_id, ingredient_id, quantity_needed) VALUES
    (1, 1, 200), (1, 2, 100), (1, 3, 80);

INSERT INTO branch_inventories (branch_id, ingredient_id, quantity, min_quantity) VALUES
    (1, 1, 5000, 1000), (1, 2, 3000, 500), (1, 3, 2000, 400), (1, 4, 1500, 300);