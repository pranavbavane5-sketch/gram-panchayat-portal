// ==========================================================
// JALMITRA CENTRALIZED TRANSLATION DICTIONARY & I18N ENGINE
// English (Default) & Marathi (मराठी)
// ==========================================================

export const translations = {
  en: {
    // --- Brand & Announcements ---
    brand_title: "Gram Panchayat",
    brand_sub: "ग्रामपंचायत",
    official_gp_subtitle: "Official Gram Panchayat Citizen Services Portal",
    announcement_notice: "Notice:",
    announcement_text: "Water supply is in <strong>Rationing Mode</strong>. Please store water carefully and avoid wastage.",
    helpline_label: "Panchayat Helpline:",
    portal_active: "Active",
    status_connecting: "Connecting...",
    status_db_pending: "DB Pending",
    status_offline: "Offline",

    // --- Top Navigation & Roles ---
    nav_home: "Home",
    nav_storage: "Water Storage",
    nav_schedule: "Schedule",
    nav_report: "Report Problem",
    nav_citizen: "Citizen Portal",
    nav_admin: "Admin Portal",
    nav_login: "Login",
    nav_logout: "Logout",
    role_admin_badge: "Staff",
    role_citizen_badge: "Citizen",

    // --- Page 1: Home Dashboard ---
    hero_title: "Village Water Status & Drought Advisory",
    hero_desc: "Real-time village water overview. Check current reservoir and tank levels, review today's tap schedule, or request emergency tanker assistance.",
    last_updated: "Last Updated:",
    responsible_officer: "Responsible Officer:",
    reserve_title: "Village Water Reserve",
    reserve_status_normal: "Normal Level",
    reserve_status_low: "Low Level",
    reserve_status_critical: "Critical Level",
    reserve_status_rationing: "Rationing Mode",
    gauge_sub_text: "of village storage capacity available",
    gauge_footer_note: "<strong>Advisory:</strong> Supply hours restricted. Priority given to drinking water over agricultural use.",

    // Metric Cards (Home)
    metric_total_storage: "Total Water Storage",
    metric_total_storage_hint: "Across all village sources",
    metric_remaining_supply: "Daily Supply Remaining",
    metric_remaining_supply_hint: "At current consumption rate",
    metric_alert_level: "Storage Alert Level",
    metric_alert_level_hint: "Drought warning active",
    metric_tanker_status: "Tanker Supply Status",
    metric_tanker_status_hint: "Active emergency routes",

    // Quick Actions & Schedule Preview (Home)
    quick_actions_title: "Immediate Actions & Requests",
    quick_action_report_title: "Report Water Leakage / Low Pressure",
    quick_action_report_desc: "Submit a public complaint to Gram Panchayat. Immediate dispatch for pipeline bursts.",
    quick_action_storage_title: "Inspect Storage & Reserve Tanks",
    quick_action_storage_desc: "View exact live capacity across 5 village sources, open dug wells and community cisterns.",
    today_schedule_title: "Today's Water Distribution",
    today_schedule_sub: "Live tap pipeline schedule by ward",
    view_all_schedule: "View Full Village Timetable →",
    drought_tips_title: "Water Conservation Protocol in Effect",
    drought_tip_1: "Keep household storage containers tightly covered to avoid evaporation and contamination.",
    drought_tip_2: "Report dripping public standposts immediately to Panchayat lineman.",
    drought_tip_3: "Recycle kitchen wash-water for courtyard plants and livestock cleaning.",

    // --- Page 2: Water Storage ---
    storage_page_title: "Village Water Storage & Reserves",
    storage_page_sub: "Real-time capacity tracking across all Gram Panchayat lakes, storage tanks, and borewells",
    storage_summary_badge: "Live Panchayat Sensors & Daily Staff Inspection",
    filter_all_sources: "All Sources",
    filter_reservoirs: "Reservoirs & Lakes",
    filter_tanks: "Storage Tanks",
    filter_wells: "Community Wells",
    filter_borewells: "Borewells",
    source_capacity_label: "Capacity",
    source_available_label: "Available",
    source_last_inspected: "Inspected:",
    source_purity: "Purity:",
    info_callout_title: "How Water Levels Are Measured",
    info_callout_desc: "Main reservoir levels are recorded via ultrasonic depth sensors every 4 hours. Village community wells and overhead tanks are manually gauged each morning at 07:00 AM by Gram Panchayat staff.",

    // --- Page 3: Distribution Schedule ---
    sched_page_title: "Water Distribution Timetable",
    sched_page_sub: "Scheduled tap supply, community well hours, and tanker deliveries by ward",
    sched_date_badge: "Today's Schedule Active",
    sched_search_placeholder: "Search your ward, falia, or landmark...",
    sched_filter_all: "All Village Wards",
    sched_lineman_label: "Lineman / Contact:",
    sched_duration_label: "Duration:",
    sched_notice: "<strong>Note for Residents:</strong> Please ensure your household storage containers are placed at least 15 minutes before your scheduled supply time. Pipeline pressure builds up during the first 10 minutes.",

    // --- Page 4: Report Problem ---
    report_page_title: "Report a Water Problem",
    report_page_sub: "Submit complaints regarding leaks, pipeline damage, low pressure, or request emergency tankers",
    form_title_grievance: "Water Grievance Redressal Form",
    form_instructions: "Please provide accurate details so Gram Panchayat linemen can resolve the issue swiftly.",
    label_fullname: "Your Full Name",
    label_phone: "Mobile Phone Number",
    label_ward: "Village Ward / Area",
    label_problem_type: "Nature of Water Issue",
    label_urgency: "Urgency Level",
    label_description: "Describe the Issue & Exact Location",
    opt_select_ward: "-- Select Village Ward --",
    opt_select_problem: "-- Select Problem Category --",
    prob_pipeline_leak: "Pipeline Leakage / Burst",
    prob_low_pressure: "Low Water Pressure",
    prob_contaminated: "Contaminated / Dirty Water",
    prob_broken_tap: "Broken Community Tap / Valve",
    prob_schedule_missed: "Supply Not Received at Scheduled Time",
    prob_tanker_req: "Emergency Tanker Request",
    urgency_normal: "Normal (Resolution in 24-48 hrs)",
    urgency_urgent: "Urgent (Resolution in 12-24 hrs)",
    urgency_critical: "Critical / Emergency (Immediate Dispatch)",
    desc_placeholder: "Mention street name, nearby house number, landmark, and details of the water issue...",
    btn_submit_complaint: "Submit Report to Gram Panchayat",
    grievance_board_title: "Village Redressal Notice Board",
    grievance_board_sub: "Live grievance tracking and administrative action status",
    filter_all_complaints: "All Reports",
    filter_pending: "Pending",
    filter_dispatched: "Dispatched",
    filter_resolved: "Resolved",

    // --- Page 5: Citizen Portal ---
    cit_portal_title: "Citizen Water Portal",
    cit_tab_bills: "Water Bills",
    cit_tab_taxes: "Water & Property Taxes",
    cit_tab_complaints: "My Complaints",
    cit_tab_schedule: "My Ward Schedule",
    cit_tab_profile: "Household Profile",
    cit_kpi_unpaid: "Unpaid Water Bills",
    cit_kpi_taxes: "Annual Water Tax",
    cit_kpi_tickets: "Registered Grievances",
    cit_kpi_ward: "Assigned Village Ward",
    cit_th_bill_no: "Bill #",
    cit_th_period: "Billing Period",
    cit_th_amount: "Amount",
    cit_th_due_date: "Due Date",
    cit_th_status: "Status",
    cit_th_action: "Action",
    cit_btn_pay: "Pay Now",
    cit_tax_title: "Annual Panchayat Water & Property Tax",
    cit_tax_desc: "Standard assessment levied annually for tap water maintenance and drainage network upkeep.",
    cit_lodge_ticket_title: "Lodge New Water Ticket",
    cit_btn_submit_ticket: "Submit Ticket to Panchayat",
    cit_profile_card_title: "Registered Household & Contact Details",
    cit_btn_update_profile: "Save Contact Updates",
    cit_pwd_card_title: "Update Portal Password",
    cit_btn_update_pwd: "Update Password",

    // --- Page 6: Admin Portal ---
    admin_portal_title: "Gram Panchayat Administrative Control Panel",
    admin_portal_sub: "Manage village water supply, citizens, billing, complaints, and live tank telemetry",
    admin_btn_refresh: "Refresh Records",
    admin_tab_dashboard: "Overview",
    admin_tab_services: "Manage Services",
    admin_tab_tanks: "Water Tanks (Live)",
    admin_tab_citizens: "Citizen Registry",
    admin_tab_properties: "Properties",
    admin_tab_sources: "Water Sources",
    admin_tab_bills: "Water Bills & Payments",
    admin_tab_taxes: "Taxes & Charges",
    admin_tab_schedule: "Distribution Schedule",
    admin_tab_complaints: "Complaints & Grievances",
    admin_tab_reports: "Analytics & Reports",

    // Admin Dashboard
    admin_village_settings_title: "Village Water Advisory & Status Control",
    admin_village_name_label: "Gram Panchayat Name",
    admin_drought_status_label: "Overall Drought Severity Status",
    admin_notice_label: "Public Banner Announcement",
    admin_btn_save_settings: "Save Village Settings",
    admin_btn_add_citizen: "+ Register New Citizen",
    admin_btn_add_property: "+ Add Property",
    admin_btn_add_source: "+ Add Water Source",
    admin_btn_generate_bill: "+ Generate Water Bill",
    admin_btn_record_payment: "+ Record Payment Receipt",
    admin_btn_levy_tax: "+ Levy Tax Charge",
    admin_btn_add_slot: "+ Add Distribution Slot",
    admin_btn_export_excel: "Export Complaints (.xlsx)",

    // Admin Water Tanks
    tank_kpi_total: "Registered Water Tanks",
    tank_kpi_capacity: "Total Storage Capacity",
    tank_kpi_available: "Current Available Water",
    tank_kpi_avg: "Average Storage Level",
    tank_search_placeholder: "Search water tanks by name or location...",
    tank_filter_all_types: "All Tank Types",
    btn_add_tank: "+ Register New Tank",
    btn_record_reading: "+ Record Water Reading",
    btn_level_alerts: "Level Alerts & Warnings",
    btn_depletion_estimate: "Storage Depletion Forecast",
    tank_stat_capacity: "Capacity:",
    tank_stat_available: "Available:",
    tank_stat_method: "Method:",
    tank_stat_last_reading: "Last Reading:",
    btn_tank_record_now: "Record Level",
    btn_tank_history: "History",
    btn_tank_edit: "Edit",
    btn_tank_delete: "Delete",

    // Admin Tables Headers
    th_login_id: "Login ID",
    th_full_name: "Full Name",
    th_phone: "Phone Number",
    th_property_no: "Property / House",
    th_ward: "Ward / Area",
    th_status: "Status",
    th_actions: "Actions",
    th_property_number: "Property #",
    th_property_type: "Type",
    th_owner_name: "Owner / Resident",
    th_connection_type: "Connection",
    th_annual_tax: "Annual Tax",
    th_source_name: "Source Name",
    th_type: "Type",
    th_level_pct: "Level (%)",
    th_last_inspected: "Inspected",
    th_bill_number: "Bill #",
    th_resident: "Resident",
    th_period: "Period",
    th_amount: "Amount",
    th_due_date: "Due Date",
    th_receipt_no: "Receipt #",
    th_payment_date: "Payment Date",
    th_paid_amount: "Paid Amount",
    th_method: "Payment Method",
    th_tax_title: "Tax Title",
    th_category: "Category",
    th_time_slot: "Time Slot",
    th_duration: "Duration",
    th_lineman: "Lineman",
    th_ticket_id: "Ticket #",
    th_problem: "Problem",
    th_urgency: "Urgency",
    th_reported: "Reported",

    // --- Page 7: Login & Registration ---
    login_card_title: "Gram Panchayat Citizen & Staff Portal",
    login_card_sub: "Sign in to access Gram Panchayat water records and citizen services",
    login_tab_citizen: "Resident / Citizen",
    login_tab_admin: "Panchayat Staff / Admin",
    login_input_placeholder: "Enter Login ID (e.g. CIT-101 or admin)",
    login_pwd_placeholder: "Enter Password",
    login_btn_submit: "Sign In Securely",
    login_chips_title: "Demo Credentials for Testing:",
    login_chip_admin: "Staff Admin (admin / Admin@123)",
    login_chip_cit1: "Citizen 1 - Tukaram Shinde (CIT-101)",
    login_chip_cit2: "Citizen 2 - Savita Devi (CIT-102)",
    login_reg_link: "Not registered yet? Resident Self-Registration",

    // Resident Self-Registration Modal
    reg_modal_title: "Resident Self-Registration",
    reg_full_name_label: "Full Name",
    reg_phone_label: "Mobile Number",
    reg_prop_label: "Property / House No",
    reg_ward_label: "Village Ward / Area",
    reg_pwd_label: "Set Password",
    reg_confirm_pwd_label: "Confirm Password",
    reg_btn_submit: "Create Citizen Account",
    reg_success_title: "Registration Successful!",
    reg_success_subtitle: "Your Citizen Account has been registered with the Gram Panchayat.",
    reg_success_id_label: "YOUR CITIZEN LOGIN ID",
    reg_success_copy_btn: "Copy ID",
    reg_success_copied: "Copied!",
    reg_success_info_name: "Resident Name",
    reg_success_info_phone: "Registered Mobile",
    reg_success_instruction: "You can sign in using either your Citizen ID or your registered mobile number along with the password you set.",
    reg_btn_proceed_login: "Proceed to Sign In",

    // Operations Center & Development Works Module
    ops_attention_alert: "High-priority maintenance works assigned for execution today. Field crew dispatched.",
    ops_btn_show_urgent: "Show Urgent Works",
    ops_kpi_total: "Total Works & Tasks",
    ops_kpi_progress: "Active In Progress",
    ops_kpi_critical: "Urgent & Critical",
    ops_kpi_completed: "Completed & Inspected",
    ops_tab_all: "All Works",
    ops_tab_progress: "In Progress",
    ops_tab_pending: "Pending",
    ops_tab_completed: "Completed",
    ops_col_task_id: "Work ID",
    ops_col_title: "Work Description",
    ops_col_category: "Category",
    ops_col_priority: "Priority",
    ops_col_location: "Ward / Location",
    ops_col_assigned: "Crew / Lineman",
    ops_col_progress: "Progress",
    ops_col_status: "Status",
    ops_col_actions: "Actions",

    // --- Modals Common Actions ---
    modal_btn_save: "Save",
    modal_btn_cancel: "Cancel",
    modal_btn_close: "Close",
    modal_btn_update: "Update",
    modal_btn_submit: "Submit",
    modal_btn_confirm: "Confirm & Pay",

    // Specific Modals
    modal_sched_title: "Add New Distribution Slot",
    modal_sched_area: "Area / Ward Name",
    modal_sched_date: "Date",
    modal_sched_type: "Supply Type",
    modal_sched_window: "Time Window",
    modal_sched_duration: "Duration",
    modal_sched_status: "Status",
    modal_sched_lineman: "Lineman Contact",
    modal_sched_btn_save: "Save Schedule",

    modal_add_cit_title: "Register New Village Citizen",
    modal_edit_cit_title: "Edit Citizen Record",
    modal_cit_fullname: "Full Name",
    modal_cit_phone: "Mobile Phone",
    modal_cit_loginid: "Assigned Login ID",
    modal_cit_pwd: "Initial Password",
    modal_cit_prop: "Property / Household No",
    modal_cit_ward: "Ward / Area",
    modal_cit_meter: "Water Meter Number",
    modal_cit_address: "Street / House Address",
    modal_cit_btn_reg: "Register Citizen",
    modal_cit_btn_update: "Update Details",

    modal_add_source_title: "Add New Village Water Source",
    modal_source_name: "Source Name",
    modal_source_type: "Source Type",
    modal_source_capacity: "Total Capacity (Litres)",
    modal_source_initial_level: "Initial Level (%)",
    modal_source_purity: "Water Purity Status",
    modal_source_btn_save: "Save Water Source",

    modal_create_bill_title: "Generate New Water Bill",
    modal_bill_citizen: "Select Citizen / Household",
    modal_bill_period: "Billing Period",
    modal_bill_amount: "Total Bill Amount (₹)",
    modal_bill_due: "Payment Due Date",
    modal_bill_btn_issue: "Issue Bill to Resident",

    modal_record_pay_title: "Record Water Bill Payment",
    modal_pay_select_bill: "Select Unpaid Water Bill",
    modal_pay_amount: "Payment Amount (₹)",
    modal_pay_method: "Payment Method",
    modal_pay_notes: "Staff Notes / Counter Ref",
    modal_pay_btn_record: "Save Payment Receipt",

    modal_create_tax_title: "Levy Gram Panchayat Tax / Cess",
    modal_tax_title_label: "Tax Assessment Title",
    modal_tax_category: "Category",
    modal_tax_btn_levy: "Levy Tax on Resident",

    modal_grievance_resp_title: "Respond to Water Grievance",
    modal_grievance_status: "Update Complaint Status",
    modal_grievance_notes: "Official Panchayat Response",
    modal_grievance_btn_save: "Save Panchayat Response",

    modal_pay_bill_title: "Pay Water Bill Online",
    modal_pay_tax_title: "Pay Panchayat Utility Tax",
    modal_pay_option_label: "Choose Payment Option",
    modal_pay_btn_confirm: "Confirm & Pay",

    modal_add_prop_title: "Register Village Property / House",
    modal_edit_prop_title: "Edit Property Record",
    modal_prop_number: "Property / House Number",
    modal_prop_type: "Property Type",
    modal_prop_conn: "Water Connection Type",
    modal_prop_tax: "Annual Water Tax (₹)",
    modal_prop_btn_save: "Save Property Record",

    modal_add_tank_title: "Register New Water Tank",
    modal_edit_tank_title: "Edit Water Tank Configuration",
    modal_tank_name: "Tank Name",
    modal_tank_type: "Tank Type",
    modal_tank_location: "Village Location / Landmark",
    modal_tank_shape: "Tank Geometry / Shape",
    modal_tank_cap: "Total Storage Capacity (Litres)",
    modal_tank_meas_method: "Level Measurement Method",
    modal_tank_btn_register: "Register Water Tank",

    modal_record_reading_title: "Record Water Level Measurement",
    modal_reading_select_tank: "Select Water Tank",
    modal_reading_quantity: "Current Water Quantity (Litres)",
    modal_reading_method: "Measurement Method Used",
    modal_reading_remarks: "Staff Remarks / Notes",
    modal_reading_btn_save: "Save Water Level Measurement",

    modal_tank_history_title: "Water Level Telemetry & Measurement History",
    modal_tank_estimate_title: "Storage Depletion Projection",
    modal_tank_alerts_title: "Low Water Storage Alerts & Warnings",

    // --- Statuses & State Badges ---
    status_active: "Active",
    status_active_now: "Flowing Now (Active)",
    status_inactive: "Inactive",
    status_paid: "Paid",
    status_unpaid: "Unpaid",
    status_pending: "Pending",
    status_dispatched: "Dispatched",
    status_resolved: "Resolved",
    status_completed: "Completed",
    status_upcoming: "Upcoming",
    status_tomorrow: "Tomorrow",
    status_normal_label: "Normal",
    status_low_label: "Low",
    status_critical_label: "Critical",
    status_empty_label: "Empty",
    status_overflow_label: "Overflow Risk",

    // Supply & Connection Types
    supply_tap: "Pipeline Tap",
    supply_tanker: "Water Tanker",
    supply_well: "Community Well",
    conn_domestic_metered: "Domestic Metered Tap",
    conn_domestic_flat: "Domestic Flat-rate Tap",
    conn_commercial: "Commercial Connection",
    conn_community: "Community Standpost",

    // Common Action Buttons, Tables & Labels
    btn_edit: "Edit",
    btn_delete: "Delete",
    btn_activate: "Activate",
    btn_deactivate: "Deactivate",
    btn_save: "Save",
    status_active: "Active",
    status_inactive: "Inactive",
    status_paid: "Paid",
    status_cleared: "Cleared",
    status_unpaid: "Unpaid",
    prop_due: "Due",
    prop_clear: "Clear",
    adm_record_pay: "Record Pay",
    adm_mark_paid: "Mark Paid",
    adm_staff: "Admin Staff",
    adm_respond: "Respond",
    adm_notes: "View / Edit Notes",
    tank_overall_status: "Status",
    tank_current_storage: "Current Storage:",
    tank_total_capacity: "Total Capacity:",
    tank_free_headroom: "Free Headroom:",
    tank_measurement: "Measurement:",
    tank_method_sensor: "IoT Sensor",
    tank_method_manual: "Manual Dipstick",
    tank_needs_update: "Needs Update (>24h)",
    tank_verified_live: "Verified Live",
    tank_pending_meas: "Pending measurement",
    tank_btn_record: "Record",
    tank_btn_history: "History",
    tank_btn_estimate: "Estimate",
    rep_badge_reports: "Reports",
    rep_empty: "No reports filed yet.",
    rep_by: "By",
    cit_btn_pay: "Pay Now",
    tax_btn_pay: "Pay Tax",
    cit_gp_response: "Gram Panchayat Response:",
    cit_no_bills: "No water bills found.",
    cit_no_payments: "No payment receipts found.",
    cit_no_taxes: "No applicable Panchayat taxes.",
    cit_no_complaints: "No grievances filed yet.",
    cit_no_schedules: "No schedules available for your ward.",
    cit_active_citizen: "Active Citizen",
    cit_inactive_citizen: "Account Inactive",
    cit_standby: "Standby",
    adm_no_citizens: "No matching citizen records found.",
    adm_no_properties: "No matching village properties found.",
    adm_no_bills: "No water bills generated yet.",
    adm_no_payments: "No payment receipts recorded.",
    adm_no_taxes: "No Panchayat taxes levied yet.",
    adm_no_complaints: "No complaints reported.",

    // Footer
    footer_brand: "Gram Panchayat • Official Citizen Services Portal",
    footer_desc: "Developed for Gram Panchayats and rural village communities across Maharashtra. Facilitating drought resilience, fair water rationing, and transparent grievance resolution.",
    footer_support: "Emergency Panchayat Support: 1800-120-JAL (525) • Email: grampanchayat.water@gov.in",
    footer_rights: "© 2026 Gram Panchayat. Government of Maharashtra Initiative.",

    // --- Year-Round Gram Panchayat & Unified Applications ---
    nav_report_full: "Complaints & Applications",
    report_page_title_full: "Gram Panchayat Complaints, RTI & Applications Center",
    report_page_sub_full: "Official portal for public grievances, Right to Information (RTI) requests, application letters, and certificate issuance.",
    app_tab_submit: "Submit Application / Grievance",
    app_tab_letter: "Letter & Request Generator",
    app_tab_track: "Track Application Status",
    app_tab_notices: "Public Notices & Gram Sabha",
    app_tab_feed: "Community Grievance Feed",

    // Categories
    cat_complaint: "Public Complaint / Grievance",
    cat_rti: "RTI (Right to Information) Application",
    cat_app_letter: "General Application Letter",
    cat_req_letter: "Request Letter",
    cat_water: "Water Supply / Water Quality Complaint",
    cat_tax: "Property / House Tax Request",
    cat_bill: "Water Bill / Payment Issue",
    cat_cert: "Certificate or Document Request",
    cat_sanitation: "Sanitation / Drainage / Road / Streetlight",
    cat_other: "Other Gram Panchayat Requests",

    // RTI Section
    rti_banner_title: "Right to Information (RTI) Act 2005 - Statutory Notice",
    rti_banner_desc: "Applications submitted under the RTI Act 2005 are monitored under a statutory 30-day timeline. Online receipt facilitates registration; proof of prescribed application fee (₹10) or valid BPL card must be presented for statutory processing as per Government of Maharashtra RTI rules.",
    rti_field_citizenship: "I hereby confirm that I am a Citizen of India (भारतीय नागरिक)",
    rti_field_fee_status: "RTI Application Fee Status",
    rti_fee_paid: "Prescribed Fee Paid at GP Counter (Receipt Attached)",
    rti_fee_bpl: "Exempted from Fee (Valid BPL Card Holder)",
    rti_fee_counter: "Will pay fee at Gram Panchayat Counter",
    rti_deadline_label: "Statutory 30-Day Deadline:",
    rti_days_left: "days remaining",
    rti_overdue: "SLA OVERDUE",

    // Letter Generator
    letter_title: "Gram Panchayat Application & Request Letter Generator",
    letter_sub: "Select an official letter template, edit your details, and print or download as an official A4 document.",
    letter_tpl_select: "Select Official Letter Template",
    letter_tpl_general: "General Application to Gram Panchayat",
    letter_tpl_water_conn: "Request for New Water Tap Connection",
    letter_tpl_water_complaint: "Water Supply Shortage / Contamination Grievance",
    letter_tpl_tax_corr: "Property Tax Assessment Correction Request",
    letter_tpl_residence: "Request for Residence Certificate (रहिवासी दाखला)",
    letter_tpl_streetlight: "Streetlight, Drainage & Road Repair Request",
    letter_tpl_sanitation: "Village Sanitation & Garbage Clearance Request",
    letter_lang_en: "English Format",
    letter_lang_mr: "मराठी प्रारूप (Official Marathi)",
    letter_btn_print: "Print / Save PDF",
    letter_btn_submit: "Submit Directly to Panchayat",
    letter_btn_draft: "Save Draft",

    // Tracking
    track_title: "Track Application / RTI Status",
    track_sub: "Enter your official reference number (e.g., RTI-2026-1001 or APP-2026-2002) to view live progress.",
    track_input_placeholder: "Enter Reference # (e.g. RTI-2026-1001)",
    track_btn_search: "Track Status",
    track_timeline_submitted: "Submitted",
    track_timeline_review: "Under Review",
    track_timeline_assigned: "Assigned / Processing",
    track_timeline_resolved: "Resolved / Replied",

    // Citizen Portal Tab
    cit_tab_applications: "My Applications & RTI",
    cit_applications_title: "My Submitted Applications & RTI Requests",
    cit_no_applications: "No applications or RTI requests submitted yet.",

    // Admin Portal Year-Round Operations
    admin_tab_applications: "Applications Register",
    admin_tab_rti: "RTI Register",
    admin_tab_tasks: "Work Register & Tasks",
    admin_tab_notices: "Public Notices",
    admin_btn_export_csv: "Export CSV",
    admin_btn_add_task: "+ Add Maintenance Task",
    admin_btn_add_notice: "+ Publish Notice",
    admin_modal_update_app: "Review & Update Application Status",
    admin_assign_officer: "Assign Responsible Officer",
    admin_official_response: "Official Panchayat Response",
    admin_internal_notes: "Internal Administrative Notes",
    admin_exec_dashboard: "Year-Round Gram Panchayat Executive Dashboard",
    admin_kpi_citizens_households: "Citizens & Households",
    admin_kpi_apps_today: "Received Today",
    admin_kpi_pending_matters: "Pending Applications",
    admin_kpi_pending_rti: "Active RTI Matters",
    admin_kpi_revenue_total: "Collections & Dues",
    admin_kpi_village_water: "Water Reserve Fill",
    admin_kpi_open_tasks: "Maintenance Tasks",

    // --- Official Gram Panchayat & 14 Services ---
    gp_state_tag: "Government of Maharashtra • Rural Development & Water Conservation",
    gp_name_default: "Gram Panchayat",
    gp_jurisdiction_default: "Official Gram Panchayat Citizen Services Portal",
    gp_intro_default: "Welcome to the official Gram Panchayat digital administration portal. Our Panchayat is committed to transparent e-governance, prompt redressal of citizen grievances, uninterrupted civic services, and fair distribution of water resources throughout the year.",
    gp_sarpanch: "Sarpanch",
    gp_gram_sevak: "Gram Sevak / VDO",
    gp_secretary: "Panchayat Secretary",
    gp_office_phone: "Office Phone",
    gp_office_email: "Official Email",
    gp_office_hours: "Office Timings",
    gp_office_address: "Office Address",
    gp_services_heading: "Year-Round Gram Panchayat Services",
    gp_services_subheading: "Official civic utilities, welfare applications, water resource tracking, grievance redressal, and certificate guidance.",
    
    // 14 Services
    srv_water_title: "Water Supply & Water Tank Monitoring",
    srv_water_desc: "Track real-time reservoir levels, overhead tank storage percentages, and scheduled tap supply timings across all village wards.",
    srv_water_badge: "Live Telemetry",
    
    srv_bills_title: "Water Bills & Payment Records",
    srv_bills_desc: "View issued water tariff notices, domestic meter charges, payment due dates, and verified Panchayat payment receipts.",
    srv_bills_badge: "Billing & Counter",
    
    srv_tax_title: "Property & House Tax Information",
    srv_tax_desc: "Check village assessment registers (नमुना ८), annual house tax levies, lighting and health cess, and clearance certificates.",
    srv_tax_badge: "Tax Assessment",
    
    srv_citizen_reg_title: "Citizen Registration & Household Records",
    srv_citizen_reg_desc: "Register your family in the village resident directory, link property house numbers, and access digital citizen privileges.",
    srv_citizen_reg_badge: "Citizen Register",
    
    srv_birth_death_title: "Birth & Death Certificate Information",
    srv_birth_death_desc: "Guidance on statutory registration within 21 days under the RBD Act. Verification & physical collection require Gram Panchayat counter visit.",
    srv_birth_death_badge: "Offline Verification",
    
    srv_residence_cert_title: "Residence & Other Certificate Requests",
    srv_residence_cert_desc: "Submit requests for Residence Certificate (रहिवासी दाखला), Toilet Certificate, and Gram Panchayat No-Objection Certificates (NOC).",
    srv_residence_cert_badge: "Online Request",
    
    srv_new_conn_title: "New Water Connection Applications",
    srv_new_conn_desc: "Apply for a new household pipeline water connection under Har Ghar Jal / Jal Jeevan Mission with property ownership proof.",
    srv_new_conn_badge: "New Application",
    
    srv_streetlight_title: "Streetlight & Road Maintenance Complaints",
    srv_streetlight_desc: "Report burnt streetlamps, damaged village pathways, and road culvert blockages for prompt maintenance crew dispatch.",
    srv_streetlight_badge: "Maintenance",
    
    srv_sanitation_title: "Drainage, Sanitation & Waste Management",
    srv_sanitation_desc: "Report clogged village gutters, overflowing drains, waste dumping spots, or request bleaching powder mosquito disinfection.",
    srv_sanitation_badge: "Sanitation",
    
    srv_grievance_title: "Public Grievances & Complaint Tracking",
    srv_grievance_desc: "Lodge public grievances to Panchayat administration with automated reference IDs and track investigation milestones.",
    srv_grievance_badge: "Public Grievance",
    
    srv_rti_title: "RTI (Right to Information) Application Guidance",
    srv_rti_desc: "Official guidance and application submission under RTI Act 2005. Strictly tracked against the 30-day statutory resolution timeline.",
    srv_rti_badge: "Statutory 30 Days",
    
    srv_schemes_title: "Government Schemes & Public Notices",
    srv_schemes_desc: "Stay informed on flagship state & central welfare programs: PM Awas Yojana, Sanjay Gandhi Niradhar, and borewell recharge grants.",
    srv_schemes_badge: "Public Welfare",
    
    srv_meetings_title: "Meeting Notices & Village Development Updates",
    srv_meetings_desc: "Access verified notices, meeting agendas, and citizen resolutions for Gram Sabha sessions, monthly meetings, and VWSC committee updates.",
    srv_meetings_badge: "Gram Sabha",
    
    srv_letters_title: "Application & Request Letter Generator",
    srv_letters_desc: "Draft standard Gram Panchayat application letters and official petitions in Marathi and English with instant print and PDF download.",
    srv_letters_badge: "Letter Builder",

    home_notices_title: "Official Public Notices & Announcements",
    home_notices_subtitle: "Stay updated on Gram Sabha meetings, water advisories, tax rebates, and village welfare schemes",
    home_btn_all_notices: "View All Notices →",
    admin_services_heading: "Gram Panchayat Citizen Services Management",

    // --- Smart Village Admin Portal Keys ---
    admin_gp_title: "Sundarpur GP",
    admin_gp_badge: "Smart Panchayat",
    admin_nav_overview: "Overview",
    admin_nav_civic: "Civic Administration",
    admin_nav_revenue: "Revenue & Utilities",
    admin_nav_governance: "Governance & Operations",
    admin_nav_intelligence: "Intelligence",
    admin_tab_village_map: "Village Map & Facilities",
    admin_bc_portal: "Gram Panchayat",
    admin_status_live: "Live Sync",
    btn_add_citizen: "+ Citizen",
    btn_issue_bill: "+ Bill",
    btn_record_payment: "+ Payment",
    admin_btn_exit: "Exit Admin Portal",
    btn_public_portal: "Public View",

    kpi_tag_citizens: "Demographics",
    kpi_total_citizens: "Total Registered Citizens",
    kpi_active_residents: "active residents",
    kpi_tag_families: "Families",
    kpi_total_households: "Total Households",
    kpi_across_wards: "Across all 4 village wards",
    kpi_tag_properties: "Registry",
    kpi_total_properties: "Total Properties",
    kpi_residential_commercial: "Residential & commercial",
    kpi_tag_services: "Services",
    kpi_total_applications: "Total Applications",
    kpi_submitted_today: "received today",
    kpi_tag_pipeline: "In Review",
    kpi_pending_applications: "Pending Applications",
    kpi_active_rti_matters: "RTI statutory matters",
    kpi_tag_redressed: "Redressed",
    kpi_resolved_complaints: "Resolved Complaints",
    kpi_citizen_grievances_settled: "Villager grievances settled",
    kpi_tag_action: "Urgent",
    kpi_pending_complaints: "Pending Complaints",
    kpi_action_required: "Action required by staff",
    kpi_tag_utility: "Utility",
    kpi_total_water_bills: "Total Water Bills",
    kpi_issued_cycles: "Issued across billing cycles",
    kpi_tag_status: "Billing Status",
    kpi_paid_unpaid_bills: "Paid & Unpaid Bills",
    kpi_tag_revenue: "Revenue",
    kpi_total_tax_collection: "Total Tax Collection",
    kpi_property_sanitation_cess: "Property, water & cess",
    kpi_tag_arrears: "Arrears",
    kpi_pending_tax_collection: "Pending Tax Collection",
    kpi_outstanding_assessments: "Outstanding assessments",
    kpi_tag_ongoing: "Ongoing",
    kpi_active_works: "Active Development Works",
    kpi_works_in_progress: "Village works in progress",
    kpi_tag_completed: "Delivered",
    kpi_completed_works: "Completed Development Works",
    kpi_delivered_projects: "Inspected and verified",

    chart_ward_citizens_title: "Ward-Wise Citizen Distribution",
    chart_badge_demographics: "Demographics",
    chart_ward_households_title: "Ward-Wise Households & Properties",
    chart_badge_properties: "Housing",
    chart_revenue_trend_title: "Monthly Revenue & Tax Collection Trend",
    chart_badge_finance: "Collections",
    chart_water_bills_title: "Water Bill Collection Status",
    chart_badge_water_bills: "Utility Bills",
    chart_complaints_title: "Grievance & Complaint Redressal",
    chart_badge_grievances: "Grievances",
    chart_applications_title: "Citizen Applications Pipeline",
    chart_badge_pipeline: "Workflow",
    chart_work_progress_title: "Development Projects Progress & Completion",
    chart_badge_works: "Operations",

    dash_recent_activity_title: "Recent Panchayat Activities",
    dash_activity_live: "Live Stream",
    dash_sla_alerts_title: "SLA Deadlines & Urgent Alerts",
    admin_btn_view_profile: "360° Profile",
    report_btn_print: "Print Official Report",
    report_btn_export: "Export to CSV"
  },

  mr: {
    // --- Brand & Announcements ---
    brand_title: "ग्रामपंचायत",
    brand_sub: "Gram Panchayat",
    official_gp_subtitle: "अधिकृत ग्रामपंचायत नागरिक सेवा पोर्टल",
    announcement_notice: "सूचना:",
    announcement_text: "पाणी पुरवठा <strong>रेशनिंग मोड (नियंत्रित वाटप)</strong> मध्ये आहे. कृपया पाण्याचा काटकसरीने वापर करा आणि अपव्यय टाळा.",
    helpline_label: "पंचायत हेल्पलाइन:",
    portal_active: "सक्रिय",
    status_connecting: "जोडणी सुरू...",
    status_db_pending: "प्रलंबित",
    status_offline: "ऑफलाइन",

    // --- Top Navigation & Roles ---
    nav_home: "मुख्यपृष्ठ",
    nav_storage: "जलसाठा",
    nav_schedule: "वेळापत्रक",
    nav_report: "तक्रार नोंदवा",
    nav_citizen: "नागरिक पोर्टल",
    nav_admin: "प्रशासक पोर्टल",
    nav_login: "लॉगिन",
    nav_logout: "बाहेर पडा",
    role_admin_badge: "कर्मचारी",
    role_citizen_badge: "नागरिक",

    // --- Page 1: Home Dashboard ---
    hero_title: "गाव पाणी स्थिती व दुष्काळ सल्लागार",
    hero_desc: "गावातील पाण्याची रिअल-टाइम माहिती. जलसाठे व टाक्यांमधील पाणी पातळी तपासा, आजचे पाणी पुरवठा वेळापत्रक पहा किंवा आपत्कालीन टँकरसाठी विनंती करा.",
    last_updated: "शेवटचे अद्यतन:",
    responsible_officer: "जबाबदार अधिकारी:",
    reserve_title: "गावातील एकूण जलसाठा",
    reserve_status_normal: "सामान्य पातळी",
    reserve_status_low: "कमी पातळी",
    reserve_status_critical: "अतिगंभीर पातळी",
    reserve_status_rationing: "रेशनिंग मोड",
    gauge_sub_text: "गावातील एकूण साठवण क्षमतेपैकी उपलब्ध पाणी",
    gauge_footer_note: "<strong>सल्ला:</strong> पाणी पुरवठ्याचे तास मर्यादित केले आहेत. शेतीपेक्षा पिण्याच्या पाण्याला सर्वोच्च प्राधान्य दिले जाईल.",

    // Metric Cards (Home)
    metric_total_storage: "एकूण जलसाठा",
    metric_total_storage_hint: "गावातील सर्व जलस्रोतांमध्ये मिळून",
    metric_remaining_supply: "उपलब्ध पाणी शिल्लक",
    metric_remaining_supply_hint: "सध्याच्या वापर दरानुसार",
    metric_alert_level: "साठा इशारा पातळी",
    metric_alert_level_hint: "दुष्काळ इशारा सक्रिय आहे",
    metric_tanker_status: "टँकर पुरवठा स्थिती",
    metric_tanker_status_hint: "सक्रिय आपत्कालीन फेऱ्या",

    // Quick Actions & Schedule Preview (Home)
    quick_actions_title: "तातडीच्या कृती आणि सेवा",
    quick_action_report_title: "पाणी गळती / कमी दाबाची तक्रार",
    quick_action_report_desc: "ग्रामपंचायतीकडे सार्वजनिक तक्रार नोंदवा. मुख्य पाईपलाईन फुटल्यास तात्काळ पथक रवाना केले जाईल.",
    quick_action_storage_title: "जलसाठे व टाक्यांची तपासणी",
    quick_action_storage_desc: "गावातील ५ जलस्रोत, विहिरी आणि साठवण टाक्यांमधील अचूक थेट क्षमता पहा.",
    today_schedule_title: "आजचे पाणी पुरवठा वेळापत्रक",
    today_schedule_sub: "वॉर्डनिहाय नळाचे थेट वेळापत्रक",
    view_all_schedule: "संपूर्ण गावाचे वेळापत्रक पहा →",
    drought_tips_title: "पाणी बचतीचे नियम व प्रोटोकॉल लागू",
    drought_tip_1: "पिण्याचे आणि घरगुती वापराचे पाणी झाकून ठेवा जेणेकरून बाष्पीभवन आणि प्रदूषण टळेल.",
    drought_tip_2: "सार्वजनिक नळाला तोटी बसवलेली असल्याची खात्री करा; गळती आढळल्यास तत्काळ लाइनमनला सांगा.",
    drought_tip_3: "अंगण, वाहने आणि जनावरे धुण्यासाठी पिण्याच्या पाण्याचा वापर पूर्णपणे टाळा.",

    // --- Page 2: Water Storage ---
    storage_page_title: "गावातील जलसाठा व टाक्यांची स्थिती",
    storage_page_sub: "ग्रामपंचायतीचे सर्व तलाव, साठवण टाक्या आणि बोअरवेलमधील थेट पाण्याची पातळी",
    storage_summary_badge: "थेट पंचायत सेन्सर्स आणि दैनंदिन कर्मचारी तपासणी",
    filter_all_sources: "सर्व जलस्रोत",
    filter_reservoirs: "तलाव / जलाशय",
    filter_tanks: "साठवण टाक्या (ESR)",
    filter_wells: "सार्वजनिक विहिरी",
    filter_borewells: "बोअरवेल",
    source_capacity_label: "क्षमता",
    source_available_label: "उपलब्ध साठा",
    source_last_inspected: "तपासणी:",
    source_purity: "शुद्धता:",
    info_callout_title: "पाणी पातळी कशी मोजली जाते?",
    info_callout_desc: "मुख्य जलाशयाची पातळी अल्ट्रासॉनिक डेप्थ सेन्सरद्वारे दर ४ तासांनी मोजली जाते. गावातील विहिरी आणि उंच पाण्याच्या टाक्या ग्रामपंचायत कर्मचाऱ्यांमार्फत दररोज सकाळी ७ वाजता मोजल्या जातात.",

    // --- Page 3: Distribution Schedule ---
    sched_page_title: "पाणी पुरवठा वेळापत्रक",
    sched_page_sub: "गावातील सर्व वॉर्ड, गल्ल्या आणि वस्त्यांसाठी पाणी वितरण वेळ",
    sched_date_badge: "आजचे वेळापत्रक लागू",
    sched_search_placeholder: "वॉर्ड, गल्ली किंवा ठिकाण शोधा...",
    sched_filter_all: "सर्व वॉर्ड",
    sched_lineman_label: "लाइनमन / संपर्क:",
    sched_duration_label: "कालावधी:",
    sched_notice: "<strong>नागरिकांसाठी सूचना:</strong> कृपया पाणी सोडण्याच्या नियोजित वेळेच्या किमान १५ मिनिटे आधी भांडी नळाजवळ तयार ठेवा. सुरुवातीच्या १० मिनिटांत पाईपलाईनमध्ये पाण्याचा दाब तयार होतो.",

    // --- Page 4: Report Problem ---
    report_page_title: "पाणी समस्या तक्रार नोंदवा",
    report_page_sub: "पाईप गळती, नुकसान, कमी दाब किंवा आपत्कालीन टँकर मागणीसाठी ग्रामपंचायतीकडे तक्रार दाखल करा",
    form_title_grievance: "पाणी तक्रार निवारण अर्ज",
    form_instructions: "कृपया अचूक माहिती द्या जेणेकरून ग्रामपंचायतीचे कर्मचारी समस्येचे तात्काळ निवारण करू शकतील.",
    label_fullname: "आपले पूर्ण नाव",
    label_phone: "मोबाईल क्रमांक",
    label_ward: "गाव वॉर्ड / परिसर",
    label_problem_type: "समस्येचे स्वरूप",
    label_urgency: "तातडीचा स्तर",
    label_description: "समस्या व नेमक्या पत्त्याचे सविस्तर वर्णन",
    opt_select_ward: "-- वॉर्ड निवडा --",
    opt_select_problem: "-- समस्येचा प्रकार निवडा --",
    prob_pipeline_leak: "पाईपलाईन गळती / फुटलेली लाईन",
    prob_low_pressure: "नळाला कमी पाणी दाब",
    prob_contaminated: "गढूळ किंवा दूषित पाणी",
    prob_broken_tap: "सार्वजनिक नळ / व्हॉल्व्ह खराब",
    prob_schedule_missed: "वेळेवर पाणी न येणे / वेळापत्रक चुकणे",
    prob_tanker_req: "तातडीची पाणी टँकर मागणी",
    urgency_normal: "सामान्य (२४ ते ४८ तासांत निवारण)",
    urgency_urgent: "तातडीचे (१२ ते २४ तासांत निवारण)",
    urgency_critical: "अतितातडीचे / आणीबाणी (तातडीने कार्यवाही)",
    desc_placeholder: "गल्लीचे नाव, जवळचा घर क्रमांक, लँडमार्क आणि समस्येचे स्वरूप येथे लिहा...",
    btn_submit_complaint: "ग्रामपंचायतीकडे तक्रार दाखल करा",
    grievance_board_title: "गाव तक्रार निवारण फलक",
    grievance_board_sub: "दाखल झालेल्या तक्रारी आणि ग्रामपंचायतीची कृती स्थिती",
    filter_all_complaints: "सर्व तक्रारी",
    filter_pending: "प्रलंबित",
    filter_dispatched: "कार्यवाही सुरू",
    filter_resolved: "निवारण झाले",

    // --- Page 5: Citizen Portal ---
    cit_portal_title: "नागरिक पाणी सेवा पोर्टल",
    cit_tab_bills: "माझी पाणी बिले",
    cit_tab_taxes: "पाणी व मालमत्ता कर",
    cit_tab_complaints: "माझ्या तक्रारी",
    cit_tab_schedule: "माझे वेळापत्रक",
    cit_tab_profile: "माझे घर व प्रोफाइल",
    cit_kpi_unpaid: "थकबाकी पाणी बिले",
    cit_kpi_taxes: "वार्षिक पाणी कर",
    cit_kpi_tickets: "दाखल केलेल्या तक्रारी",
    cit_kpi_ward: "नोंदणीकृत वॉर्ड",
    cit_th_bill_no: "बिल क्र.",
    cit_th_period: "बिल कालावधी",
    cit_th_amount: "रक्कम",
    cit_th_due_date: "अंतिम मुदत",
    cit_th_status: "स्थिती",
    cit_th_action: "कृती",
    cit_btn_pay: "आता भरा",
    cit_tax_title: "वार्षिक ग्रामपंचायत पाणी व मालमत्ता कर",
    cit_tax_desc: "नळ पाणी पुरवठा आणि ड्रेनेज देखभाल दुरुस्तीसाठी वार्षिक आकारणी.",
    cit_lodge_ticket_title: "नवीन तक्रार दाखल करा",
    cit_btn_submit_ticket: "पंचायतीकडे तक्रार पाठवा",
    cit_profile_card_title: "नोंदणीकृत कुटुंब व संपर्क माहिती",
    cit_btn_update_profile: "संपर्क माहिती जतन करा",
    cit_pwd_card_title: "पोर्टल पासवर्ड बदला",
    cit_btn_update_pwd: "पासवर्ड अद्यतनित करा",

    // --- Page 6: Admin Portal ---
    admin_portal_title: "ग्रामपंचायत प्रशासकीय नियंत्रण कक्ष",
    admin_portal_sub: "गाव पाणी पुरवठा, नागरिक, बिलिंग, तक्रारी आणि थेट टाकी निरीक्षण व्यवस्थापन",
    admin_btn_refresh: "माहिती रीफ्रेश करा",
    admin_tab_dashboard: "डॅशबोर्ड",
    admin_tab_services: "सेवा व्यवस्थापन",
    admin_tab_tanks: "पाणी टाक्या (Live)",
    admin_tab_citizens: "नागरिक नोंदणी",
    admin_tab_properties: "मालमत्ता व घरे",
    admin_tab_sources: "जलस्रोत",
    admin_tab_bills: "पाणी बिले व देयके",
    admin_tab_taxes: "कर आकारणी व कर",
    admin_tab_schedule: "वितरण वेळापत्रक",
    admin_tab_complaints: "तक्रार व निवारण",
    admin_tab_reports: "अहवाल व आकडेवारी",

    // Admin Dashboard
    admin_village_settings_title: "गाव पाणी सल्लागार व स्थिती नियंत्रण",
    admin_village_name_label: "ग्रामपंचायतीचे नाव",
    admin_drought_status_label: "एकूण दुष्काळ तीव्रता स्थिती",
    admin_notice_label: "सार्वजनिक सूचना फलक",
    admin_btn_save_settings: "गाव सेटिंग्ज जतन करा",
    admin_btn_add_citizen: "+ नवीन नागरिक नोंदणी",
    admin_btn_add_property: "+ नवीन मालमत्ता जोडा",
    admin_btn_add_source: "+ जलस्रोत जोडा",
    admin_btn_generate_bill: "+ पाणी बिल जारी करा",
    admin_btn_record_payment: "+ पावती / भरणा नोंदवा",
    admin_btn_levy_tax: "+ नवीन कर आकारणी",
    admin_btn_add_slot: "+ नवीन पुरवठा वेळ जोडा",
    admin_btn_export_excel: "तक्रार अहवाल एक्सेल (.xlsx) डाउनलोड",

    // Admin Water Tanks
    tank_kpi_total: "नोंदणीकृत पाण्याच्या टाक्या",
    tank_kpi_capacity: "एकूण साठवण क्षमता",
    tank_kpi_available: "एकूण उपलब्ध पाणी",
    tank_kpi_avg: "सरासरी पाणी साठा",
    tank_search_placeholder: "टाकीचे नाव किंवा ठिकाण शोधा...",
    tank_filter_all_types: "सर्व प्रकारच्या टाक्या",
    btn_add_tank: "+ नवीन पाण्याची टाकी जोडा",
    btn_record_reading: "+ पाणी पातळी नोंदवा",
    btn_level_alerts: "पातळी इशारे व सूचना",
    btn_depletion_estimate: "पाणी संपण्याचा अंदाज",
    tank_stat_capacity: "क्षमता:",
    tank_stat_available: "उपलब्ध साठा:",
    tank_stat_method: "पद्धत:",
    tank_stat_last_reading: "शेवटची नोंद:",
    btn_tank_record_now: "पातळी नोंदवा",
    btn_tank_history: "इतिहास",
    btn_tank_edit: "संपादित करा",
    btn_tank_delete: "हटवा",

    // Admin Tables Headers
    th_login_id: "लॉगिन आयडी",
    th_full_name: "पूर्ण नाव",
    th_phone: "मोबाईल क्रमांक",
    th_property_no: "घर / मालमत्ता क्र.",
    th_ward: "वॉर्ड / परिसर",
    th_status: "स्थिती",
    th_actions: "कृती",
    th_property_number: "मालमत्ता क्र.",
    th_property_type: "प्रकार",
    th_owner_name: "मालक / रहिवासी",
    th_connection_type: "जोडणी प्रकार",
    th_annual_tax: "वार्षिक कर",
    th_source_name: "स्रोताचे नाव",
    th_type: "प्रकार",
    th_level_pct: "पातळी (%)",
    th_last_inspected: "तपासणी",
    th_bill_number: "बिल क्र.",
    th_resident: "रहिवासी",
    th_period: "कालावधी",
    th_amount: "रक्कम",
    th_due_date: "अंतिम मुदत",
    th_receipt_no: "पावती क्र.",
    th_payment_date: "भरणा दिनांक",
    th_paid_amount: "भरलेली रक्कम",
    th_method: "भरणा पद्धत",
    th_tax_title: "कराचे नाव",
    th_category: "वर्गवारी",
    th_time_slot: "वेळ",
    th_duration: "कालावधी",
    th_lineman: "लाइनमन",
    th_ticket_id: "तक्रार क्र.",
    th_problem: "समस्या",
    th_urgency: "तातडी",
    th_reported: "नोंदणी वेळ",

    // --- Page 7: Login & Registration ---
    login_card_title: "ग्रामपंचायत नागरिक व कर्मचारी पोर्टल",
    login_card_sub: "ग्रामपंचायत पाणी नोंदी व नागरिक सेवेसाठी लॉगिन करा",
    login_tab_citizen: "नागरिक / रहिवासी",
    login_tab_admin: "पंचायत कर्मचारी / प्रशासक",
    login_input_placeholder: "लॉगिन आयडी टाका (उदा. CIT-101 किंवा admin)",
    login_pwd_placeholder: "पासवर्ड टाका",
    login_btn_submit: "सुरक्षित लॉगिन करा",
    login_chips_title: "चाचणीसाठी डेमो खाती:",
    login_chip_admin: "कर्मचारी प्रशासक (admin / Admin@123)",
    login_chip_cit1: "नागरिक १ - तुकाराम शिंदे (CIT-101)",
    login_chip_cit2: "नागरिक २ - सविता देवी (CIT-102)",
    login_reg_link: "अद्याप खाते नाही? येथे नागरिक स्वयं-नोंदणी करा",

    // Resident Self-Registration Modal
    reg_modal_title: "नागरिक स्वयं-नोंदणी",
    reg_full_name_label: "पूर्ण नाव",
    reg_phone_label: "मोबाईल क्रमांक",
    reg_prop_label: "घर / मालमत्ता क्रमांक",
    reg_ward_label: "गाव वॉर्ड / परिसर",
    reg_pwd_label: "पासवर्ड सेट करा",
    reg_confirm_pwd_label: "पासवर्डची खात्री करा",
    reg_btn_submit: "नागरिक खाते तयार करा",
    reg_success_title: "नागरिक नोंदणी यशस्वी!",
    reg_success_subtitle: "आपले नागरिक खाते ग्रामपंचायतीकडे यशस्वीरीत्या नोंदवले गेले आहे.",
    reg_success_id_label: "आपला नागरिक लॉगिन आयडी",
    reg_success_copy_btn: "आयडी कॉपी करा",
    reg_success_copied: "कॉपी केले!",
    reg_success_info_name: "नागरिकाचे नाव",
    reg_success_info_phone: "नोंदणीकृत मोबाईल",
    reg_success_instruction: "आपण आपल्या नागरिक आयडी किंवा नोंदणीकृत मोबाईल क्रमांकासह आपण सेट केलेल्या पासवर्डचा वापर करून लॉगिन करू शकता.",
    reg_btn_proceed_login: "लॉगिन करण्यासाठी पुढे जा",

    // Operations Center & Development Works Module
    ops_attention_alert: "आजच्या नियोजित कामांसाठी तातडीची दुरुस्ती कार्ये नियुक्त केली आहेत. क्षेत्रीय कर्मचारी तैनात.",
    ops_btn_show_urgent: "तातडीची कामे पहा",
    ops_kpi_total: "एकूण विकासकामे",
    ops_kpi_progress: "सुरू असलेली कामे",
    ops_kpi_critical: "तातडीची व प्राधान्य कामे",
    ops_kpi_completed: "पूर्ण झालेली कामे",
    ops_tab_all: "सर्व कामे",
    ops_tab_progress: "प्रगतीत",
    ops_tab_pending: "प्रलंबित",
    ops_tab_completed: "पूर्ण",
    ops_col_task_id: "काम आयडी",
    ops_col_title: "कामाचे स्वरूप",
    ops_col_category: "प्रवर्ग",
    ops_col_priority: "प्राधान्य",
    ops_col_location: "वॉर्ड / परिसर",
    ops_col_assigned: "कर्मचारी / कंत्राटदार",
    ops_col_progress: "प्रगती",
    ops_col_status: "स्थिती",
    ops_col_actions: "क्रिया",

    // --- Modals Common Actions ---
    modal_btn_save: "जतन करा",
    modal_btn_cancel: "रद्द करा",
    modal_btn_close: "बंद करा",
    modal_btn_update: "अद्यतनित करा",
    modal_btn_submit: "सादर करा",
    modal_btn_confirm: "खात्री करा व भरा",

    // Specific Modals (Marathi)
    modal_sched_title: "नवीन पाणी वितरण वेळ जोडा",
    modal_sched_area: "परिसर / वॉर्डचे नाव",
    modal_sched_date: "दिनांक",
    modal_sched_type: "पुरवठा प्रकार",
    modal_sched_window: "वेळेचा कालावधी",
    modal_sched_duration: "कालावधी",
    modal_sched_status: "स्थिती",
    modal_sched_lineman: "लाईनमन संपर्क",
    modal_sched_btn_save: "वेळापत्रक जतन करा",

    modal_add_cit_title: "नवीन ग्रामस्थ नोंदणी",
    modal_edit_cit_title: "नागरिक माहिती संपादित करा",
    modal_cit_fullname: "पूर्ण नाव",
    modal_cit_phone: "मोबाईल फोन",
    modal_cit_loginid: "नियुक्त लॉगिन आयडी",
    modal_cit_pwd: "सुरुवातीचा पासवर्ड",
    modal_cit_prop: "घर / मालमत्ता क्र.",
    modal_cit_ward: "वॉर्ड / परिसर",
    modal_cit_meter: "पाणी मीटर क्रमांक",
    modal_cit_address: "गल्ली / घराचा पत्ता",
    modal_cit_btn_reg: "नागरिक नोंदवा",
    modal_cit_btn_update: "माहिती अद्यतनित करा",

    modal_add_source_title: "नवीन जलस्रोत जोडा",
    modal_source_name: "जलस्रोताचे नाव",
    modal_source_type: "स्रोताचा प्रकार",
    modal_source_capacity: "एकूण क्षमता (लिटर)",
    modal_source_initial_level: "सुरुवातीची पातळी (%)",
    modal_source_purity: "पाण्याची गुणवत्ता",
    modal_source_btn_save: "जलस्रोत जतन करा",

    modal_create_bill_title: "नवीन पाणी बिल तयार करा",
    modal_bill_citizen: "नागरिक / घर निवडा",
    modal_bill_period: "बिलिंग कालावधी",
    modal_bill_amount: "एकूण बिल रक्कम (₹)",
    modal_bill_due: "अंतिम भरणा तारीख",
    modal_bill_btn_issue: "नागरिकाला बिल जारी करा",

    modal_record_pay_title: "पाणी बिल भरणा नोंदवा",
    modal_pay_select_bill: "थकबाकी असलेले बिल निवडा",
    modal_pay_amount: "भरणा रक्कम (₹)",
    modal_pay_method: "भरणा पद्धत",
    modal_pay_notes: "कर्मचारी शेरा / पावती संदर्भ",
    modal_pay_btn_record: "पावती जतन करा",

    modal_create_tax_title: "ग्रामपंचायत कर / उपकर आकारणी",
    modal_tax_title_label: "कराचे नाव",
    modal_tax_category: "वर्गवारी",
    modal_tax_btn_levy: "कर लागू करा",

    modal_grievance_resp_title: "पाणी तक्रारीला प्रतिसाद द्या",
    modal_grievance_status: "तक्रार स्थिती बदला",
    modal_grievance_notes: "अधिकृत पंचायत प्रतिसाद",
    modal_grievance_btn_save: "प्रतिसाद जतन करा",

    modal_pay_bill_title: "पाणी बिल ऑनलाइन भरा",
    modal_pay_tax_title: "पंचायत कर ऑनलाइन भरा",
    modal_pay_option_label: "पेमेंट पर्याय निवडा",
    modal_pay_btn_confirm: "खात्री करा आणि भरा",

    modal_add_prop_title: "नवीन गाव मालमत्ता नोंदवा",
    modal_edit_prop_title: "मालमत्ता माहिती संपादित करा",
    modal_prop_number: "मालमत्ता / घर क्रमांक",
    modal_prop_type: "मालमत्ता प्रकार",
    modal_prop_conn: "नळ जोडणी प्रकार",
    modal_prop_tax: "वार्षिक पाणी कर (₹)",
    modal_prop_btn_save: "मालमत्ता जतन करा",

    modal_add_tank_title: "नवीन पाण्याची टाकी जोडा",
    modal_edit_tank_title: "टाकी सेटिंग्ज बदला",
    modal_tank_name: "टाकीचे नाव",
    modal_tank_type: "टाकीचा प्रकार",
    modal_tank_location: "ठिकाण / परिसर",
    modal_tank_shape: "टाकीचा आकार",
    modal_tank_cap: "एकूण साठवण क्षमता (लिटर)",
    modal_tank_meas_method: "पातळी मोजण्याची पद्धत",
    modal_tank_btn_register: "पाण्याची टाकी नोंदवा",

    modal_record_reading_title: "पाणी पातळी मोजमाप नोंदवा",
    modal_reading_select_tank: "पाण्याची टाकी निवडा",
    modal_reading_quantity: "सध्याचा पाणी साठा (लिटर)",
    modal_reading_method: "वापरलेली मोजणी पद्धत",
    modal_reading_remarks: "कर्मचारी शेरा / निरीक्षण",
    modal_reading_btn_save: "मोजमाप जतन करा",

    modal_tank_history_title: "पाणी पातळी नोंदींचा इतिहास",
    modal_tank_estimate_title: "पाणी संपण्याचा अंदाज",
    modal_tank_alerts_title: "कमी पाणी साठा इशारे व सूचना",

    // --- Statuses & State Badges ---
    status_active: "सक्रिय",
    status_active_now: "सध्या सुरू (सक्रिय)",
    status_inactive: "निष्क्रिय",
    status_paid: "भरले आहे",
    status_unpaid: "थकबाकी",
    status_pending: "प्रलंबित",
    status_dispatched: "कार्यवाही सुरू",
    status_resolved: "निवारण झाले",
    status_completed: "पूर्ण झाले",
    status_upcoming: "येणारा पुरवठा",
    status_tomorrow: "उद्या",
    status_normal_label: "सामान्य",
    status_low_label: "कमी",
    status_critical_label: "अतिगंभीर",
    status_empty_label: "रिक्त / कोरडी",
    status_overflow_label: "ओव्हरफ्लो धोका",

    // Supply & Connection Types
    supply_tap: "नळ पाईपलाईन",
    supply_tanker: "पाणी टँकर",
    supply_well: "सार्वजनिक विहीर",
    conn_domestic_metered: "घरगुती मिटरयुक्त नळ",
    conn_domestic_flat: "घरगुती निश्चित दर नळ",
    conn_commercial: "व्यावसायिक जोडणी",
    conn_community: "सार्वजनिक नळ स्टँडपोस्ट",

    // Common Action Buttons, Tables & Labels
    btn_edit: "संपादित करा",
    btn_delete: "हटवा",
    btn_activate: "सक्रिय करा",
    btn_deactivate: "निष्क्रिय करा",
    btn_save: "जतन करा",
    status_active: "सक्रिय",
    status_inactive: "निष्क्रिय",
    status_paid: "भरले",
    status_cleared: "निरंक",
    status_unpaid: "थकबाकी",
    prop_due: "थकबाकी",
    prop_clear: "निरंक",
    adm_record_pay: "भरणा नोंदवा",
    adm_mark_paid: "भरणा पूर्ण",
    adm_staff: "प्रशासकीय कर्मचारी",
    adm_respond: "उत्तर द्या",
    adm_notes: "नोंदी पहा / बदला",
    tank_overall_status: "स्थिती",
    tank_current_storage: "सध्याचा साठा:",
    tank_total_capacity: "एकूण क्षमता:",
    tank_free_headroom: "रिकामी जागा:",
    tank_measurement: "मापन पद्धत:",
    tank_method_sensor: "आयओटी सेन्सर",
    tank_method_manual: "मॅन्युअल मोजपट्टी",
    tank_needs_update: "अद्यतन आवश्यक (>२४ तास)",
    tank_verified_live: "थेट सत्यापित",
    tank_pending_meas: "मापन बाकी",
    tank_btn_record: "नोंदवा",
    tank_btn_history: "इतिहास",
    tank_btn_estimate: "अंदाज",
    rep_badge_reports: "तक्रारी",
    rep_empty: "अद्याप कोणतीही तक्रार दाखल नाही.",
    rep_by: "नागरिक",
    cit_btn_pay: "आता भरा",
    tax_btn_pay: "कर भरा",
    cit_gp_response: "ग्रामपंचायत प्रतिसाद:",
    cit_no_bills: "कोणतेही पाणी बिल सापडले नाही.",
    cit_no_payments: "कोणत्याही पावत्या सापडल्या नाहीत.",
    cit_no_taxes: "कोणताही कर बाकी नाही.",
    cit_no_complaints: "कोणतीही तक्रार दाखल नाही.",
    cit_no_schedules: "आपल्या वॉर्डसाठी वेळापत्रक उपलब्ध नाही.",
    cit_active_citizen: "सक्रिय नागरिक",
    cit_inactive_citizen: "खाते निष्क्रिय",
    cit_standby: "स्टँडबाय",
    adm_no_citizens: "कोणतेही नागरिक रेकॉर्ड सापडले नाही.",
    adm_no_properties: "कोणतीही मालमत्ता सापडली नाही.",
    adm_no_bills: "कोणतेही बिल तयार केलेले नाही.",
    adm_no_payments: "कोणताही भरणा नोंदवलेला नाही.",
    adm_no_taxes: "कोणतीही कर आकारणी केलेली नाही.",
    adm_no_complaints: "कोणतीही तक्रार नोंदवलेली नाही.",

    // Footer
    footer_brand: "ग्रामपंचायत • अधिकृत नागरिक सेवा पोर्टल",
    footer_desc: "महाराष्ट्रातील ग्रामपंचायती आणि ग्रामीण जनतेसाठी विकसित. दुष्काळ निवारण, समन्यायी पाणी वाटप आणि पारदर्शक तक्रार निवारणासाठी कटिबद्ध.",
    footer_support: "आपत्कालीन पंचायत मदत: 1800-120-JAL (525) • ईमेल: grampanchayat.water@gov.in",
    footer_rights: "© 2026 ग्रामपंचायत. महाराष्ट्र शासन उपक्रम.",

    // --- Year-Round Gram Panchayat & Unified Applications ---
    nav_report_full: "तक्रारी व अर्ज",
    report_page_title_full: "ग्रामपंचायत तक्रारी, माहिती अधिकार व अर्ज केंद्र",
    report_page_sub_full: "नागरिकांच्या तक्रारी, माहिती अधिकार (RTI) अर्ज, मागणी पत्रे व दाखले मिळण्यासाठी अधिकृत ई-ग्रामपंचायत सेवा केंद्र.",
    app_tab_submit: "नवीन अर्ज / तक्रार दाखल करा",
    app_tab_letter: "अर्ज व विनंती पत्र जनरेटर",
    app_tab_track: "अर्जाची सद्यस्थिती तपासा",
    app_tab_notices: "ग्रामपंचायत सूचना फलक",
    app_tab_feed: "अलीकडील तक्रारींची नोंद",

    // Categories
    cat_complaint: "सार्वजनिक तक्रार / गारगाणी",
    cat_rti: "माहिती अधिकार अर्ज (RTI Act 2005)",
    cat_app_letter: "सर्वसाधारण ग्रामपंचायत अर्ज",
    cat_req_letter: "मागणी / विनंती पत्र",
    cat_water: "पाणी पुरवठा / पाणी गुणवत्ता तक्रार",
    cat_tax: "घर कर / मालमत्ता कर दुरुस्ती विनंती",
    cat_bill: "पाणी बिल / भरणा समस्या",
    cat_cert: "दाखला / कागदपत्र विनंती (रहिवासी, ना-हरकत)",
    cat_sanitation: "स्वच्छता, सांडपाणी, रस्ते व दिवाबत्ती",
    cat_other: "इतर ग्रामपंचायत विषय",

    // RTI Section
    rti_banner_title: "माहितीचा अधिकार अधिनियम २००५ - कायदेशीर सूचना",
    rti_banner_desc: "माहिती अधिकार २००५ अंतर्गत दाखल केलेले अर्ज ३० दिवसांच्या वैधानिक कालमर्यादेत निकाली काढले जातात. ऑनलाईन नोंदणी ही अर्जाच्या सुलभतेसाठी आहे; महाराष्ट्र शासन नियमांनुसार विहित शुल्क (रु. १०) पावती अथवा वैध दारिद्र्यरेषेखालील (BPL) पुरावा आवश्यक राहील.",
    rti_field_citizenship: "मी याद्वारे खात्री देतो/देते की मी भारतीय नागरिक आहे.",
    rti_field_fee_status: "माहिती अधिकार अर्ज शुल्क स्थिती",
    rti_fee_paid: "विहित शुल्क ग्रामपंचायत पावतीसह भरले आहे",
    rti_fee_bpl: "दारिद्र्यरेषेखालील (BPL) - शुल्कातून सूट",
    rti_fee_counter: "ग्रामपंचायत कार्यालयात शुल्क जमा करणार",
    rti_deadline_label: "३० दिवसांची वैधानिक मुदत:",
    rti_days_left: "दिवस शिल्लक",
    rti_overdue: "मुदत संपली (अतितातडी)",

    // Letter Generator
    letter_title: "ग्रामपंचायत अर्ज व विनंती पत्र जनरेटर",
    letter_sub: "अधिकृत शासकीय अर्जाचा नमुना निवडा, आवश्यक मजकूर संपादित करा आणि थेट प्रिंट अथवा PDF डाउनलोड करा.",
    letter_tpl_select: "अर्जाचा अधिकृत नमुना निवडा",
    letter_tpl_general: "ग्रामपंचायत सर्वसाधारण अर्ज",
    letter_tpl_water_conn: "नवीन नळ जोडणी मागणी अर्ज",
    letter_tpl_water_complaint: "पाणी पुरवठा तक्रार व निवारण अर्ज",
    letter_tpl_tax_corr: "घरपट्टी / मालमत्ता कर दुरुस्ती अर्ज",
    letter_tpl_residence: "रहिवासी दाखला मागणी अर्ज",
    letter_tpl_streetlight: "दिवाबत्ती, सांडपाणी गटार व रस्ता दुरुस्ती विनंती",
    letter_tpl_sanitation: "सार्वजनिक स्वच्छता व कचरा निर्मूलन अर्ज",
    letter_lang_en: "इंग्रजी प्रारूप (English)",
    letter_lang_mr: "मराठी प्रारूप (अधिकृत मराठी)",
    letter_btn_print: "प्रिंट / PDF जतन करा",
    letter_btn_submit: "ग्रामपंचायतीकडे ऑनलाईन सादर करा",
    letter_btn_draft: "मसुदा जतन करा",

    // Tracking
    track_title: "अर्जाची सद्यस्थिती तपासा (Track Status)",
    track_sub: "आपल्या अर्जाचा अधिकृत संदर्भ क्रमांक (उदा. RTI-2026-1001 किंवा APP-2026-2002) टाका.",
    track_input_placeholder: "संदर्भ क्रमांक टाका (उदा. RTI-2026-1001)",
    track_btn_search: "स्थिती शोधा",
    track_timeline_submitted: "सादर झाला",
    track_timeline_review: "तपासणी सुरू",
    track_timeline_assigned: "अधिकारी नियुक्त / कार्यवाही",
    track_timeline_resolved: "निकाली / उत्तर दिले",

    // Citizen Portal Tab
    cit_tab_applications: "माझे अर्ज व तक्रारी",
    cit_applications_title: "माझे सादर केलेले अर्ज व माहिती अधिकार विनंत्या",
    cit_no_applications: "अद्याप कोणताही अर्ज किंवा तक्रार दाखल केलेली नाही.",

    // Admin Portal Year-Round Operations
    admin_tab_applications: "अर्जांची नोंदवही",
    admin_tab_rti: "माहिती अधिकार नोंदवही",
    admin_tab_tasks: "दैनिक कामे व नोंदवही",
    admin_tab_notices: "सूचना फलक",
    admin_btn_export_csv: "CSV डाउनलोड",
    admin_btn_add_task: "+ नवीन काम जोडा",
    admin_btn_add_notice: "+ नवीन सूचना प्रसिद्ध करा",
    admin_modal_update_app: "अर्जावर निर्णय व स्थिती अद्यतन",
    admin_assign_officer: "जबाबदार अधिकारी नियुक्त करा",
    admin_official_response: "ग्रामपंचायत अधिकृत उत्तर / शेरा",
    admin_internal_notes: "अंतर्गत कार्यालयीन टिपणी",
    admin_exec_dashboard: "ग्रामपंचायत वार्षिक कामकाज डॅशबोर्ड",
    admin_kpi_citizens_households: "नागरिक व कुटुंबे",
    admin_kpi_apps_today: "आज आलेले अर्ज",
    admin_kpi_pending_matters: "प्रलंबित अर्ज",
    admin_kpi_pending_rti: "माहिती अधिकार अर्ज",
    admin_kpi_revenue_total: "वसुली व थकबाकी",
    admin_kpi_village_water: "एकूण पाणी साठा",
    admin_kpi_open_tasks: "दैनिक दुरुस्ती कामे",

    // --- Official Gram Panchayat & 14 Services ---
    gp_state_tag: "महाराष्ट्र शासन • ग्रामविकास व जलसंधारण विभाग",
    gp_name_default: "ग्रामपंचायत",
    gp_jurisdiction_default: "अधिकृत ग्रामपंचायत नागरिक सेवा पोर्टल",
    gp_intro_default: "ग्रामपंचायत सुंदरपूरच्या अधिकृत ई-प्रशासन पोर्टलवर आपले सहर्ष स्वागत आहे. ग्रामस्थांना पारदर्शक प्रशासन, सर्व नागरी सेवा, वेळेवर तक्रार निवारण आणि वर्षभर सुरळीत पाणीपुरवठा उपलब्ध करून देण्यासाठी हे पोर्टल कटिबद्ध आहे.",
    gp_sarpanch: "सरपंच (Sarpanch)",
    gp_gram_sevak: "ग्रामसेवक / ग्रामविकास अधिकारी",
    gp_secretary: "पंचायत सचिव (Panchayat Secretary)",
    gp_office_phone: "कार्यालय दूरध्वनी",
    gp_office_email: "अधिकृत ईमेल",
    gp_office_hours: "कार्यालयीन वेळ",
    gp_office_address: "कार्यालयाचा पत्ता",
    gp_services_heading: "ग्रामपंचायतीच्या वर्षभराच्या नागरी सेवा",
    gp_services_subheading: "दैनंदिन नागरी सुविधा, शासकीय योजना, जल व्यवस्थापन, तक्रार निवारण व अधिकृत प्रमाणपत्रांचे मार्गदर्शन.",
    
    // 14 Services
    srv_water_title: "पाणीपुरवठा व पाण्याच्या टाक्यांचे निरीक्षण",
    srv_water_desc: "गावातील सर्व जलसाठे, विहिरी व पाण्याच्या टाक्यांची थेट पाणी पातळी तपासा आणि आजचे वॉर्डनिहाय नळ पाणीपुरवठा वेळापत्रक पहा.",
    srv_water_badge: "थेट पातळी निरीक्षण",
    
    srv_bills_title: "पाणीपट्टी देयके व पावती तपशील",
    srv_bills_desc: "घरगुती व व्यावसायिक पाणीपट्टी बिलांची माहिती तपासा, देयक रक्कम भरा आणि ग्रामपंचायतीच्या अधिकृत पावत्या प्राप्त करा.",
    srv_bills_badge: "पाणीपट्टी",
    
    srv_tax_title: "घरपट्टी व मालमत्ता कर माहिती",
    srv_tax_desc: "गावातील नमुना ८ कर आकारणी नोंदवही, चालू वर्षाचा घरपट्टी कर, दिवाबत्ती व आरोग्य कर आकारणी आणि थकबाकी तपशील पहा.",
    srv_tax_badge: "मालमत्ता कर (नमुना ८)",
    
    srv_citizen_reg_title: "नागरिक नोंदणी व कुटुंब नोंदवही",
    srv_citizen_reg_desc: "ग्रामपंचायत कुटुंब नोंदवहीत नोंद करा, घराचा क्रमांक लिंक करा आणि नागरिक स्वयं-सेवेचा थेट लाभ मिळवा.",
    srv_citizen_reg_badge: "कुटुंब नोंदवही",
    
    srv_birth_death_title: "जन्म व मृत्यू नोंदणी प्रमाणपत्र माहिती",
    srv_birth_death_desc: "जन्म-मृत्यू नोंदणी कायद्यानुसार २१ दिवसांत नोंदणी मार्गदर्शक सूचना. प्रत्यक्ष प्रमाणपत्र मिळविण्यासाठी ग्रामपंचायत कार्यालयात भेट देणे आवश्यक आहे.",
    srv_birth_death_badge: "प्रत्यक्ष कार्यालयीन पडताळणी",
    
    srv_residence_cert_title: "रहिवासी दाखला व इतर प्रमाणपत्रे",
    srv_residence_cert_desc: "रहिवासी दाखला (Residence Certificate), शौचालय दाखला, आणि ग्रामपंचायत ना-हरकत प्रमाणपत्र (NOC) साठी अर्ज करा.",
    srv_residence_cert_badge: "दाखले व अर्ज",
    
    srv_new_conn_title: "नवीन नळ जोडणी अर्ज",
    srv_new_conn_desc: "हर घर जल / जल जीवन मिशन अंतर्गत घरगुती अथवा व्यावसायिक नवीन नळ कनेक्शनसाठी मालमत्ता पुराव्यासह अर्ज सादर करा.",
    srv_new_conn_badge: "नवीन नळ जोडणी",
    
    srv_streetlight_title: "दिवाबत्ती व रस्ते दुरुस्ती तक्रारी",
    srv_streetlight_desc: "बंद पथदिवे, खराब अंतर्गत रस्ते, नाल्यांची मोडतोड याविषयी तातडीने तक्रार नोंदवा आणि दुरुस्ती कर्मचारी पाठवा.",
    srv_streetlight_badge: "नागरी दुरुस्ती",
    
    srv_sanitation_title: "सांडपाणी, गटारे व स्वच्छता व्यवस्थापन",
    srv_sanitation_desc: "तुंबलेली गटारे, उघडे सांडपाणी, कचरा डेपो तक्रार किंवा डास प्रतिबंधक जंतुनाशक/ब्लिचिंग पावडर फवारणीसाठी विनंती करा.",
    srv_sanitation_badge: "आरोग्य व स्वच्छता",
    
    srv_grievance_title: "सार्वजनिक तक्रारी व अर्ज ट्रॅकिंग",
    srv_grievance_desc: "ग्रामपंचायतीकडे अधिकृत गाऱ्हाणी नोंदवा, स्वयंचलित संदर्भ क्रमांक मिळवा आणि अर्जाच्या कार्यवाहीची थेट स्थिती तपासा.",
    srv_grievance_badge: "तक्रार निवारण",
    
    srv_rti_title: "माहितीचा अधिकार (RTI) अर्ज व मार्गदर्शन",
    srv_rti_desc: "माहिती अधिकार कायदा २००५ अंतर्गत अधिकृत माहितीसाठी अर्ज करा. ३० दिवसांच्या वैधानिक मुदतीत प्रकरणाचा पाठपुरावा केला जातो.",
    srv_rti_badge: "वैधानिक मुदत ३० दिवस",
    
    srv_schemes_title: "शासकीय योजना व सार्वजनिक सूचना",
    srv_schemes_desc: "पंतप्रधान आवास योजना, संजय गांधी निराधार योजना, शेततळे अनुदान आणि जल जीवन मिशन योजनांची अद्ययावत माहिती मिळवा.",
    srv_schemes_badge: "शासकीय कल्याण योजना",
    
    srv_meetings_title: "ग्रामसभा सूचना व गाव विकास ठराव",
    srv_meetings_desc: "ग्रामसभेच्या अधिकृत बैठकांचे वेळापत्रक, विषयपत्रिका, इतिवृत्त आणि गाव पाणी व स्वच्छता समितीचे ठराव पहा.",
    srv_meetings_badge: "ग्रामसभा व विकास",
    
    srv_letters_title: "ग्रामपंचायत अर्ज व विनंती पत्र जनरेटर",
    srv_letters_desc: "प्रमाणित मराठी व इंग्रजी स्वरूपात ग्रामपंचायतीसाठी विविध विषयांवर अधिकृत अर्ज व विनंती पत्रे तयार करा व प्रिंट/PDF घ्या.",
    srv_letters_badge: "अर्ज जनरेटर",

    home_notices_title: "अधिकृत जाहीर सूचना व ग्रामपंचायत घोषणा",
    home_notices_subtitle: "ग्रामसभा बैठका, पाणी पुरवठा सूचना, कर सवलत मुदत आणि शासकीय योजनांबाबत अद्ययावत माहिती मिळवा",
    home_btn_all_notices: "सर्व सूचना पहा →",
    admin_services_heading: "ग्रामपंचायत नागरिक सेवा व्यवस्थापन",

    // --- Smart Village Admin Portal Keys ---
    admin_gp_title: "सुंदरपूर ग्रा.पं.",
    admin_gp_badge: "स्मार्ट पंचायत",
    admin_nav_overview: "विहंगावलोकन",
    admin_nav_civic: "नागरी प्रशासन",
    admin_nav_revenue: "महसूल आणि सुविधा",
    admin_nav_governance: "प्रशासन व विकास कामे",
    admin_nav_intelligence: "माहिती व अहवाल",
    admin_tab_village_map: "गाव नकाशा व सुविधा",
    admin_bc_portal: "ग्रामपंचायत",
    admin_status_live: "थेट समन्वय",
    btn_add_citizen: "+ नागरिक",
    btn_issue_bill: "+ बिल",
    btn_record_payment: "+ पावती",
    admin_btn_exit: "प्रशासक पोर्टल बंद करा",
    btn_public_portal: "सार्वजनिक पोर्टल",

    kpi_tag_citizens: "लोकसंख्या",
    kpi_total_citizens: "एकूण नोंदणीकृत नागरिक",
    kpi_active_residents: "सक्रिय नागरिक",
    kpi_tag_families: "कुटुंबे",
    kpi_total_households: "एकूण कुटुंबे / घरे",
    kpi_across_wards: "सर्व ४ प्रभागांमध्ये",
    kpi_tag_properties: "नोंदणी",
    kpi_total_properties: "एकूण मिळकती",
    kpi_residential_commercial: "निवासी व व्यावसायिक",
    kpi_tag_services: "सेवा",
    kpi_total_applications: "एकूण अर्ज",
    kpi_submitted_today: "आज प्राप्त",
    kpi_tag_pipeline: "प्रक्रियेत",
    kpi_pending_applications: "प्रलंबित अर्ज",
    kpi_active_rti_matters: "माहिती अधिकार प्रकरणे",
    kpi_tag_redressed: "निवारण",
    kpi_resolved_complaints: "निवारण झालेल्या तक्रारी",
    kpi_citizen_grievances_settled: "ग्रामस्थांच्या तक्रारींचे निवारण",
    kpi_tag_action: "तातडीचे",
    kpi_pending_complaints: "प्रलंबित तक्रारी",
    kpi_action_required: "कर्मचाऱ्यांनी कारवाई आवश्यक",
    kpi_tag_utility: "पाणीपुरवठा",
    kpi_total_water_bills: "एकूण पाणीपट्टी बिले",
    kpi_issued_cycles: "देयक चक्रानुसार जारी",
    kpi_tag_status: "बिल स्थिती",
    kpi_paid_unpaid_bills: "भरलेली व थकबाकी बिले",
    kpi_tag_revenue: "महसूल",
    kpi_total_tax_collection: "एकूण कर वसुली",
    kpi_property_sanitation_cess: "घरपट्टी, पाणीपट्टी व उपकर",
    kpi_tag_arrears: "थकबाकी",
    kpi_pending_tax_collection: "प्रलंबित कर येणे",
    kpi_outstanding_assessments: "थकीत कर आकारणी",
    kpi_tag_ongoing: "चालू",
    kpi_active_works: "चालू विकास कामे",
    kpi_works_in_progress: "गावातील प्रगतीपथावरील कामे",
    kpi_tag_completed: "पूर्ण",
    kpi_completed_works: "पूर्ण झालेली विकास कामे",
    kpi_delivered_projects: "तपासणी व पूर्णता अहवाल",

    chart_ward_citizens_title: "प्रभागानिहाय नागरिक संख्या",
    chart_badge_demographics: "लोकसंख्या",
    chart_ward_households_title: "प्रभागानिहाय कुटुंबे व मिळकती",
    chart_badge_properties: "घरे",
    chart_revenue_trend_title: "मासिक महसूल व कर वसुली कल",
    chart_badge_finance: "वसुली",
    chart_water_bills_title: "पाणीपट्टी बिल वसुली स्थिती",
    chart_badge_water_bills: "उपयोगिता बिले",
    chart_complaints_title: "तक्रार निवारण स्थिती",
    chart_badge_grievances: "तक्रारी",
    chart_applications_title: "नागरिक अर्ज प्रक्रिया प्रवाह",
    chart_badge_pipeline: "प्रक्रिया",
    chart_work_progress_title: "विकास कामांची प्रगती व पूर्णता",
    chart_badge_works: "कामे",

    dash_recent_activity_title: "अलिकडील ग्रामपंचायत घडामोडी",
    dash_activity_live: "थेट प्रवाह",
    dash_sla_alerts_title: "मुदत मर्यादा व तातडीच्या सूचना",
    admin_btn_view_profile: "३६०° प्रोफाइल",
    report_btn_print: "अधिकृत अहवाल प्रिंट करा",
    report_btn_export: "CSV फाइल डाउनलोड करा"
  }
};

