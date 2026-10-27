-- ==============================================================================
-- Food Waste Forecasting & Reduction Planning Platform
-- MySQL Database Schema Creation DDL
-- Compatible with MySQL 8.0+
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS food_waste_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_waste_db;

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    org_type VARCHAR(60) NOT NULL DEFAULT 'Restaurant',
    location VARCHAR(200) NULL,
    contact_phone VARCHAR(50) NULL,
    contact_email VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'Admin',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_user_org (organization_id),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Food Items Catalog Table
CREATE TABLE IF NOT EXISTS food_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Cooked Meals',
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    default_unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    shelf_life_days INT NOT NULL DEFAULT 2,
    storage_condition VARCHAR(50) NOT NULL DEFAULT 'Refrigerated',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_food_org (organization_id),
    INDEX idx_food_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Daily Food Records Table
CREATE TABLE IF NOT EXISTS daily_food_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    food_item_id INT NOT NULL,
    record_date DATE NOT NULL,
    meal_period VARCHAR(30) NOT NULL DEFAULT 'Lunch',
    quantity_prepared DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    quantity_consumed DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    surplus_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discarded_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    waste_reason VARCHAR(60) NOT NULL DEFAULT 'None',
    notes TEXT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE,
    INDEX idx_record_org_date (organization_id, record_date),
    INDEX idx_record_item (food_item_id),
    INDEX idx_record_meal (meal_period),
    INDEX idx_record_demo (is_demo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Demand Forecast Results Table
CREATE TABLE IF NOT EXISTS forecast_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    food_item_id INT NOT NULL,
    target_date DATE NOT NULL,
    meal_period VARCHAR(30) NOT NULL DEFAULT 'Lunch',
    predicted_demand DECIMAL(10, 2) NOT NULL,
    expected_surplus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    recommended_prep DECIMAL(10, 2) NOT NULL,
    lower_bound DECIMAL(10, 2) NULL,
    upper_bound DECIMAL(10, 2) NULL,
    model_type VARCHAR(60) NOT NULL DEFAULT 'RandomForestRegressor',
    mae DECIMAL(8, 3) NULL,
    rmse DECIMAL(8, 3) NULL,
    confidence_level DECIMAL(4, 2) NOT NULL DEFAULT 0.90,
    is_baseline BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE,
    INDEX idx_forecast_org_date (organization_id, target_date),
    INDEX idx_forecast_item (food_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Intelligent Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    food_item_id INT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'Preparation',
    recommendation_text TEXT NOT NULL,
    reason TEXT NOT NULL,
    supporting_data TEXT NULL,
    potential_savings_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    potential_waste_reduction_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    action_notes TEXT NULL,
    date_generated DATE NOT NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE SET NULL,
    INDEX idx_rec_org_status (organization_id, status),
    INDEX idx_rec_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Active Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    food_item_id INT NULL,
    alert_type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Warning',
    message TEXT NOT NULL,
    suggested_action TEXT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE SET NULL,
    INDEX idx_alert_org_resolved (organization_id, is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Intervention Outcomes Table
CREATE TABLE IF NOT EXISTS intervention_outcomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    recommendation_id INT NULL,
    action_taken TEXT NOT NULL,
    recorded_date DATE NOT NULL,
    food_saved_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_saved DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    staff_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL,
    INDEX idx_intervention_org (organization_id, recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
