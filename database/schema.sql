
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,         -- 'buyer', 'seller', 'prosumer', 'admin'
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE user_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    date_of_birth DATE,
    gender ENUM('M', 'F', 'Other'),
    profile_picture_url VARCHAR(500),
    bio TEXT,
    kyc_verified TINYINT(1) DEFAULT 0,          -- Know Your Customer verification
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- MODULE 2: LOCATION & GRID MANAGEMENT
-- ============================================================

CREATE TABLE regions (
    region_id INT AUTO_INCREMENT PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    region_code VARCHAR(20) UNIQUE
);

CREATE TABLE grid_zones (
    zone_id INT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    zone_code VARCHAR(20) UNIQUE,
    max_capacity_kw DECIMAL(10,2),               -- Max power this zone can handle
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

CREATE TABLE user_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    zone_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    is_primary TINYINT(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (zone_id) REFERENCES grid_zones(zone_id)
);

-- ============================================================
-- MODULE 3: DEVICE & METER MANAGEMENT
-- ============================================================

CREATE TABLE renewable_sources (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL UNIQUE,     -- 'Solar', 'Wind', 'Biogas'
    description VARCHAR(255)
);

CREATE TABLE smart_meters (
    meter_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    zone_id INT NOT NULL,
    meter_serial_number VARCHAR(100) NOT NULL UNIQUE,
    meter_type ENUM('production', 'consumption', 'bidirectional') NOT NULL,
    installation_date DATE NOT NULL,
    last_sync_at DATETIME,
    is_active TINYINT(1) DEFAULT 1,
    firmware_version VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (zone_id) REFERENCES grid_zones(zone_id)
);

CREATE TABLE energy_sources (
    energy_source_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    source_id INT NOT NULL,
    meter_id INT,
    capacity_kw DECIMAL(10,2) NOT NULL,          -- Installed capacity
    installation_date DATE,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (source_id) REFERENCES renewable_sources(source_id),
    FOREIGN KEY (meter_id) REFERENCES smart_meters(meter_id)
);

CREATE TABLE energy_storage (
    storage_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    battery_name VARCHAR(100),
    capacity_kwh DECIMAL(10,2) NOT NULL,         -- Total battery capacity
    current_charge_kwh DECIMAL(10,2) DEFAULT 0,
    charge_efficiency DECIMAL(5,2) DEFAULT 95.00, -- %
    discharge_efficiency DECIMAL(5,2) DEFAULT 95.00,
    installed_at DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- MODULE 4: ENERGY MANAGEMENT
-- ============================================================

CREATE TABLE time_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    slot_name VARCHAR(50) NOT NULL,              -- 'Morning Peak', 'Off-Peak Night'
    slot_type ENUM('peak', 'off-peak', 'standard') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE KEY unique_slot (start_time, end_time)
);

CREATE TABLE energy_production_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    meter_id INT NOT NULL,
    energy_source_id INT NOT NULL,
    slot_id INT,
    units_produced_kwh DECIMAL(10,4) NOT NULL CHECK (units_produced_kwh >= 0),
    log_timestamp DATETIME NOT NULL,
    FOREIGN KEY (meter_id) REFERENCES smart_meters(meter_id),
    FOREIGN KEY (energy_source_id) REFERENCES energy_sources(energy_source_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id)
);

CREATE TABLE energy_consumption_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    meter_id INT NOT NULL,
    slot_id INT,
    units_consumed_kwh DECIMAL(10,4) NOT NULL CHECK (units_consumed_kwh >= 0),
    log_timestamp DATETIME NOT NULL,
    FOREIGN KEY (meter_id) REFERENCES smart_meters(meter_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id)
);

CREATE TABLE demand_forecasts (
    forecast_id INT AUTO_INCREMENT PRIMARY KEY,
    zone_id INT NOT NULL,
    forecast_date DATE NOT NULL,
    slot_id INT NOT NULL,
    predicted_demand_kwh DECIMAL(10,4),
    predicted_supply_kwh DECIMAL(10,4),
    confidence_pct DECIMAL(5,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES grid_zones(zone_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id)
);

-- ============================================================
-- MODULE 5: PRICING
-- ============================================================

CREATE TABLE tariff_plans (
    tariff_id INT AUTO_INCREMENT PRIMARY KEY,
    tariff_name VARCHAR(100) NOT NULL,
    base_price_per_kwh DECIMAL(8,4) NOT NULL,    -- Base rate ₹/kWh
    peak_multiplier DECIMAL(4,2) DEFAULT 1.50,   -- e.g. 1.5x for peak hours
    off_peak_multiplier DECIMAL(4,2) DEFAULT 0.80,
    effective_from DATE NOT NULL,
    effective_to DATE,
    zone_id INT,                                 -- NULL = applies to all zones
    FOREIGN KEY (zone_id) REFERENCES grid_zones(zone_id)
);

-- ============================================================
-- MODULE 6: TRADING SYSTEM
-- ============================================================

CREATE TABLE energy_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    zone_id INT NOT NULL,
    slot_id INT NOT NULL,
    energy_source_id INT,
    units_available_kwh DECIMAL(10,4) NOT NULL CHECK (units_available_kwh > 0),
    price_per_kwh DECIMAL(8,4) NOT NULL CHECK (price_per_kwh > 0),
    listing_date DATE NOT NULL,
    status ENUM('active', 'partially_sold', 'sold', 'expired', 'cancelled') DEFAULT 'active',
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    FOREIGN KEY (zone_id) REFERENCES grid_zones(zone_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id),
    FOREIGN KEY (energy_source_id) REFERENCES energy_sources(energy_source_id)
);