const LANG_STORAGE_KEY = "jalmitra_language_pref";
let currentLang = "en";
const listeners = [];

export function getLanguage() {
  return currentLang;
}

export function t(key, fallback = "") {
  const dict = translations[currentLang] || translations.en;
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  // Fallback to English
  if (translations.en && translations.en[key] !== undefined) {
    return translations.en[key];
  }
  return fallback || key;
}

// Translate common status strings (without mutating DB values)
export function formatStatus(status) {
  if (!status) return "";
  const s = String(status).toLowerCase();
  if (currentLang === "mr") {
    if (s === "active") return "सक्रिय";
    if (s === "inactive") return "निष्क्रिय";
    if (s === "paid") return "भरले आहे";
    if (s === "cleared") return "निरंक";
    if (s === "unpaid") return "थकबाकी";
    if (s === "pending") return "प्रलंबित";
    if (s === "in progress") return "प्रगतीपथावर";
    if (s === "dispatched") return "कार्यवाही सुरू";
    if (s === "resolved") return "निवारण झाले";
    if (s === "rejected") return "नाकारले";
    if (s === "completed") return "पूर्ण झाले";
    if (s === "upcoming") return "येणारा पुरवठा";
    if (s === "tomorrow") return "उद्या";
    if (s === "delayed") return "विलंबित";
    if (s === "active now") return "सध्या सुरू आहे";
    if (s === "normal") return "सामान्य";
    if (s === "low") return "कमी";
    if (s === "critical") return "अतिगंभीर";
    if (s === "empty") return "रिक्त";
    if (s === "overflow risk") return "ओव्हरफ्लो धोका";
  }
  return status;
}

