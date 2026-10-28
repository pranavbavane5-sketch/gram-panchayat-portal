import pool from './db.js';

export async function migrateServicesAndAudit() {
  console.log("🔄 Running Services & Audit Trail migration...");

  // 1. Table: gp_services
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gp_services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_key VARCHAR(100) UNIQUE NOT NULL,
      title_en VARCHAR(255) NOT NULL,
      title_mr VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      icon VARCHAR(50) DEFAULT '💧',
      badge_text_en VARCHAR(100) DEFAULT 'Online Service',
      badge_text_mr VARCHAR(100) DEFAULT 'ऑनलाइन सेवा',
      badge_type VARCHAR(50) DEFAULT 'online',
      desc_en TEXT NOT NULL,
      desc_mr TEXT NOT NULL,
      eligibility_en TEXT,
      eligibility_mr TEXT,
      required_docs_en TEXT,
      required_docs_mr TEXT,
      contact_info_en VARCHAR(255),
      contact_info_mr VARCHAR(255),
      button_label_en VARCHAR(100) DEFAULT 'Apply Online',
      button_label_mr VARCHAR(100) DEFAULT 'अर्ज करा',
      nav_target VARCHAR(100) DEFAULT 'report',
      nav_extra_attrs JSON,
      display_order INT DEFAULT 1,
      is_enabled TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_enabled (is_enabled),
      INDEX idx_order (display_order)
    ) ENGINE=InnoDB;
  `);

  // Ensure display_order column and index exist without altering existing data
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM gp_services LIKE 'display_order'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE gp_services ADD COLUMN display_order INT DEFAULT 1 AFTER nav_extra_attrs, ADD INDEX idx_order (display_order)");
    }
    await pool.query("UPDATE gp_services SET display_order = id WHERE display_order IS NULL OR display_order = 0");
  } catch (colErr) {
    console.warn("display_order column verify warning:", colErr.message);
  }

  // 2. Table: admin_audit_logs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100),
      admin_id VARCHAR(100),
      admin_name VARCHAR(255),
      details TEXT,
      ip_address VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_action (action),
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB;
  `);

  // Seed default 14 services if empty
  const [serviceCount] = await pool.query("SELECT COUNT(*) as count FROM gp_services");
  if (serviceCount[0].count === 0) {
    console.log("🌟 Seeding 14 official Gram Panchayat services...");
    const services = [
      {
        service_key: "water_supply",
        title_en: "Water Supply & Water Tank Monitoring",
        title_mr: "पाणी पुरवठा व जलसाठा निरीक्षण",
        category: "Civic Utilities",
        icon: "💧",
        badge_text_en: "Live Telemetry",
        badge_text_mr: "थेट माहिती",
        badge_type: "online",
        desc_en: "Track real-time reservoir levels, overhead tank storage percentages, and scheduled tap supply timings across all village wards.",
        desc_mr: "गावातील सर्व वॉर्डांमधील जलसाठा, पाण्याची पातळी आणि दैनंदिन पाणी पुरवठा वेळापत्रक तपासा.",
        eligibility_en: "All village residents and agricultural landowners.",
        eligibility_mr: "गावातील सर्व नागरिक आणि शेतकरी बंधू.",
        required_docs_en: "None. Open civic telemetry.",
        required_docs_mr: "काहीही नाही. सार्वजनिक खुली माहिती.",
        contact_info_en: "Water Supply Operator / Gram Sevak",
        contact_info_mr: "पाणी पुरवठा कर्मचारी / ग्रामसेवक",
        button_label_en: "View Water Levels",
        button_label_mr: "जलपातळी पहा",
        nav_target: "storage",
        nav_extra_attrs: JSON.stringify({}),
        display_order: 1,
        is_enabled: 1
      },
      {
        service_key: "water_bills",
        title_en: "Water Bills & Payment Records",
        title_mr: "पाणीपट्टी बिले व भरणा नोंदी",
        category: "Taxes & Revenue",
        icon: "🧾",
        badge_text_en: "Billing & Counter",
        badge_text_mr: "बिल व पावती",
        badge_type: "counter",
        desc_en: "View issued water tariff notices, domestic meter charges, payment due dates, and verified Panchayat payment receipts.",
        desc_mr: "नळ पाणीपट्टी बिले पहा, ऑनलाइन किंवा ग्रामपंचायत कार्यालयात भरणा करा आणि अधिकृत पावती मिळवा.",
        eligibility_en: "Registered domestic and commercial tap water consumers.",
        eligibility_mr: "नोंदणीकृत घरगुती व व्यावसायिक नळधारक.",
        required_docs_en: "Consumer / Citizen ID or Property House Number.",
        required_docs_mr: "ग्राहक / नागरिक आयडी किंवा घर क्रमांक.",
        contact_info_en: "Panchayat Tax Clerk (Mon - Sat, 10 AM - 5 PM)",
        contact_info_mr: "ग्रामपंचायत कर लिपिक (सोम - शनि, सकाळी १० ते ५)",
        button_label_en: "Check Bills",
        button_label_mr: "बिले तपासा",
        nav_target: "citizen",
        nav_extra_attrs: JSON.stringify({ "data-cit-tab": "bills" }),
        display_order: 2,
        is_enabled: 1
      },
      {
        service_key: "property_tax",
        title_en: "Property & House Tax Information",
        title_mr: "घरपट्टी व मालमत्ता कर माहिती",
        category: "Taxes & Revenue",
        icon: "🏡",
        badge_text_en: "Tax Assessment",
        badge_text_mr: "कर आकारणी",
        badge_type: "statutory",
        desc_en: "Check village assessment registers (नमुना ८), annual house tax levies, lighting and health cess, and clearance certificates.",
        desc_mr: "मालमत्ता कर आकारणी (नमुना ८), दिवाबत्ती व आरोग्य कर विवरण तपासा आणि थकबाकी नमुना दाखला मिळवा.",
        eligibility_en: "Registered property and plot owners within Gram Panchayat limits.",
        eligibility_mr: "ग्रामपंचायत हद्दीतील सर्व नोंदणीकृत मिळकतधारक.",
        required_docs_en: "Namuna 8 extract or previous tax receipt.",
        required_docs_mr: "नमुना ८ उतारा किंवा मागील वर्षाची कर पावती.",
        contact_info_en: "Village Development Officer (Gram Sevak)",
        contact_info_mr: "ग्राम विकास अधिकारी (ग्रामसेवक)",
        button_label_en: "Property Tax",
        button_label_mr: "मालमत्ता कर",
        nav_target: "citizen",
        nav_extra_attrs: JSON.stringify({ "data-cit-tab": "tax" }),
        display_order: 3,
        is_enabled: 1
      },
      {
        service_key: "citizen_reg",
        title_en: "Citizen Registration & Household Records",
        title_mr: "नागरिक नोंदणी व कुटुंब तपशील",
        category: "Certificates & Identity",
        icon: "👨‍👩‍👧‍👦",
        badge_text_en: "Citizen Register",
        badge_text_mr: "नागरिक नोंदणी",
        badge_type: "online",
        desc_en: "Register your family in the village resident directory, link property house numbers, and access digital citizen privileges.",
        desc_mr: "ग्रामपंचायत नागरिक नोंदवहीत कुटुंबाची नोंदणी करा, घर क्रमांक लिंक करा आणि शासकीय सेवांचा लाभ घ्या.",
        eligibility_en: "Permanent or long-term residents of the village.",
        eligibility_mr: "गावातील कायमस्वरूपी अथवा दीर्घकालीन रहिवासी.",
        required_docs_en: "Aadhaar Card, Ration Card, House Number proof.",
        required_docs_mr: "आधार कार्ड, रेशन कार्ड, घर क्रमांक पुरावा.",
        contact_info_en: "Citizen Seva Kendra / Gram Sevak",
        contact_info_mr: "नागरिक सेवा केंद्र / ग्रामसेवक",
        button_label_en: "Citizen Records",
        button_label_mr: "नागरिक नोंदी",
        nav_target: "citizen",
        nav_extra_attrs: JSON.stringify({ "data-cit-tab": "profile" }),
        display_order: 4,
        is_enabled: 1
      },
      {
        service_key: "birth_death_cert",
        title_en: "Birth & Death Certificate Information",
        title_mr: "जन्म व मृत्यू दाखला माहिती",
        category: "Certificates & Identity",
        icon: "📜",
        badge_text_en: "Offline Verification",
        badge_text_mr: "काऊंटर पडताळणी",
        badge_type: "counter",
        desc_en: "Guidance on statutory registration within 21 days under the RBD Act. Verification & physical collection require Gram Panchayat counter visit.",
        desc_mr: "जन्म-मृत्यू नोंदणी कायद्यानुसार २१ दिवसांत नोंदणी करणे बंधनकारक. पडताळणी व दाखला संकलन ग्रामपंचायत काऊंटरवर.",
        eligibility_en: "Parents, legal guardians, or nearest relatives.",
        eligibility_mr: "पालक, कायदेशीर वारसदार अथवा जवळचे नातेवाईक.",
        required_docs_en: "Hospital birth/death slip, crematorium receipt, applicant ID.",
        required_docs_mr: "दवाखान्याचा दाखला, स्मशानभूमी पावती, अर्जदाराचा पुरावा.",
        contact_info_en: "Registrar of Births & Deaths (Gram Sevak)",
        contact_info_mr: "जन्म-मृत्यू निबंधक (ग्रामसेवक)",
        button_label_en: "Apply / View Info",
        button_label_mr: "माहिती व अर्ज",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-cat": "Certificate or Document Request", "data-app-sub": "Birth / Death Certificate Inquiry" }),
        display_order: 5,
        is_enabled: 1
      },
      {
        service_key: "residence_cert",
        title_en: "Residence & Other Certificate Requests",
        title_mr: "रहिवासी व इतर दाखले अर्ज",
        category: "Certificates & Identity",
        icon: "📑",
        badge_text_en: "Online Request",
        badge_text_mr: "ऑनलाइन अर्ज",
        badge_type: "online",
        desc_en: "Submit requests for Residence Certificate (रहिवासी दाखला), Toilet Certificate, and Gram Panchayat No-Objection Certificates (NOC).",
        desc_mr: "रहिवासी दाखला, शौचालय प्रमाणपत्र, वीज जोडणी ना-हरकत प्रमाणपत्र (NOC) साठी अर्ज करा.",
        eligibility_en: "Resident families residing within village boundaries.",
        eligibility_mr: "ग्रामपंचायत हद्दीत राहणारे सर्व रहिवासी कुटुंब.",
        required_docs_en: "Aadhaar Card, Ration Card, Electricity bill copy.",
        required_docs_mr: "आधार कार्ड, रेशन कार्ड, वीज बिल प्रत.",
        contact_info_en: "Panchayat Secretary (Room #2)",
        contact_info_mr: "ग्रामपंचायत सचिव (कक्ष क्र. २)",
        button_label_en: "Generate Letter",
        button_label_mr: "अर्ज तयार करा",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-letter-tpl": "residence" }),
        display_order: 6,
        is_enabled: 1
      },
      {
        service_key: "new_water_conn",
        title_en: "New Water Connection Applications",
        title_mr: "नवीन नळ जोडणी अर्ज",
        category: "Civic Utilities",
        icon: "🚰",
        badge_text_en: "New Application",
        badge_text_mr: "नळ जोडणी अर्ज",
        badge_type: "online",
        desc_en: "Apply for a new household pipeline water connection under Har Ghar Jal / Jal Jeevan Mission with property ownership proof.",
        desc_mr: "हर घर जल / जल जीवन मिशन अंतर्गत नवीन घरगुती नळ कनेक्शनसाठी अर्ज करा.",
        eligibility_en: "Household owners without existing sanctioned tap water connection.",
        eligibility_mr: "घराचे मालक ज्यांच्याकडे सध्या अधिकृत नळ कनेक्शन नाही.",
        required_docs_en: "Property tax receipt (Namuna 8), ownership affidavit, route sketch.",
        required_docs_mr: "मालमत्ता कर पावती (नमुना ८), मालकी हक्क पुरावा.",
        contact_info_en: "Panchayat Jal Suraksha Committee",
        contact_info_mr: "ग्रामपंचायत जल सुरक्षा समिती",
        button_label_en: "Draft Application",
        button_label_mr: "अर्ज मसुदा",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-letter-tpl": "water_conn" }),
        display_order: 7,
        is_enabled: 1
      },
      {
        service_key: "streetlight_roads",
        title_en: "Streetlight & Road Maintenance Complaints",
        title_mr: "दिवाबत्ती व रस्ते दुरुस्ती तक्रार",
        category: "Public Works & Maintenance",
        icon: "💡",
        badge_text_en: "Maintenance",
        badge_text_mr: "दुरुस्ती व देखभाल",
        badge_type: "action",
        desc_en: "Report burnt streetlamps, damaged village pathways, and road culvert blockages for prompt maintenance crew dispatch.",
        desc_mr: "बंद असलेले पथदिवे, खराब रस्ते, खड्डे व पूल दुरुस्तीसाठी तक्रार नोंदवा.",
        eligibility_en: "Any village resident or traveler.",
        eligibility_mr: "गावातील कोणताही नागरिक अथवा प्रवासी.",
        required_docs_en: "Location landmark and pole identification number.",
        required_docs_mr: "परिसराचा पत्ता आणि विजेच्या खांबाचा क्रमांक.",
        contact_info_en: "Lineman Sunil Jadhav / Works Committee",
        contact_info_mr: "लाईनमन सुनील जाधव / बांधकाम समिती",
        button_label_en: "File Complaint",
        button_label_mr: "तक्रार नोंदवा",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-cat": "Sanitation / Drainage / Road / Streetlight", "data-app-sub": "Streetlight / Road Repair" }),
        display_order: 8,
        is_enabled: 1
      },
      {
        service_key: "sanitation_drainage",
        title_en: "Drainage, Sanitation & Waste Management",
        title_mr: "सांडपाणी, नाली व स्वच्छता व्यवस्थापन",
        category: "Public Works & Maintenance",
        icon: "🧹",
        badge_text_en: "Sanitation",
        badge_text_mr: "स्वच्छता अभियान",
        badge_type: "action",
        desc_en: "Report clogged village gutters, overflowing drains, waste dumping spots, or request bleaching powder mosquito disinfection.",
        desc_mr: "तुंबलेल्या गटारी, कचरा उचलणे, फॉगिंग व जंतुनाशक पावडर फवारणीसाठी विनंती करा.",
        eligibility_en: "Any ward resident.",
        eligibility_mr: "गावातील सर्व नागरिक.",
        required_docs_en: "Specific ward / falia name and nearest landmark.",
        required_docs_mr: "वॉर्ड किंवा गल्लीचे नाव आणि खुणेची जागा.",
        contact_info_en: "Village Sanitation Supervisor",
        contact_info_mr: "ग्राम स्वच्छता मुकादम",
        button_label_en: "File Request",
        button_label_mr: "विनंती नोंदवा",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-cat": "Sanitation / Drainage / Road / Streetlight", "data-app-sub": "Drainage / Sanitation" }),
        display_order: 9,
        is_enabled: 1
      },
      {
        service_key: "public_grievances",
        title_en: "Public Grievances & Complaint Tracking",
        title_mr: "नागरी तक्रारी व थेट ट्रॅकिंग",
        category: "Grievances & Welfare",
        icon: "📢",
        badge_text_en: "Public Grievance",
        badge_text_mr: "तक्रार निवारण",
        badge_type: "action",
        desc_en: "Lodge public grievances to Panchayat administration with automated reference IDs and track investigation milestones.",
        desc_mr: "ग्रामपंचायतीकडे नागरी समस्यांची तक्रार नोंदवा, युनिक रेफरन्स नंबर मिळवा आणि निवारण स्थिती ट्रॅक करा.",
        eligibility_en: "Any citizen residing in or having concerns in the village.",
        eligibility_mr: "गावातील सर्व नागरिक.",
        required_docs_en: "Statement of grievance and photo evidence (optional).",
        required_docs_mr: "तक्रारीचा तपशील आणि पुरावा फोटो (ऐच्छिक).",
        contact_info_en: "Grievance Redressal Officer (Gram Sevak)",
        contact_info_mr: "तक्रार निवारण अधिकारी (ग्रामसेवक)",
        button_label_en: "Track Grievance",
        button_label_mr: "तक्रार ट्रॅक करा",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-tab": "track" }),
        display_order: 10,
        is_enabled: 1
      },
      {
        service_key: "rti_guidance",
        title_en: "RTI (Right to Information) Application Guidance",
        title_mr: "माहितीचा अधिकार (RTI) मार्गदर्शन व अर्ज",
        category: "Information & RTI",
        icon: "⚖️",
        badge_text_en: "Statutory 30 Days",
        badge_text_mr: "३० दिवसांची मुदत",
        badge_type: "statutory",
        desc_en: "Official guidance and application submission under RTI Act 2005. Strictly tracked against the 30-day statutory resolution timeline.",
        desc_mr: "माहिती अधिकार अधिनियम २००५ अंतर्गत अर्ज नोंदणी व कायदेशीर ३० दिवसांच्या कालमर्यादेत माहिती मिळवा.",
        eligibility_en: "Any Citizen of India.",
        eligibility_mr: "भारताचा कोणताही नागरिक.",
        required_docs_en: "RTI Application text, Identity proof, Rs. 10 court fee stamp receipt.",
        required_docs_mr: "RTI अर्ज मसुदा, ओळख पुरावा, १० रु. कोर्ट फी पावती.",
        contact_info_en: "Public Information Officer (PIO) - Ramesh Patil",
        contact_info_mr: "जन माहिती अधिकारी (PIO) - रमेश पाटील",
        button_label_en: "Submit RTI",
        button_label_mr: "माहिती अधिकार अर्ज",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-cat": "RTI (Right to Information) Application" }),
        display_order: 11,
        is_enabled: 1
      },
      {
        service_key: "govt_schemes",
        title_en: "Government Schemes & Public Notices",
        title_mr: "शासकीय योजना व सार्वजनिक सूचना",
        category: "Grievances & Welfare",
        icon: "🏛️",
        badge_text_en: "Public Welfare",
        badge_text_mr: "शासकीय योजना",
        badge_type: "statutory",
        desc_en: "Stay informed on flagship state & central welfare programs: PM Awas Yojana, Sanjay Gandhi Niradhar, and borewell recharge grants.",
        desc_mr: "पंतप्रधान आवास योजना, संजय गांधी निराधार, शेततळे व विहीर पुनर्भरण अनुदानाबाबत अधिकृत सूचना पहा.",
        eligibility_en: "Eligible BPL, small farmers, and women self-help group members.",
        eligibility_mr: "पात्र दारिद्र्यरेषेखालील (BPL) कुटुंब, अल्पभूधारक शेतकरी व महिला बचत गट.",
        required_docs_en: "Income certificate, Caste certificate, Aadhaar, Bank Passbook.",
        required_docs_mr: "उत्पन्नाचा दाखला, जात प्रमाणपत्र, आधार कार्ड, बँक पासबुक.",
        contact_info_en: "Panchayat Welfare Desk",
        contact_info_mr: "ग्रामपंचायत समाजकल्याण कक्ष",
        button_label_en: "View Notices",
        button_label_mr: "सूचना पहा",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-tab": "notices" }),
        display_order: 12,
        is_enabled: 1
      },
      {
        service_key: "meeting_notices",
        title_en: "Meeting Notices & Village Development Updates",
        title_mr: "ग्रामसभा सूचना व विकास कामे",
        category: "Information & RTI",
        icon: "📋",
        badge_text_en: "Gram Sabha",
        badge_text_mr: "ग्रामसभा ठराव",
        badge_type: "counter",
        desc_en: "Access verified notices, meeting agendas, and citizen resolutions for Gram Sabha sessions, monthly meetings, and VWSC committee updates.",
        desc_mr: "नियमित ग्रामसभा, मासिक सभा, विषयपत्रिका, मंजूर ठराव आणि गाव विकास कामांचा आढावा पहा.",
        eligibility_en: "All registered voters on the village electoral roll.",
        eligibility_mr: "गावच्या मतदार यादीतील सर्व मतदार नागरिक.",
        required_docs_en: "Voter ID / Citizen ID.",
        required_docs_mr: "मतदार ओळखपत्र / नागरिक ओळख.",
        contact_info_en: "Sarpanch / Gram Sevak Office",
        contact_info_mr: "सरपंच / ग्रामसेवक कार्यालय",
        button_label_en: "Gram Sabha Schedule",
        button_label_mr: "ग्रामसभा वेळापत्रक",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-tab": "notices" }),
        display_order: 13,
        is_enabled: 1
      },
      {
        service_key: "letter_builder",
        title_en: "Application & Request Letter Generator",
        title_mr: "अधिकृत अर्ज व विनंती पत्र जनरेटर",
        category: "Certificates & Identity",
        icon: "✍️",
        badge_text_en: "Letter Builder",
        badge_text_mr: "अर्ज मसुदा",
        badge_type: "online",
        desc_en: "Draft standard Gram Panchayat application letters and official petitions in Marathi and English with instant print and PDF download.",
        desc_mr: "ग्रामपंचायतीच्या विविध सेवांसाठी अधिकृत मराठी व इंग्रजी अर्जांचे मसुदे तयार करा आणि त्वरित प्रिंट घ्या.",
        eligibility_en: "All village citizens.",
        eligibility_mr: "गावातील सर्व नागरिक.",
        required_docs_en: "Applicant particulars and reason for petition.",
        required_docs_mr: "अर्जदाराचे नाव, पत्ता आणि विनंतीचे कारण.",
        contact_info_en: "Gram Panchayat E-Seva Desk",
        contact_info_mr: "ग्रामपंचायत ई-सेवा कक्ष",
        button_label_en: "Open Letter Builder",
        button_label_mr: "पत्र जनरेटर उघडा",
        nav_target: "report",
        nav_extra_attrs: JSON.stringify({ "data-app-tab": "letter" }),
        display_order: 14,
        is_enabled: 1
      }
    ];

    for (const s of services) {
      await pool.query(`
        INSERT INTO gp_services (
          service_key, title_en, title_mr, category, icon,
          badge_text_en, badge_text_mr, badge_type,
          desc_en, desc_mr, eligibility_en, eligibility_mr,
          required_docs_en, required_docs_mr, contact_info_en, contact_info_mr,
          button_label_en, button_label_mr, nav_target, nav_extra_attrs,
          display_order, is_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        s.service_key, s.title_en, s.title_mr, s.category, s.icon,
        s.badge_text_en, s.badge_text_mr, s.badge_type,
        s.desc_en, s.desc_mr, s.eligibility_en, s.eligibility_mr,
        s.required_docs_en, s.required_docs_mr, s.contact_info_en, s.contact_info_mr,
        s.button_label_en, s.button_label_mr, s.nav_target, s.nav_extra_attrs,
        s.display_order, s.is_enabled
      ]);
    }
    console.log("✅ 14 official Gram Panchayat services seeded successfully!");
  }

  // Seed sample audit log
  const [auditCount] = await pool.query("SELECT COUNT(*) as count FROM admin_audit_logs");
  if (auditCount[0].count === 0) {
    await pool.query(`
      INSERT INTO admin_audit_logs (action, entity_type, entity_id, admin_id, admin_name, details, ip_address)
      VALUES
        ('SYSTEM_INIT', 'SYSTEM', 'SYS-01', 'usr-admin-01', 'Ramesh Patil (Gram Sevak)', 'Database migration and initial Gram Panchayat service catalog seeded.', '127.0.0.1')
    `);
    console.log("✅ Sample administrative audit log initialized.");
  }

  console.log("✅ Services & Audit Trail migration completed!");
}

if (process.argv[1]?.endsWith("migrate_services_audit.js")) {
  migrateServicesAndAudit().then(() => process.exit(0)).catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
  });
}