CREATE TABLE purchase_orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    listing_id INT NOT NULL,
    zone_id INT NOT NULL,
    slot_id INT NOT NULL,
    units_requested_kwh DECIMAL(10,4) NOT NULL CHECK (units_requested_kwh > 0),
    max_price_per_kwh DECIMAL(8,4),              -- Max buyer is willing to pay
    status ENUM('pending', 'matched', 'confirmed', 'completed', 'cancelled', 'failed') DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (listing_id) REFERENCES energy_listings(listing_id),
    FOREIGN KEY (zone_id) REFERENCES grid_zones(zone_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id)
);

CREATE TABLE trade_matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    units_matched_kwh DECIMAL(10,4) NOT NULL CHECK (units_matched_kwh > 0),
    agreed_price_per_kwh DECIMAL(8,4) NOT NULL,
    matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'completed', 'failed') DEFAULT 'pending',
    FOREIGN KEY (order_id) REFERENCES purchase_orders(order_id),
    FOREIGN KEY (listing_id) REFERENCES energy_listings(listing_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

CREATE TABLE contracts (
    contract_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    tariff_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    units_per_day_kwh DECIMAL(10,4),
    agreed_price_per_kwh DECIMAL(8,4) NOT NULL,
    status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    FOREIGN KEY (tariff_id) REFERENCES tariff_plans(tariff_id)
);

CREATE TABLE energy_transfer_logs (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    from_meter_id INT NOT NULL,
    to_meter_id INT NOT NULL,
    units_transferred_kwh DECIMAL(10,4) NOT NULL,
    transfer_start DATETIME,
    transfer_end DATETIME,
    status ENUM('scheduled', 'in_progress', 'completed', 'failed') DEFAULT 'scheduled',
    FOREIGN KEY (match_id) REFERENCES trade_matches(match_id),
    FOREIGN KEY (from_meter_id) REFERENCES smart_meters(meter_id),
    FOREIGN KEY (to_meter_id) REFERENCES smart_meters(meter_id)
);

-- ============================================================
-- MODULE 7: PAYMENT SYSTEM
-- ============================================================

CREATE TABLE wallets (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(12,4) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(10) DEFAULT 'INR',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    amount DECIMAL(12,4) NOT NULL CHECK (amount > 0),
    platform_fee DECIMAL(8,4) DEFAULT 0,
    tax_amount DECIMAL(8,4) DEFAULT 0,
    net_seller_amount DECIMAL(12,4),
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (match_id) REFERENCES trade_matches(match_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    wallet_id INT NOT NULL,
    payment_type ENUM('debit', 'credit') NOT NULL,
    amount DECIMAL(12,4) NOT NULL,
    payment_method ENUM('wallet', 'upi', 'card', 'netbanking') DEFAULT 'wallet',
    reference_number VARCHAR(100) UNIQUE,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    paid_at DATETIME,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id)
);

CREATE TABLE wallet_recharge_logs (
    recharge_id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    amount DECIMAL(12,4) NOT NULL CHECK (amount > 0),
    payment_method ENUM('upi', 'card', 'netbanking') NOT NULL,
    gateway_reference VARCHAR(150),
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    initiated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id)
);

-- ============================================================
-- MODULE 8: RATINGS & REVIEWS
-- ============================================================

CREATE TABLE ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    rater_id INT NOT NULL,
    rated_user_id INT NOT NULL,
    rating_value TINYINT NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_rating (transaction_id, rater_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
    FOREIGN KEY (rater_id) REFERENCES users(user_id),
    FOREIGN KEY (rated_user_id) REFERENCES users(user_id)
);

-- ============================================================
-- MODULE 9: NOTIFICATIONS
-- ============================================================