export function formatUrgency(urgency) {
  if (!urgency) return "";
  const u = String(urgency).toLowerCase();
  if (currentLang === "mr") {
    if (u === "critical" || u.includes("critical")) return "अतितातडीचे";
    if (u === "urgent" || u.includes("urgent")) return "तातडीचे";
    if (u === "normal" || u.includes("normal")) return "सामान्य";
  }
  return urgency;
}

export function formatSupplyType(type) {
  if (!type) return "";
  const tStr = String(type).toLowerCase();
  if (currentLang === "mr") {
    if (tStr.includes("tap") || tStr.includes("pipeline")) return "नळ पाईपलाईन";
    if (tStr.includes("tanker")) return "पाणी टँकर";
    if (tStr.includes("well")) return "सार्वजनिक विहीर";
  }
  return type;
}

export function formatTankShape(shape) {
  if (!shape) return "";
  const s = String(shape).toLowerCase();
  if (currentLang === "mr") {
    if (s.includes("cylind")) return "उभा दंडगोलाकार (Cylinder)";
    if (s.includes("rectang")) return "आयताकृती (Rectangular)";
    if (s.includes("overhead")) return "उंच गोलाकार टाकी (ESR)";
    if (s.includes("direct")) return "थेट लिटर नोंद (Direct)";
  }
  return shape;
}

