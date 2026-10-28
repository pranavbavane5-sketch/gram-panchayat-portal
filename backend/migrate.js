import pool from "./db.js";
import bcrypt from "bcryptjs";

export async function runMigrations() {
  console.log("🔄 Checking and applying database migrations for JalMitra...");

  // 1. Table: users
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      login_id VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'citizen') NOT NULL DEFAULT 'citizen',
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      citizen_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_login (login_id),
      INDEX idx_role (role)
    ) ENGINE=InnoDB;
  `);

  // 2. Table: citizens
  await pool.query(`
    CREATE TABLE IF NOT EXISTS citizens (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      property_no VARCHAR(100) NOT NULL,
      ward_area VARCHAR(255) NOT NULL,
      family_members INT NOT NULL DEFAULT 4,
      meter_no VARCHAR(100) DEFAULT 'MET-2026-01',
      connection_type VARCHAR(50) DEFAULT 'Domestic Metered Tap',
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_phone (phone),
      INDEX idx_ward (ward_area)
    ) ENGINE=InnoDB;
  `);

  // 3. Table: water_bills
  await pool.query(`
    CREATE TABLE IF NOT EXISTS water_bills (
      id VARCHAR(50) PRIMARY KEY,
      citizen_id VARCHAR(50) NOT NULL,
      billing_period VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      due_date DATE NOT NULL,
      status ENUM('Unpaid', 'Partially Paid', 'Paid') NOT NULL DEFAULT 'Unpaid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_citizen (citizen_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB;
  `);

  // 4. Table: payments
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(50) PRIMARY KEY,
      bill_id VARCHAR(50),
      citizen_id VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_mode ENUM('Cash', 'UPI', 'Net Banking', 'Cheque') NOT NULL DEFAULT 'UPI',
      receipt_no VARCHAR(100) NOT NULL,
      notes VARCHAR(255),
      INDEX idx_pay_citizen (citizen_id),
      INDEX idx_pay_bill (bill_id)
    ) ENGINE=InnoDB;
  `);

  // 5. Table: taxes_charges
  await pool.query(`
    CREATE TABLE IF NOT EXISTS taxes_charges (
      id VARCHAR(50) PRIMARY KEY,
      citizen_id VARCHAR(50) NOT NULL,
      charge_type VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      amount DECIMAL(10,2) NOT NULL,
      due_date DATE NOT NULL,
      status ENUM('Unpaid', 'Paid') NOT NULL DEFAULT 'Unpaid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tax_citizen (citizen_id),
      INDEX idx_tax_status (status)
    ) ENGINE=InnoDB;
  `);

  // 6. Table: properties
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id VARCHAR(50) PRIMARY KEY,
      property_number VARCHAR(100) UNIQUE NOT NULL,
      owner_citizen_id VARCHAR(50) NULL,
      owner_name VARCHAR(255) NOT NULL,
      ward_area VARCHAR(255) NOT NULL,
      property_type ENUM('Residential', 'Commercial', 'Agricultural', 'Institutional') NOT NULL DEFAULT 'Residential',
      address VARCHAR(255) NOT NULL,
      water_meter_no VARCHAR(100) NULL,
      connection_type VARCHAR(100) DEFAULT 'Domestic Metered Tap',
      annual_tax DECIMAL(10,2) DEFAULT 250.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_prop_owner (owner_citizen_id),
      INDEX idx_prop_ward (ward_area)
    ) ENGINE=InnoDB;
  `);

  // 7. Table: water_tanks
  await pool.query(`
    CREATE TABLE IF NOT EXISTS water_tanks (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      village_location VARCHAR(255) NOT NULL,
      tank_type ENUM('Overhead Tank', 'Ground Reservoir', 'Sump', 'Borewell Storage', 'Cistern', 'Other') NOT NULL DEFAULT 'Overhead Tank',
      total_capacity INT UNSIGNED NOT NULL,
      current_quantity INT UNSIGNED NOT NULL DEFAULT 0,
      current_level_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      status ENUM('Normal', 'Low', 'Critical', 'Very Critical', 'Empty') NOT NULL DEFAULT 'Normal',
      last_measured_at TIMESTAMP NULL,
      measurement_method ENUM('Manual', 'Sensor') NOT NULL DEFAULT 'Manual',
      sensor_id VARCHAR(100) NULL,
      tank_shape ENUM('Direct Quantity', 'Cylindrical Vertical', 'Rectangular Box') DEFAULT 'Direct Quantity',
      dim_height DECIMAL(6,2) NULL,
      dim_diameter DECIMAL(6,2) NULL,
      dim_length DECIMAL(6,2) NULL,
      dim_width DECIMAL(6,2) NULL,
      source_id VARCHAR(50) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tank_loc (village_location),
      INDEX idx_tank_status (status)
    ) ENGINE=InnoDB;
  `);

  // 8. Table: water_level_readings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS water_level_readings (
      id VARCHAR(50) PRIMARY KEY,
      tank_id VARCHAR(50) NOT NULL,
      measured_quantity INT UNSIGNED NOT NULL,
      percentage DECIMAL(5,2) NOT NULL,
      measurement_method ENUM('Manual', 'Sensor') NOT NULL DEFAULT 'Manual',
      water_height_m DECIMAL(6,2) NULL,
      recorded_by VARCHAR(100) NOT NULL,
      notes TEXT NULL,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tank_history (tank_id, recorded_at),
      FOREIGN KEY (tank_id) REFERENCES water_tanks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 9. Table: water_distribution_records
  await pool.query(`
    CREATE TABLE IF NOT EXISTS water_distribution_records (
      id VARCHAR(50) PRIMARY KEY,
      tank_id VARCHAR(50) NULL,
      target_area VARCHAR(255) NOT NULL,
      distribution_date DATE NOT NULL,
      quantity_supplied INT UNSIGNED NOT NULL,
      duration_hours DECIMAL(4,2) DEFAULT 2.0,
      inflow_litres INT UNSIGNED DEFAULT 0,
      outflow_litres INT UNSIGNED DEFAULT 0,
      recorded_by VARCHAR(100) NOT NULL,
      notes VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dist_tank (tank_id),
      INDEX idx_dist_date (distribution_date)
    ) ENGINE=InnoDB;
  `);

  // 10. Table: water_level_alerts
  await pool.query(`
    CREATE TABLE IF NOT EXISTS water_level_alerts (
      id VARCHAR(50) PRIMARY KEY,
      tank_id VARCHAR(50) NOT NULL,
      alert_type ENUM('Low', 'Critical', 'Very Critical', 'Empty', 'High') NOT NULL,
      percentage DECIMAL(5,2) NOT NULL,
      message VARCHAR(255) NOT NULL,
      is_acknowledged TINYINT(1) NOT NULL DEFAULT 0,
      acknowledged_by VARCHAR(100) NULL,
      acknowledged_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_alert_tank (tank_id, is_acknowledged)
    ) ENGINE=InnoDB;
  `);

  // Seed default water_tanks if table is empty
  const [tankCount] = await pool.query("SELECT COUNT(*) as count FROM water_tanks");
  if (tankCount[0].count === 0) {
    console.log("💧 Seeding default village water tanks...");
    await pool.query(`
      INSERT INTO water_tanks 
        (id, name, village_location, tank_type, total_capacity, current_quantity, current_level_percent, status, last_measured_at, measurement_method, tank_shape, dim_height, dim_diameter, source_id)
      VALUES 
        ('TNK-001', 'North Falia Overhead Tank', 'Ward 1 - Behind Panchayat Bhavan', 'Overhead Tank', 150000, 67500, 45.00, 'Low', NOW(), 'Manual', 'Cylindrical Vertical', 5.00, 6.20, 'src-2'),
        ('TNK-002', 'Main Village Reservoir Tank', 'Near Mahadev Mandir (East)', 'Ground Reservoir', 500000, 160000, 32.00, 'Low', NOW(), 'Manual', 'Rectangular Box', 4.00, NULL, 'src-1'),
        ('TNK-003', 'Panchayat Community Well Cistern', 'Ward 2 - Old Market Square', 'Borewell Storage', 100000, 55000, 55.00, 'Normal', NOW(), 'Manual', 'Cylindrical Vertical', 6.00, 4.60, 'src-3')
    `);

    // Insert initial readings
    await pool.query(`
      INSERT INTO water_level_readings 
        (id, tank_id, measured_quantity, percentage, measurement_method, water_height_m, recorded_by, notes, recorded_at)
      VALUES 
        ('RDG-101', 'TNK-001', 67500, 45.00, 'Manual', 2.25, 'admin', 'Morning manual dipstick inspection', NOW()),
        ('RDG-102', 'TNK-002', 160000, 32.00, 'Manual', 1.28, 'admin', 'Gauge board reading taken by lineman', NOW()),
        ('RDG-103', 'TNK-003', 55000, 55.00, 'Manual', 3.30, 'admin', 'Well cistern physical dip measurement', NOW())
    `);

    // Insert sample distribution record
    await pool.query(`
      INSERT INTO water_distribution_records 
        (id, tank_id, target_area, distribution_date, quantity_supplied, duration_hours, inflow_litres, outflow_litres, recorded_by, notes)
      VALUES 
        ('DIST-001', 'TNK-001', 'Ward 1 - Patel Falia (North)', CURDATE(), 15000, 2.0, 18000, 15000, 'admin', 'Scheduled morning tap pipeline distribution')
    `);

    // Insert sample low storage alert
    await pool.query(`
      INSERT INTO water_level_alerts 
        (id, tank_id, alert_type, percentage, message, is_acknowledged)
      VALUES 
        ('ALT-001', 'TNK-002', 'Low', 32.00, 'Main Village Reservoir Tank level is at 32.00% (160,000 L). Low storage threshold alert.', 0),
        ('ALT-002', 'TNK-001', 'Low', 45.00, 'North Falia Overhead Tank level is at 45.00% (67,500 L). Approaching rationing reserve limit.', 0)
    `);
  }

  // Safe enhancements to citizens, water_bills, taxes_charges, community_reports
  try {
    const [citCols] = await pool.query("DESCRIBE citizens");
    const citColNames = citCols.map(c => c.Field);
    if (!citColNames.includes("property_id")) {
      await pool.query("ALTER TABLE citizens ADD COLUMN property_id VARCHAR(50) NULL AFTER property_no");
    }

    const [billCols] = await pool.query("DESCRIBE water_bills");
    const billColNames = billCols.map(c => c.Field);
    if (!billColNames.includes("property_id")) {
      await pool.query("ALTER TABLE water_bills ADD COLUMN property_id VARCHAR(50) NULL AFTER citizen_id");
    }

    const [taxCols] = await pool.query("DESCRIBE taxes_charges");
    const taxColNames = taxCols.map(c => c.Field);
    if (!taxColNames.includes("property_id")) {
      await pool.query("ALTER TABLE taxes_charges ADD COLUMN property_id VARCHAR(50) NULL AFTER citizen_id");
    }

    const [cols] = await pool.query("DESCRIBE community_reports");
    const colNames = cols.map(c => c.Field);
    
    if (!colNames.includes("citizen_id")) {
      await pool.query("ALTER TABLE community_reports ADD COLUMN citizen_id VARCHAR(50) NULL AFTER id");
    }
    if (!colNames.includes("admin_response")) {
      await pool.query("ALTER TABLE community_reports ADD COLUMN admin_response TEXT NULL AFTER description");
    }
    if (!colNames.includes("resolved_at")) {
      await pool.query("ALTER TABLE community_reports ADD COLUMN resolved_at TIMESTAMP NULL AFTER status");
    }
    // Update status enum if needed to include 'In Progress' and 'Rejected'
    await pool.query(`
      ALTER TABLE community_reports 
      MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Dispatched', 'Resolved', 'Rejected') DEFAULT 'Pending'
    `);

    // Enhance village_settings for Year-Round Gram Panchayat details
    const [settCols] = await pool.query("DESCRIBE village_settings");
    const settColNames = settCols.map(c => c.Field);
    if (!settColNames.includes("village_name_mr")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN village_name_mr VARCHAR(255) NULL AFTER village_name");
    }
    if (!settColNames.includes("taluka")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN taluka VARCHAR(255) DEFAULT 'Karveer' AFTER district");
    }
    if (!settColNames.includes("state")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN state VARCHAR(255) DEFAULT 'Maharashtra' AFTER taluka");
    }
    if (!settColNames.includes("sarpanch_name")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN sarpanch_name VARCHAR(255) DEFAULT 'Smt. Anusaya R. Patil (Sarpanch)' AFTER state");
    }
    if (!settColNames.includes("sarpanch_photo")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN sarpanch_photo VARCHAR(255) NULL AFTER sarpanch_name");
    }
    if (!settColNames.includes("gram_sevak_name")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN gram_sevak_name VARCHAR(255) DEFAULT 'Shri. Ramesh S. Patil (Gram Sevak)' AFTER sarpanch_photo");
    }
    if (!settColNames.includes("gram_sevak_photo")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN gram_sevak_photo VARCHAR(255) NULL AFTER gram_sevak_name");
    }
    if (!settColNames.includes("secretary_name")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN secretary_name VARCHAR(255) DEFAULT 'Shri. Suresh Deshmukh (Panchayat Secretary)' AFTER gram_sevak_photo");
    }
    if (!settColNames.includes("secretary_photo")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN secretary_photo VARCHAR(255) NULL AFTER secretary_name");
    }
    if (!settColNames.includes("office_address")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN office_address VARCHAR(255) DEFAULT 'Gram Panchayat Bhavan, Main Chowk, Sundarpur - 416001' AFTER secretary_photo");
    }
    if (!settColNames.includes("office_email")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN office_email VARCHAR(255) DEFAULT 'gp.sundarpur@gov.in' AFTER office_address");
    }
    if (!settColNames.includes("office_hours")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN office_hours VARCHAR(255) DEFAULT 'Monday to Saturday: 10:00 AM – 05:30 PM (Closed 2nd & 4th Saturday)' AFTER office_email");
    }
    if (!settColNames.includes("intro_text")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN intro_text TEXT NULL AFTER office_hours");
    }
    if (!settColNames.includes("intro_text_mr")) {
      await pool.query("ALTER TABLE village_settings ADD COLUMN intro_text_mr TEXT NULL AFTER intro_text");
    }

    // Set defaults if current row has empty fields
    await pool.query(`
      UPDATE village_settings 
      SET 
        taluka = COALESCE(taluka, 'Karveer'),
        state = COALESCE(state, 'Maharashtra'),
        sarpanch_name = COALESCE(sarpanch_name, 'Smt. Anusaya R. Patil (Sarpanch)'),
        gram_sevak_name = COALESCE(gram_sevak_name, 'Shri. Ramesh S. Patil (Gram Sevak)'),
        secretary_name = COALESCE(secretary_name, 'Shri. Suresh Deshmukh (Panchayat Secretary)'),
        office_address = COALESCE(office_address, 'Gram Panchayat Bhavan, Main Market Chowk, Sundarpur, Maharashtra - 416001'),
        office_email = COALESCE(office_email, 'gp.sundarpur@gov.in'),
        office_hours = COALESCE(office_hours, 'Monday to Saturday: 10:00 AM – 05:30 PM (Closed 2nd & 4th Saturday)'),
        intro_text = COALESCE(intro_text, 'Welcome to the official e-Governance and Citizen Administration Portal of Gram Panchayat Sundarpur. Committed to sustainable village development, transparent public administration, reliable water supply, and prompt citizen grievance redressal.'),
        intro_text_mr = COALESCE(intro_text_mr, 'ग्रामपंचायत सुंदरपूरच्या अधिकृत ई-प्रशासन व नागरिक सेवा पोर्टलवर आपले सहर्ष स्वागत आहे. शाश्वत ग्रामीण विकास, पारदर्शक कारभार, समन्यायी पाणी पुरवठा आणि तत्पर तक्रार निवारणासाठी कटिबद्ध.')
      WHERE id = 'current'
    `);

    // Ensure properties table has seed records if empty
    const [propCount] = await pool.query("SELECT COUNT(*) as count FROM properties");
    if (propCount[0].count === 0) {
      console.log("🏡 Seeding default village properties...");
      await pool.query(`
        INSERT INTO properties 
          (id, property_number, owner_citizen_id, owner_name, ward_area, property_type, address, water_meter_no, connection_type, annual_tax)
        VALUES
          ('PROP-101', 'H-104', 'CIT-101', 'Tukaram Shinde', 'Ward 1 - Patel Falia (North)', 'Residential', 'House #14, Patel Falia Road', 'MET-101-W1', 'Domestic Metered Tap', 250.00),
          ('PROP-102', 'H-208', 'CIT-102', 'Savita Devi', 'Ward 4 - Harijan Basti / East Colony', 'Residential', 'House #38, East Colony Circle', 'MET-102-W4', 'Domestic Metered Tap', 250.00),
          ('PROP-103', 'C-305', NULL, 'Gram Panchayat Community Center', 'Ward 2 - Temple Chowk & Main Bazar', 'Institutional', 'Main Bazar Chowk', 'MET-305-GP', 'Commercial Connection', 500.00)
        ON DUPLICATE KEY UPDATE property_number = VALUES(property_number)
      `);

      // Link citizens to their seeded properties
      await pool.query("UPDATE citizens SET property_id = 'PROP-101', property_no = 'H-104' WHERE id = 'CIT-101'");
      await pool.query("UPDATE citizens SET property_id = 'PROP-102', property_no = 'H-208' WHERE id = 'CIT-102'");
      await pool.query("UPDATE water_bills SET property_id = 'PROP-101' WHERE citizen_id = 'CIT-101'");
      await pool.query("UPDATE water_bills SET property_id = 'PROP-102' WHERE citizen_id = 'CIT-102'");
      await pool.query("UPDATE taxes_charges SET property_id = 'PROP-101' WHERE citizen_id = 'CIT-101'");
      await pool.query("UPDATE taxes_charges SET property_id = 'PROP-102' WHERE citizen_id = 'CIT-102'");
    }
    // 8. Table: applications (Unified Complaints, RTI, Application Letters, Certificates, and GP Requests)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(50) PRIMARY KEY,
        reference_no VARCHAR(100) UNIQUE NOT NULL,
        citizen_id VARCHAR(50) NULL,
        applicant_name VARCHAR(255) NOT NULL,
        applicant_phone VARCHAR(20) NOT NULL,
        applicant_email VARCHAR(255) NULL,
        ward_area VARCHAR(255) NOT NULL,
        property_no VARCHAR(100) NULL,
        category VARCHAR(100) NOT NULL,
        sub_type VARCHAR(100) NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        urgency ENUM('Normal', 'High', 'Critical') DEFAULT 'Normal',
        status ENUM('Submitted', 'Under Review', 'Additional Information Required', 'Assigned', 'In Progress', 'Replied', 'Transferred', 'Resolved', 'Closed', 'Rejected') DEFAULT 'Submitted',
        assigned_officer VARCHAR(255) NULL,
        assigned_at TIMESTAMP NULL,
        admin_notes TEXT NULL,
        official_response TEXT NULL,
        official_response_doc VARCHAR(255) NULL,
        is_rti TINYINT(1) DEFAULT 0,
        rti_fee_status VARCHAR(100) DEFAULT 'Not Applicable',
        rti_fee_receipt_no VARCHAR(100) NULL,
        rti_deadline DATE NULL,
        is_citizen_of_india TINYINT(1) DEFAULT 1,
        attachment_path VARCHAR(255) NULL,
        attachment_name VARCHAR(255) NULL,
        attachment_size INT NULL,
        is_draft TINYINT(1) DEFAULT 0,
        template_type VARCHAR(100) NULL,
        letter_content TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        INDEX idx_ref (reference_no),
        INDEX idx_citizen_app (citizen_id),
        INDEX idx_cat (category),
        INDEX idx_status_app (status),
        INDEX idx_rti (is_rti),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB;
    `);

    // 9. Table: application_history (Audit Trail for Administrative Actions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS application_history (
        id VARCHAR(50) PRIMARY KEY,
        application_id VARCHAR(50) NOT NULL,
        previous_status VARCHAR(50) NULL,
        new_status VARCHAR(50) NOT NULL,
        action_by VARCHAR(100) NOT NULL,
        action_role VARCHAR(50) NOT NULL DEFAULT 'admin',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_app_hist (application_id),
        INDEX idx_hist_created (created_at)
      ) ENGINE=InnoDB;
    `);

    // 10. Table: gram_panchayat_tasks (Daily Work Register & Staff Task Assignment)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gram_panchayat_tasks (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        ward_area VARCHAR(255) NOT NULL,
        assigned_to VARCHAR(255) NOT NULL,
        priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
        due_date DATE NOT NULL,
        status ENUM('Pending', 'In Progress', 'Completed', 'Delayed') DEFAULT 'Pending',
        completion_notes TEXT NULL,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_task_status (status),
        INDEX idx_task_assigned (assigned_to),
        INDEX idx_task_due (due_date)
      ) ENGINE=InnoDB;
    `);

    // 11. Table: public_notices (Village Announcements & Gram Sabha Notices)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public_notices (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        title_mr VARCHAR(255) NULL,
        category VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        content_mr TEXT NULL,
        issued_by VARCHAR(255) DEFAULT 'Gram Panchayat Sundarpur',
        is_pinned TINYINT(1) DEFAULT 0,
        publish_date DATE NOT NULL,
        expiry_date DATE NULL,
        attachment_path VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notice_cat (category),
        INDEX idx_notice_pub (publish_date)
      ) ENGINE=InnoDB;
    `);

    try {
      await pool.query("ALTER TABLE applications MODIFY rti_fee_status VARCHAR(100) DEFAULT 'Not Applicable'");
    } catch (colErr) {
      // Column alteration handled or table freshly created
    }

    // Migrate any existing community_reports into applications
    const [existingAppsCount] = await pool.query("SELECT COUNT(*) as count FROM applications");

    if (existingAppsCount[0].count === 0) {
      console.log("📝 Initializing applications and seeding Gram Panchayat registers...");

      // Copy from community_reports if any exist
      const [crRows] = await pool.query("SELECT * FROM community_reports");
      for (const cr of crRows) {
        const refNo = `CMP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
        await pool.query(`
          INSERT INTO applications (
            id, reference_no, citizen_id, applicant_name, applicant_phone, ward_area, category,
            subject, description, urgency, status, official_response, resolved_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'Water Supply / Water Quality Complaint', ?, ?, ?, ?, ?, ?, ?)
        `, [
          `APP-${cr.id}`,
          refNo,
          cr.citizen_id || null,
          cr.name,
          cr.phone,
          cr.area,
          `Water Supply Issue: ${cr.problem_type}`,
          cr.description,
          cr.urgency || 'Normal',
          cr.status === 'Pending' ? 'Submitted' : (cr.status === 'Resolved' ? 'Resolved' : 'In Progress'),
          cr.admin_response,
          cr.resolved_at,
          cr.created_at
        ]);
      }

      // Seed comprehensive sample applications & RTI cases
      await pool.query(`
        INSERT INTO applications (
          id, reference_no, citizen_id, applicant_name, applicant_phone, applicant_email,
          ward_area, property_no, category, sub_type, subject, description, urgency,
          status, assigned_officer, assigned_at, admin_notes, official_response,
          is_rti, rti_fee_status, rti_fee_receipt_no, rti_deadline, is_citizen_of_india
        ) VALUES 
        (
          'APP-2026-001', 'RTI-2026-1001', 'CIT-101', 'Tukaram Shinde', '9765443322', 'tukaram.shinde@gmail.com',
          'Ward 1 - Patel Falia (North)', 'H-104', 'RTI (Right to Information) Application', 'Panchayat Fund Expenditure',
          'Details of funds spent on Patel Falia Pipeline Maintenance in FY 2025-26',
          'Kindly provide certified copies of work orders, contractor bills, and completion certificates for the water pipeline replacement carried out in Ward 1 between April 2025 and March 2026.',
          'Normal', 'Under Review', 'Ramesh Patil (Gram Sevak / PIO)', NOW(),
          'Application verified. PIO has retrieved accounts file #2025-W1. Response under drafting.',
          'Your RTI application dated 12/10/2026 has been admitted under Section 6(1) of the RTI Act 2005. Records are being collated by the PIO.',
          1, 'Prescribed Fee Paid', 'GP-RTI-REC-8821', DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 1
        ),
        (
          'APP-2026-002', 'APP-2026-2002', 'CIT-102', 'Savita Devi', '9890223344', 'savita.devi@gmail.com',
          'Ward 4 - Harijan Basti / East Colony', 'H-208', 'Certificate or Document Request', 'Residence Certificate (रहिवासी दाखला)',
          'Application for Official Residence Certificate for Bank Account',
          'I require a verified Gram Panchayat Residence Certificate for opening a bank account and subsidy scheme application under Jal Jeevan Mission.',
          'Normal', 'Resolved', 'Ramesh Patil (Gram Sevak)', NOW(),
          'Document verification completed against Property Register H-208.',
          'Residence Certificate verified and issued. Please collect the stamped copy from the Gram Panchayat counter during office hours (10:00 AM - 05:00 PM).',
          0, 'Not Applicable', NULL, NULL, 1
        ),
        (
          'APP-2026-003', 'REQ-2026-3003', 'CIT-101', 'Tukaram Shinde', '9765443322', 'tukaram.shinde@gmail.com',
          'Ward 1 - Patel Falia (North)', 'H-104', 'Sanitation / Drainage / Road / Streetlight', 'Streetlight Repair',
          'Repair of 2 non-functioning streetlights near North Patel Falia Well',
          'The LED streetlights on pole #12 and #13 have been non-functional for the past 5 days causing darkness and safety hazards near the public well at night.',
          'High', 'In Progress', 'Sunil Jadhav (Lineman / Electrician)', NOW(),
          'Assigned to village lineman Sunil Jadhav. Replacement LED choke requisitioned from store.',
          'Gram Panchayat has logged the maintenance ticket. Lineman Sunil Jadhav has visited the spot; replacement parts will be fitted today.',
          0, 'Not Applicable', NULL, NULL, 1
        ),
        (
          'APP-2026-004', 'APP-2026-4004', NULL, 'Ganesh Pandurang More', '9822446688', 'ganesh.more@rediffmail.com',
          'Ward 3 - Vithal Mandir Area', 'H-312', 'Property / House Tax Request', 'Assessment Correction',
          'Correction of built-up area in House Tax Assessment Register',
          'The recent annual tax notice shows 1,200 sq.ft residential area whereas actual registered built-up area is 850 sq.ft as per Gram Panchayat building permission records.',
          'Normal', 'Submitted', 'Suresh Deshmukh (Tax Inspector)', NOW(),
          'Pending physical inspection by Gram Panchayat tax clerk.',
          NULL,
          0, 'Not Applicable', NULL, NULL, 1
        )
      `);

      // Seed audit history for sample application
      await pool.query(`
        INSERT INTO application_history (id, application_id, previous_status, new_status, action_by, action_role, notes)
        VALUES 
          ('HIST-001', 'APP-2026-001', 'Submitted', 'Under Review', 'Ramesh Patil (Gram Sevak / PIO)', 'admin', 'RTI Application admitted; statutory 30-day timeline started.'),
          ('HIST-002', 'APP-2026-002', 'Submitted', 'In Progress', 'Ramesh Patil (Gram Sevak)', 'admin', 'Property verification verified against tax register.'),
          ('HIST-003', 'APP-2026-002', 'In Progress', 'Resolved', 'Ramesh Patil (Gram Sevak)', 'admin', 'Certificate signed and made ready for collection.'),
          ('HIST-004', 'APP-2026-003', 'Submitted', 'In Progress', 'Ramesh Patil (Gram Sevak)', 'admin', 'Task delegated to lineman Sunil Jadhav.')
      `);
    }

    // Seed sample Gram Panchayat Tasks if empty
    const [taskCount] = await pool.query("SELECT COUNT(*) as count FROM gram_panchayat_tasks");
    if (taskCount[0].count === 0) {
      console.log("🛠️ Seeding Gram Panchayat maintenance task register...");
      await pool.query(`
        INSERT INTO gram_panchayat_tasks (id, title, category, ward_area, assigned_to, priority, due_date, status, completion_notes, created_by)
        VALUES
          ('TSK-101', 'Quarterly Bleaching Powder Chlorination of Overhead Tank #1', 'Water Supply', 'Ward 1 - Patel Falia (North)', 'Anil Kadam (Pump Operator)', 'High', DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), 'In Progress', 'Chemical dose calculated as per Jal Suraksha manual.', 'Ramesh Patil (Gram Sevak)'),
          ('TSK-102', 'Fix pipeline leakage on Main Bazar pipeline junction', 'Water Supply', 'Ward 2 - Temple Chowk & Main Bazar', 'Sunil Jadhav (Lineman)', 'Critical', CURRENT_DATE, 'Pending', 'Valve shutdown scheduled between 12 PM - 3 PM.', 'Ramesh Patil (Gram Sevak)'),
          ('TSK-103', 'Drainage desilting before upcoming monsoon', 'Sanitation', 'Ward 4 - Harijan Basti / East Colony', 'Sanitation Gang A', 'Medium', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), 'Pending', 'Focus on eastern storm drain channel.', 'Ramesh Patil (Gram Sevak)'),
          ('TSK-104', 'Replace damaged street light poles #12 and #13', 'Streetlight Maintenance', 'Ward 1 - Patel Falia (North)', 'Sunil Jadhav (Lineman)', 'High', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), 'In Progress', 'Parts delivered from tehsil electricity store.', 'Ramesh Patil (Gram Sevak)')
      `);
    }

    // Seed sample Public Notices if empty
    const [noticeCount] = await pool.query("SELECT COUNT(*) as count FROM public_notices");
    if (noticeCount[0].count === 0) {
      console.log("📢 Seeding official Gram Panchayat public notices...");
      await pool.query(`
        INSERT INTO public_notices (id, title, title_mr, category, content, content_mr, issued_by, is_pinned, publish_date, expiry_date)
        VALUES
          (
            'NOT-001',
            'Notice of Special Gram Sabha on Village Water Conservation & Drought Preparedness',
            'गाव पाणी संवर्धन व दुष्काळ नियोजन विशेष ग्रामसभा सूचना',
            'Gram Sabha',
            'All residents of Village Sundarpur are cordially invited to attend the Special Gram Sabha on Saturday at 11:00 AM in the Gram Panchayat Hall. Agenda: Drinking water rationing, tanker logistics, and watershed maintenance.',
            'सुंदरपूर गावातील सर्व ग्रामस्थांना कळविण्यात येते की, शनिवार रोजी सकाळी ११:०० वाजता ग्रामपंचायत सभागृहात विशेष ग्रामसभेचे आयोजन करण्यात आले आहे. विषय: उन्हाळी पाणी पुरवठा नियोजन, टँकर मागणी व पाण्याचे समन्यायी वाटप.',
            'Sarpanch & Gram Sevak, GP Sundarpur', 1, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY)
          ),
          (
            'NOT-002',
            'House Tax and Water Charges Rebate Deadline Notice',
            'घरपट्टी व पाणीपट्टी आगाऊ भरणा सवलत मुदत सूचना',
            'Tax Deadline',
            'Residents paying full annual property tax and water charges before 30th November are eligible for a 5% prompt payment concession. Pay online through this portal or at the Panchayat cash counter.',
            'चालू आर्थिक वर्षातील घरपट्टी व पाणीपट्टी ३० नोव्हेंबर पूर्वी पूर्ण भरणाऱ्या मालमत्ताधारकांना ५% विशेष सवलत देण्यात येईल. ग्रामपंचायत पोर्टलवरून अथवा कार्यालयात भरणा करावा.',
            'Tax Department, GP Sundarpur', 1, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
          ),
          (
            'NOT-003',
            'Drinking Water Advisory: Boil Before Consumption Notice',
            'पिण्याचे पाणी उकळून व गाळून पिण्याबाबत सार्वजनिक सूचना',
            'Health & Sanitation',
            'Due to seasonal temperature fluctuations and pipeline scouring, residents are advised to boil drinking water for at least 10 minutes. Chlorine tablets are available free of cost at the Sub-Center.',
            'हवामानातील बदलांमुळे आरोग्याच्या दृष्टीने सर्व नागरिकांनी पिण्याचे पाणी किमान १० मिनिटे उकळून व गाळून प्यावे. आरोग्य उपकेंद्रात क्लोरीन गोळ्या मोफत उपलब्ध आहेत.',
            'Village Health & Sanitation Committee', 0, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 20 DAY)
          )
      `);
    }

    console.log("✅ All Year-Round Gram Panchayat modules migrated and initialized successfully!");
  } catch (err) {
    console.warn("Migration column check note:", err.message);
  }

  // 7. Seed initial admin and citizen users if users table is empty
  const [usersCount] = await pool.query("SELECT COUNT(*) as count FROM users");
  if (usersCount[0].count === 0) {
    console.log("🌱 Seeding default Admin and Citizen accounts...");

    const adminHash = await bcrypt.hash("Admin@123", 10);
    const citizen1Hash = await bcrypt.hash("Citizen@123", 10);
    const citizen2Hash = await bcrypt.hash("Citizen@123", 10);

    // 1. Admin user
    await pool.query(`
      INSERT INTO users (id, login_id, password_hash, role, full_name, phone, email, is_active)
      VALUES (?, ?, ?, 'admin', ?, ?, ?, 1)
    `, ["usr-admin-1", "admin", adminHash, "Ramesh Patil (Gram Sevak)", "9822114455", "gramsevak@sundarpur.gov.in"]);

    // 2. Citizen 1: Tukaram Shinde
    await pool.query(`
      INSERT INTO citizens (id, user_id, full_name, phone, email, property_no, ward_area, family_members, meter_no, connection_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `, ["CIT-101", "usr-cit-101", "Tukaram Shinde", "9765443322", "tukaram.shinde@gmail.com", "House #14, Patel Falia", "Ward 1 - Patel Falia (North)", 5, "MET-101-W1", "Domestic Metered Tap"]);

    await pool.query(`
      INSERT INTO users (id, login_id, password_hash, role, full_name, phone, email, is_active, citizen_id)
      VALUES (?, ?, ?, 'citizen', ?, ?, ?, 1, ?)
    `, ["usr-cit-101", "CIT-101", citizen1Hash, "Tukaram Shinde", "9765443322", "tukaram.shinde@gmail.com", "CIT-101"]);

    // 3. Citizen 2: Savita Devi
    await pool.query(`
      INSERT INTO citizens (id, user_id, full_name, phone, email, property_no, ward_area, family_members, meter_no, connection_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `, ["CIT-102", "usr-cit-102", "Savita Devi", "9890223344", "savita.devi@gmail.com", "House #38, Harijan Basti", "Ward 4 - Harijan Basti / East Colony", 4, "MET-102-W4", "Domestic Metered Tap"]);

    await pool.query(`
      INSERT INTO users (id, login_id, password_hash, role, full_name, phone, email, is_active, citizen_id)
      VALUES (?, ?, ?, 'citizen', ?, ?, ?, 1, ?)
    `, ["usr-cit-102", "CIT-102", citizen2Hash, "Savita Devi", "9890223344", "savita.devi@gmail.com", "CIT-102"]);

    // Seed sample bills
    await pool.query(`
      INSERT INTO water_bills (id, citizen_id, billing_period, amount, paid_amount, due_date, status)
      VALUES 
        ('BILL-2026-101', 'CIT-101', 'September 2026', 150.00, 150.00, '2026-10-05', 'Paid'),
        ('BILL-2026-102', 'CIT-101', 'October 2026', 180.00, 0.00, '2026-11-05', 'Unpaid'),
        ('BILL-2026-103', 'CIT-102', 'September 2026', 120.00, 120.00, '2026-10-05', 'Paid'),
        ('BILL-2026-104', 'CIT-102', 'October 2026', 140.00, 0.00, '2026-11-05', 'Unpaid')
    `);

    // Seed sample payment for paid bills
    await pool.query(`
      INSERT INTO payments (id, bill_id, citizen_id, amount, payment_date, payment_mode, receipt_no, notes)
      VALUES
        ('PAY-2026-01', 'BILL-2026-101', 'CIT-101', 150.00, '2026-10-02 10:30:00', 'UPI', 'REC-0926-101', 'Paid via Gram Panchayat Portal'),
        ('PAY-2026-02', 'BILL-2026-103', 'CIT-102', 120.00, '2026-10-04 14:15:00', 'Cash', 'REC-0926-103', 'Cash counter receipt')
    `);

    // Seed sample taxes & charges
    await pool.query(`
      INSERT INTO taxes_charges (id, citizen_id, charge_type, description, amount, due_date, status)
      VALUES
        ('TAX-2026-01', 'CIT-101', 'Water Conservation Cess', 'Annual drought resilience cess 2026', 200.00, '2026-11-30', 'Unpaid'),
        ('TAX-2026-02', 'CIT-101', 'Tap Connection Maintenance', 'Annual pipeline valve check', 50.00, '2026-11-30', 'Paid'),
        ('TAX-2026-03', 'CIT-102', 'Water Conservation Cess', 'Annual drought resilience cess 2026', 200.00, '2026-11-30', 'Unpaid')
    `);

    console.log("✅ Seed users, bills, payments, and taxes created successfully!");
  }

  // Run Gram Panchayat Services and Audit Trail migrations
  try {
    const { migrateServicesAndAudit } = await import("./migrate_services_audit.js");
    await migrateServicesAndAudit();
  } catch (err) {
    console.warn("Services migration warning:", err.message);
  }

  console.log("✅ Database schema migration is complete and up-to-date.");
}

// If run directly
if (process.argv[1]?.endsWith("migrate.js")) {
  runMigrations().then(() => process.exit(0)).catch(e => {
    console.error("Migration error:", e);
    process.exit(1);
  });
}
