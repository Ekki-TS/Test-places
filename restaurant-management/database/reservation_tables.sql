-- Migration for databases created with the earlier database/schema.sql.
-- Run once after backing up the database. New installations should run schema.sql
-- instead; it already creates tables compatible with the booking API.
USE restaurant_db;

-- Add the branch fields queried by the customer booking API.
ALTER TABLE branches
    ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT '' AFTER address,
    ADD COLUMN total_seats INT NOT NULL DEFAULT 60 AFTER phone;

UPDATE branches
SET city = CASE
    WHEN name LIKE '%Ha Noi%' THEN 'TP. Ha Noi'
    WHEN name LIKE '%Quan 1%' THEN 'TP. Ho Chi Minh'
    ELSE 'Chua cap nhat'
END
WHERE city = '';

-- Preserve existing bookings while renaming the time/customer data shape to
-- the one used by the SQLAlchemy Reservation model.
ALTER TABLE reservations
    ADD COLUMN reservation_time DATETIME NULL AFTER table_id,
    ADD COLUMN preference VARCHAR(30) NULL AFTER party_size;

UPDATE reservations
SET reservation_time = reserved_at
WHERE reservation_time IS NULL;

INSERT INTO customers (full_name, phone, email)
SELECT MAX(r.guest_name), r.guest_phone, NULL
FROM reservations AS r
LEFT JOIN customers AS c ON c.phone = r.guest_phone
WHERE r.customer_id IS NULL
  AND r.guest_phone IS NOT NULL
  AND c.id IS NULL
GROUP BY r.guest_phone;

UPDATE reservations AS r
JOIN customers AS c ON c.phone = r.guest_phone
SET r.customer_id = c.id
WHERE r.customer_id IS NULL;

ALTER TABLE reservations
    MODIFY COLUMN customer_id INT NOT NULL,
    MODIFY COLUMN reservation_time DATETIME NOT NULL,
    ADD INDEX idx_reservations_time (reservation_time);