export function formatMethod(method) {
  if (!method) return "";
  const m = String(method).toLowerCase();
  if (currentLang === "mr") {
    if (m === "manual") return "मॅन्युअल (कर्मचारी)";
    if (m === "sensor") return "सेन्सर (Telemetry)";
  }
  return method;
}

// Translates backend error messages into friendly Marathi or English
export function translateErrorMessage(err) {
  if (!err) return "";
  const rawMsg = typeof err === "string" ? err : (err.message || String(err));
  if (currentLang !== "mr") return rawMsg;

  if (rawMsg.includes("Name, phone, property number, and ward are required")) {
    return "नाव, मोबाईल क्रमांक, मालमत्ता क्रमांक आणि वॉर्ड निवडणे आवश्यक आहे.";
  }
  if (rawMsg.includes("Invalid login credentials")) {
    return "अवैध लॉगिन माहिती. कृपया आयडी आणि पासवर्ड तपासा.";
  }
  if (rawMsg.includes("Citizen already exists")) {
    return "या मोबाईल क्रमांकाचा किंवा आयडीचा नागरिक आधीच नोंदणीकृत आहे.";
  }
  if (rawMsg.includes("Passwords do not match")) {
    return "पासवर्ड जुळत नाहीत. कृपया पुन्हा तपासा.";
  }
  if (rawMsg.includes("Cannot connect to Express server") || rawMsg.includes("Cannot connect to Gram Panchayat API")) {
    return "बॅकएंड सर्व्हरशी संपर्क होऊ शकत नाही. सर्व्हर सुरू असल्याची खात्री करा.";
  }
  if (rawMsg.includes("Water reading exceeds total storage capacity")) {
    return "नोंदवलेले पाणी टाकीच्या एकूण क्षमतेपेक्षा जास्त असू शकत नाही.";
  }
  if (rawMsg.includes("Water quantity cannot be negative")) {
    return "पाण्याचे प्रमाण उणे (ऋण) असू शकत नाही.";
  }
  return rawMsg;
}

