-- ========================================================
-- JalMitra - Village Water & Drought Management System
-- MySQL Database Schema
-- ========================================================

CREATE DATABASE IF NOT EXISTS jalmitra_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jalmitra_db;

-- 1. Table: Village Settings
CREATE TABLE IF NOT EXISTS village_settings (
  id VARCHAR(50) PRIMARY KEY,
  village_name VARCHAR(255) NOT NULL,
  district VARCHAR(255) DEFAULT '',
  overall_status ENUM('Normal', 'Low', 'Critical') NOT NULL DEFAULT 'Low',
  notice_text TEXT,
  last_updated VARCHAR(100),
  officer_name VARCHAR(255),
  helpline VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: Water Sources
CREATE TABLE IF NOT EXISTS water_sources (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  type_label VARCHAR(100),
  location VARCHAR(255),
  total_capacity INT UNSIGNED NOT NULL,
  current_level_percent INT NOT NULL DEFAULT 0,
  last_inspected VARCHAR(100),
  purity_status VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Table: Distribution Schedules
CREATE TABLE IF NOT EXISTS distribution_schedules (
  id VARCHAR(50) PRIMARY KEY,
  area VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  date_label VARCHAR(50) DEFAULT 'Today',
  time_slot VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  supply_type VARCHAR(100) DEFAULT 'Pipeline Tap',
  status VARCHAR(50) DEFAULT 'Upcoming',
  lineman VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Table: Community Reports (Complaints & Requests)
CREATE TABLE IF NOT EXISTS community_reports (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  area VARCHAR(255) NOT NULL,
  problem_type VARCHAR(100) NOT NULL,
  urgency ENUM('Normal', 'High', 'Critical') DEFAULT 'Normal',
  description TEXT NOT NULL,
  status ENUM('Pending', 'Dispatched', 'Resolved') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- Initial Sample Seed Data (Sundarpur Gram Panchayat)
-- ========================================================

INSERT IGNORE INTO village_settings 
  (id, village_name, district, overall_status, notice_text, last_updated, officer_name, helpline)
VALUES 
  ('current', 'Sundarpur Gram Panchayat', 'Jalna District, Maharashtra', 'Low', 'Notice: Water supply is in Rationing Mode. Please store water carefully and avoid wastage.', 'Today at 08:30 AM', 'Ramesh Patil (Gram Sevak)', '1800-120-JAL (525)');

INSERT IGNORE INTO water_sources
  (id, name, type, type_label, location, total_capacity, current_level_percent, last_inspected, purity_status)
VALUES
  ('src-1', 'Main Village Reservoir (Shivalay Talab)', 'reservoir', 'Reservoir / Lake', 'Near Mahadev Mandir (East)', 500000, 32, 'Today 07:00 AM', 'Treated & Potable'),
  ('src-2', 'North Falia Overhead Tank', 'tank', 'Overhead Tank', 'Ward 1 - Behind Panchayat Bhavan', 150000, 45, 'Today 07:30 AM', 'Chlorinated'),
  ('src-3', 'Panchayat Community Well #1', 'well', 'Deep Dug Well', 'Ward 2 - Old Market Square', 100000, 55, 'Yesterday', 'Safe for Household'),
  ('src-4', 'Government Borewell Station South', 'well', 'Borewell Station', 'Ward 5 - Farm Boundary Road', 80000, 22, 'Today 06:45 AM', 'Filtered Ground Water'),
  ('src-5', 'School Rainwater Harvest Cistern', 'tank', 'Harvested Storage Tank', 'Ward 3 - Zilla Parishad Primary School', 70000, 58, '2 days ago', 'UV Filtered');

INSERT IGNORE INTO distribution_schedules
  (id, area, date, date_label, time_slot, duration, supply_type, status, lineman)
VALUES
  ('sch-1', 'Ward 1 - Patel Falia (North)', CURDATE(), 'Today', '06:00 AM - 08:00 AM', '2 hours', 'Pipeline Tap', 'Completed', 'Suresh Patil (9822114455)'),
  ('sch-2', 'Ward 2 - Temple Chowk & Main Bazar', CURDATE(), 'Today', '11:30 AM - 01:30 PM', '2 hours', 'Pipeline Tap', 'Completed', 'Ramesh Gavit (9876543210)'),
  ('sch-3', 'Ward 3 - School Tola & Aanganwadi', CURDATE(), 'Today', '05:00 PM - 07:00 PM', '2 hours', 'Pipeline Tap', 'Active Now', 'Ganesh Kadam (9833445566)'),
  ('sch-4', 'Ward 4 - Harijan Basti / East Colony', CURDATE(), 'Today', '07:30 PM - 09:30 PM', '2 hours', 'Water Tanker', 'Upcoming', 'Tanker MH-21-BK-4091'),
  ('sch-5', 'Ward 5 - Farm Road & Outer Basti', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Tomorrow', '06:30 AM - 08:30 AM', '2 hours', 'Community Well', 'Tomorrow', 'Suresh Patil (9822114455)');

INSERT IGNORE INTO community_reports
  (id, name, phone, area, problem_type, urgency, description, status)
VALUES
  ('cmp-1', 'Mohan Kadam', '9823101122', 'Ward 3 - School Tola & Aanganwadi', 'Pipeline Leakage', 'Critical', 'Severe pipe burst near Primary School gate. Potable water is pooling on the road and getting wasted.', 'Dispatched'),
  ('cmp-2', 'Savita Devi', '9890223344', 'Ward 4 - Harijan Basti / East Colony', 'Low Pressure', 'Normal', 'Water pressure has been negligible for 2 days. Buckets taking over 30 minutes to fill.', 'Pending'),
  ('cmp-3', 'Tukaram Shinde', '9765443322', 'Ward 1 - Patel Falia (North)', 'Broken Community Tap/Valve', 'Normal', 'Public tap faucet brass head broken. Replaced with emergency stopper plug.', 'Resolved');