CREATE TABLE notification_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,      -- 'new_listing', 'order_matched', etc.
    template_text TEXT
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (type_id) REFERENCES notification_types(type_id)
);

-- ============================================================
-- MODULE 10: DISPUTE MANAGEMENT
-- ============================================================

CREATE TABLE disputes (
    dispute_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    raised_by INT NOT NULL,
    against_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('open', 'under_review', 'resolved', 'escalated') DEFAULT 'open',
    resolution TEXT,
    raised_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolved_by INT,                             -- admin user_id
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
    FOREIGN KEY (raised_by) REFERENCES users(user_id),
    FOREIGN KEY (against_user_id) REFERENCES users(user_id),
    FOREIGN KEY (resolved_by) REFERENCES users(user_id)
);

-- ============================================================
-- MODULE 11: MONITORING & AUDIT
-- ============================================================

CREATE TABLE audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,           -- 'LOGIN', 'CREATE_LISTING', 'PLACE_ORDER'
    table_name VARCHAR(100),
    record_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE api_request_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_payload JSON,
    response_status INT,
    response_time_ms INT,
    ip_address VARCHAR(45),
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE system_config (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_listings_seller ON energy_listings(seller_id);
CREATE INDEX idx_listings_status ON energy_listings(status);
CREATE INDEX idx_listings_zone_slot ON energy_listings(zone_id, slot_id);
CREATE INDEX idx_orders_buyer ON purchase_orders(buyer_id);
CREATE INDEX idx_orders_status ON purchase_orders(status);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_prod_logs_meter ON energy_production_logs(meter_id);
CREATE INDEX idx_prod_logs_time ON energy_production_logs(log_timestamp);
CREATE INDEX idx_cons_logs_meter ON energy_consumption_logs(meter_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_time ON audit_logs(performed_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER $$

-- Trigger 1: Deduct from listing when an order is matched
CREATE TRIGGER after_match_insert
AFTER INSERT ON trade_matches
FOR EACH ROW
BEGIN
    UPDATE energy_listings
    SET units_available_kwh = units_available_kwh - NEW.units_matched_kwh,
        status = CASE
            WHEN (units_available_kwh - NEW.units_matched_kwh) <= 0 THEN 'sold'
            ELSE 'partially_sold'
        END
    WHERE listing_id = NEW.listing_id;
END$$

-- Trigger 2: Auto-create wallet on new user registration
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO wallets (user_id, balance) VALUES (NEW.user_id, 0.00);
END$$

-- Trigger 3: Log every transaction to audit
CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, new_value, performed_at)
    VALUES ('TRANSACTION_CREATED', 'transactions', NEW.transaction_id,
            JSON_OBJECT('amount', NEW.amount, 'buyer', NEW.buyer_id, 'seller', NEW.seller_id),
            NOW());
END$$

DELIMITER ;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- Procedure 1: Get user energy summary
CREATE PROCEDURE GetUserEnergySummary(IN p_user_id INT)
BEGIN
    SELECT
        u.full_name,
        COALESCE(SUM(epl.units_produced_kwh), 0) AS total_produced_kwh,
        COALESCE(SUM(ecl.units_consumed_kwh), 0) AS total_consumed_kwh,
        w.balance AS wallet_balance
    FROM users u
    LEFT JOIN smart_meters sm ON sm.user_id = u.user_id
    LEFT JOIN energy_production_logs epl ON epl.meter_id = sm.meter_id
    LEFT JOIN energy_consumption_logs ecl ON ecl.meter_id = sm.meter_id
    LEFT JOIN wallets w ON w.user_id = u.user_id
    WHERE u.user_id = p_user_id
    GROUP BY u.user_id, u.full_name, w.balance;
END$$

-- Procedure 2: Process a payment between buyer and seller
CREATE PROCEDURE ProcessPayment(
    IN p_transaction_id INT,
    IN p_buyer_wallet INT,
    IN p_seller_wallet INT,
    IN p_amount DECIMAL(12,4)
)
BEGIN
    DECLARE buyer_balance DECIMAL(12,4);

    START TRANSACTION;

    SELECT balance INTO buyer_balance FROM wallets WHERE wallet_id = p_buyer_wallet FOR UPDATE;

    IF buyer_balance >= p_amount THEN
        UPDATE wallets SET balance = balance - p_amount WHERE wallet_id = p_buyer_wallet;
        UPDATE wallets SET balance = balance + p_amount WHERE wallet_id = p_seller_wallet;
        UPDATE transactions SET status = 'completed', completed_at = NOW() WHERE transaction_id = p_transaction_id;
        COMMIT;
    ELSE
        UPDATE transactions SET status = 'failed' WHERE transaction_id = p_transaction_id;
        ROLLBACK;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Roles
INSERT INTO roles (role_name, description) VALUES
('buyer', 'Purchases electricity from sellers'),
('seller', 'Sells excess electricity'),
('prosumer', 'Both produces and consumes electricity'),
('admin', 'Platform administrator');

-- Regions
INSERT INTO regions (region_name, state, country, region_code) VALUES
('South Karnataka', 'Karnataka', 'India', 'KA-S'),
('North Karnataka', 'Karnataka', 'India', 'KA-N');

-- Grid Zones
INSERT INTO grid_zones (region_id, zone_name, zone_code, max_capacity_kw) VALUES
(1, 'Udupi Central', 'UDC-01', 5000.00),
(1, 'Mangaluru East', 'MNG-E1', 8000.00);

-- Renewable Sources
INSERT INTO renewable_sources (source_name, description) VALUES
('Solar', 'Photovoltaic solar panels'),
('Wind', 'Wind turbine generation'),
('Biogas', 'Biogas from organic waste');

-- Time Slots
INSERT INTO time_slots (slot_name, slot_type, start_time, end_time) VALUES
('Morning Peak', 'peak', '06:00:00', '10:00:00'),
('Day Standard', 'standard', '10:00:00', '18:00:00'),
('Evening Peak', 'peak', '18:00:00', '22:00:00'),
('Night Off-Peak', 'off-peak', '22:00:00', '06:00:00');

-- Users
INSERT INTO users (role_id, full_name, email, phone, password_hash) VALUES
(3, 'Ravi Kumar', 'ravi@example.com', '9876543210', SHA2('pass123', 256)),
(1, 'Priya Nair', 'priya@example.com', '9876543211', SHA2('pass456', 256)),
(2, 'Suresh Shetty', 'suresh@example.com', '9876543212', SHA2('pass789', 256)),
(4, 'Admin User', 'admin@p2p-energy.com', '9000000001', SHA2('adminpass', 256));

-- User Profiles
INSERT INTO user_profiles (user_id, kyc_verified) VALUES (1, 1), (2, 1), (3, 0), (4, 1);

-- Addresses
INSERT INTO user_addresses (user_id, zone_id, address_line1, city, pincode) VALUES
(1, 1, '12 MG Road', 'Udupi', '576101'),
(2, 1, '45 Beach Road', 'Udupi', '576102'),
(3, 2, '78 Port Area', 'Mangaluru', '575001');

-- Smart Meters
INSERT INTO smart_meters (user_id, zone_id, meter_serial_number, meter_type, installation_date) VALUES
(1, 1, 'SM-001-UDC', 'bidirectional', '2023-01-15'),
(2, 1, 'SM-002-UDC', 'consumption', '2023-03-10'),
(3, 2, 'SM-003-MNG', 'bidirectional', '2023-06-20');

-- Energy Sources
INSERT INTO energy_sources (user_id, source_id, meter_id, capacity_kw, installation_date) VALUES
(1, 1, 1, 5.00, '2023-01-15'),
(3, 1, 3, 10.00, '2023-06-20');

-- Wallets (auto-created by trigger, but seeded here for demo)
INSERT INTO wallets (user_id, balance) VALUES (1, 5000.00), (2, 3000.00), (3, 8000.00), (4, 0.00)
ON DUPLICATE KEY UPDATE balance = VALUES(balance);

-- Tariff Plans
INSERT INTO tariff_plans (tariff_name, base_price_per_kwh, effective_from) VALUES
('Standard 2024', 6.50, '2024-01-01'),
('Solar Incentive 2024', 5.00, '2024-01-01');

-- Energy Listings
INSERT INTO energy_listings (seller_id, zone_id, slot_id, energy_source_id, units_available_kwh, price_per_kwh, listing_date, expires_at) VALUES
(1, 1, 2, 1, 10.00, 5.50, CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY)),
(3, 2, 1, 2, 20.00, 5.00, CURDATE(), DATE_ADD(NOW(), INTERVAL 1 DAY));

-- System Config
INSERT INTO system_config (config_key, config_value, description) VALUES
('platform_fee_pct', '2.5', 'Platform fee percentage per transaction'),
('max_listing_duration_hrs', '24', 'Max hours a listing stays active'),
('min_trade_units_kwh', '0.1', 'Minimum units for a trade');

-- Notification Types
INSERT INTO notification_types (type_name, template_text) VALUES
('new_listing', 'A new listing is available in your zone.'),
('order_matched', 'Your order has been matched with a seller.'),
('payment_success', 'Your payment of ₹{amount} was successful.'),
('dispute_raised', 'A dispute has been raised on transaction #{transaction_id}.');