export function onLanguageChange(fn) {
  if (typeof fn === "function") {
    listeners.push(fn);
  }
}

// Apply translations to all DOM elements with data-i18n attributes
export function applyTranslations() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = currentLang;
  document.body.setAttribute("data-lang", currentLang);

  // 1. Text elements
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const text = t(key);
    if (text) {
      el.textContent = text;
    }
  });

  // 2. HTML elements (rich markup)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    const html = t(key);
    if (html) {
      el.innerHTML = html;
    }
  });

  // 3. Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const ph = t(key);
    if (ph) {
      el.setAttribute("placeholder", ph);
    }
  });

  // 4. Titles / aria-labels
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    const title = t(key);
    if (title) {
      el.setAttribute("title", title);
    }
  });

  // 5. Update Switcher Display
  const currentFlag = document.getElementById("langCurrentFlag");
  const currentLabel = document.getElementById("langCurrentLabel");
  const optEn = document.getElementById("optLangEn");
  const optMr = document.getElementById("optLangMr");

  if (currentFlag) {
    currentFlag.textContent = currentLang === "mr" ? "🇮🇳" : "🇬🇧";
  }
  if (currentLabel) {
    currentLabel.textContent = currentLang === "mr" ? "मराठी" : "English";
  }

  if (optEn) optEn.classList.toggle("active", currentLang === "en");
  if (optMr) optMr.classList.toggle("active", currentLang === "mr");
}

export function setLanguage(lang) {
  if (lang !== "en" && lang !== "mr") lang = "en";
  const changed = lang !== currentLang;
  currentLang = lang;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    console.warn("Unable to save language in localStorage:", e);
  }
  applyTranslations();

  if (changed) {
    // Notify registered callbacks only when language changes
    listeners.forEach((fn) => {
      try {
        fn(currentLang);
      } catch (e) {
        console.warn("Language listener error:", e);
      }
    });

    // Dispatch custom window event
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: currentLang } }));
    }
  }
}

export function initI18n() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "mr" || saved === "en") {
      currentLang = saved;
    } else {
      currentLang = "en"; // Default English
    }
  } catch (e) {
    currentLang = "en";
  }

  // Setup DOM Switcher Dropdown Click Handlers
  if (typeof document !== "undefined") {
    const wrap = document.getElementById("langSwitcherWrap");
    const btn = document.getElementById("langSwitcherBtn");
    const menu = document.getElementById("langDropdownMenu");
    const optEn = document.getElementById("optLangEn");
    const optMr = document.getElementById("optLangMr");

    if (btn && menu) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isHidden = menu.hidden;
        menu.hidden = !isHidden;
        btn.setAttribute("aria-expanded", String(!isHidden));
      });

      document.addEventListener("click", (e) => {
        if (wrap && !wrap.contains(e.target)) {
          menu.hidden = true;
          btn.setAttribute("aria-expanded", "false");
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !menu.hidden) {
          menu.hidden = true;
          btn.setAttribute("aria-expanded", "false");
        }
      });
    }

    if (optEn) {
      optEn.addEventListener("click", () => {
        setLanguage("en");
        if (menu) menu.hidden = true;
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }

    if (optMr) {
      optMr.addEventListener("click", () => {
        setLanguage("mr");
        if (menu) menu.hidden = true;
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }

    // Initial translation pass
    applyTranslations();
  }
}

// Make accessible on window
if (typeof window !== "undefined") {
  window.JalMitraI18n = {
    getLanguage,
    setLanguage,
    t,
    formatStatus,
    formatUrgency,
    formatSupplyType,
    formatTankShape,
    formatMethod,
    translateErrorMessage,
    onLanguageChange,
    translations
  };
}
