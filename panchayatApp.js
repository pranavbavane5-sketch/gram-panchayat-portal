/**
 * JalMitra - Gram Panchayat Year-Round E-Governance Controller
 * Handles Official Welcome Hero, 14 Services, Unified Applications, RTI (30-day SLA),
 * Standard Letter Generator, Public Tracking, Citizen Applications, and Admin Modules.
 */

import { api } from "./api.js";
import { t, getLanguage, formatStatus } from "./translations.js";

// ==========================================================
// 1. OFFICIAL HOME PAGE GP WELCOME HERO & 14 SERVICES
// ==========================================================
export function renderPanchayatWelcomeHero(villageInfo = {}) {
  const isMr = getLanguage() === "mr";

  const mainTitle = document.getElementById("gpMainTitle");
  const jurisdictionLine = document.getElementById("gpJurisdictionLine");
  const introPara = document.getElementById("gpIntroPara");

  const enName = (villageInfo.village_name || villageInfo.villageName || "").trim();
  const mrName = (villageInfo.village_name_mr || villageInfo.villageNameMr || "").trim();

  let vName = "";
  if (isMr) {
    vName = mrName || enName || t("gp_name_default", "ग्रामपंचायत");
  } else {
    vName = enName || mrName || t("gp_name_default", "Gram Panchayat");
  }

  const taluka = (villageInfo.taluka || "").trim();
  const district = (villageInfo.district || "").trim();
  const state = (villageInfo.state || "Maharashtra").trim();

  if (mainTitle) {
    mainTitle.textContent = vName;
  }

  if (jurisdictionLine) {
    const parts = [];
    if (vName) parts.push(isMr ? `गाव / पंचायत: ${vName}` : `Gram Panchayat: ${vName}`);
    if (taluka) parts.push(isMr ? `तालुका: ${taluka}` : `Taluka: ${taluka}`);
    if (district) parts.push(isMr ? `जिल्हा: ${district}` : `District: ${district}`);
    if (state) parts.push(state);

    const subtitle = isMr ? "अधिकृत ग्रामपंचायत नागरिक सेवा पोर्टल" : "Official Gram Panchayat Citizen Services Portal";
    jurisdictionLine.innerHTML = `<span>${parts.join(" • ")}</span><div class="gp-subtitle-tag" style="margin-top:6px; font-weight:700; color:#ffffff; opacity:0.95;">${subtitle}</div>`;
  }

  if (introPara) {
    if (isMr) {
      introPara.textContent = villageInfo.intro_text_mr || t("gp_intro_default");
    } else {
      introPara.textContent = villageInfo.intro_text || t("gp_intro_default");
    }
  }

  const sarpanchSubDisplay = document.getElementById("sarpanchSubDisplay");
  if (sarpanchSubDisplay) {
    sarpanchSubDisplay.textContent = vName;
  }

  // Sarpanch
  const sarpanchName = document.getElementById("sarpanchNameDisplay");
  const sarpanchPhoto = document.getElementById("sarpanchPhotoImg");
  const sarpanchFallback = document.getElementById("sarpanchPhotoFallback");
  const sName = villageInfo.sarpanch_name || "Shri. Vitthalrao Deshmukh";
  if (sarpanchName) sarpanchName.textContent = sName;
  if (sarpanchPhoto) {
    if (villageInfo.sarpanch_photo) {
      sarpanchPhoto.src = villageInfo.sarpanch_photo;
      sarpanchPhoto.style.display = "block";
      if (sarpanchFallback) sarpanchFallback.style.display = "none";
    } else {
      sarpanchPhoto.style.display = "none";
      if (sarpanchFallback) {
        sarpanchFallback.textContent = sName.charAt(0) || "स";
        sarpanchFallback.style.display = "block";
      }
    }
  }

  // Gram Sevak
  const gramSevakName = document.getElementById("gramSevakNameDisplay");
  const gramSevakPhoto = document.getElementById("gramSevakPhotoImg");
  const gramSevakFallback = document.getElementById("gramSevakPhotoFallback");
  const gsName = villageInfo.gram_sevak_name || "Shri. Ramesh Patil";
  if (gramSevakName) gramSevakName.textContent = gsName;
  if (gramSevakPhoto) {
    if (villageInfo.gram_sevak_photo) {
      gramSevakPhoto.src = villageInfo.gram_sevak_photo;
      gramSevakPhoto.style.display = "block";
      if (gramSevakFallback) gramSevakFallback.style.display = "none";
    } else {
      gramSevakPhoto.style.display = "none";
      if (gramSevakFallback) {
        gramSevakFallback.textContent = gsName.charAt(0) || "ग";
        gramSevakFallback.style.display = "block";
      }
    }
  }

  // Panchayat Secretary
  const secretaryName = document.getElementById("secretaryNameDisplay");
  const secretaryPhoto = document.getElementById("secretaryPhotoImg");
  const secretaryFallback = document.getElementById("secretaryPhotoFallback");
  const secName = villageInfo.secretary_name || "Smt. Sunita Kulkarni";
  if (secretaryName) secretaryName.textContent = secName;
  if (secretaryPhoto) {
    if (villageInfo.secretary_photo) {
      secretaryPhoto.src = villageInfo.secretary_photo;
      secretaryPhoto.style.display = "block";
      if (secretaryFallback) secretaryFallback.style.display = "none";
    } else {
      secretaryPhoto.style.display = "none";
      if (secretaryFallback) {
        secretaryFallback.textContent = secName.charAt(0) || "प";
        secretaryFallback.style.display = "block";
      }
    }
  }

  // Contact Info Strip
  const phoneDisplay = document.getElementById("gpOfficePhoneDisplay");
  const emailDisplay = document.getElementById("gpOfficeEmailDisplay");
  const hoursDisplay = document.getElementById("gpOfficeHoursDisplay");
  const addressDisplay = document.getElementById("gpOfficeAddressDisplay");

  if (phoneDisplay) phoneDisplay.textContent = villageInfo.office_phone || villageInfo.helpline || "02489-234567 / 1800-120-JAL";
  if (emailDisplay) emailDisplay.textContent = villageInfo.office_email || "grampanchayat.sundarpur@gov.in";
  if (hoursDisplay) hoursDisplay.textContent = villageInfo.office_hours || "Mon – Sat: 10:00 AM – 05:30 PM";
  if (addressDisplay) addressDisplay.textContent = villageInfo.office_address || "Gram Panchayat Karyalaya, Main Chowk, Sundarpur";
}

export function initServiceCardsNavigation(switchPage, switchCitizenTab) {
  const serviceCards = document.querySelectorAll("#gpServicesSection .service-card, #gpServicesSection .service-btn");
  serviceCards.forEach(el => {
    el.addEventListener("click", (e) => {
      const btn = el.classList.contains("service-btn") ? el : el.querySelector(".service-btn");
      if (!btn) return;
      e.stopPropagation();

      const navTarget = btn.getAttribute("data-nav");
      const citTab = btn.getAttribute("data-cit-tab");
      const appTab = btn.getAttribute("data-app-tab");
      const appCat = btn.getAttribute("data-app-cat");
      const appSub = btn.getAttribute("data-app-sub");
      const letterTpl = btn.getAttribute("data-letter-tpl");

      if (navTarget) {
        switchPage(navTarget);
      }

      if (navTarget === "citizen" && citTab && typeof switchCitizenTab === "function") {
        setTimeout(() => switchCitizenTab(citTab), 50);
      }

      if (navTarget === "report") {
        if (appTab) {
          switchAppSectionTab(appTab);
        } else {
          switchAppSectionTab("submit");
        }

        if (appCat) {
          const catSelect = document.getElementById("appCategory");
          if (catSelect) {
            catSelect.value = appCat;
            catSelect.dispatchEvent(new Event("change"));
          }
        }

        if (appSub) {
          const certSubGroup = document.getElementById("certSubGroup");
          const certSelect = document.getElementById("certType");
          if (certSubGroup) certSubGroup.style.display = "block";
          if (certSelect) certSelect.value = appSub;
        }

        if (letterTpl) {
          switchAppSectionTab("letter");
          const tplSelect = document.getElementById("letterTemplateSelect");
          if (tplSelect) {
            tplSelect.value = letterTpl;
            tplSelect.dispatchEvent(new Event("change"));
          }
        }
      }
    });
  });
}

// Subnav pill switcher in #page-report
export function switchAppSectionTab(tabName) {
  const pillBtns = document.querySelectorAll("#appSubnavPills .app-pill-btn");
  pillBtns.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-app-tab") === tabName);
  });

  const panes = document.querySelectorAll("#page-report .app-pane");
  panes.forEach(pane => {
    const paneName = pane.id.replace("appPane", "").toLowerCase();
    pane.classList.toggle("active", paneName === tabName.toLowerCase());
  });

  if (tabName === "notices") {
    loadPublicNoticesView();
  }
}

// ==========================================================
// 2. UNIFIED APPLICATION & RTI SUBMISSION FORM
// ==========================================================
export function initUnifiedApplicationForm(showToast, switchPage) {
  const form = document.getElementById("unifiedApplicationForm");
  const categorySelect = document.getElementById("appCategory");
  const rtiNoticeBox = document.getElementById("rtiNoticeBox");
  const certSubGroup = document.getElementById("certSubGroup");
  const btnSubmit = document.getElementById("btnSubmitApp");

  // Tab switching buttons
  const pillBtns = document.querySelectorAll("#appSubnavPills .app-pill-btn");
  pillBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-app-tab");
      if (tab) switchAppSectionTab(tab);
    });
  });

  // Category change: show/hide RTI and Certificate specific fields
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      const cat = categorySelect.value;
      const isRti = cat === "RTI (Right to Information) Application" || cat.toLowerCase().includes("rti");
      const isCert = cat === "Certificate or Document Request" || cat.toLowerCase().includes("certificate");

      if (rtiNoticeBox) rtiNoticeBox.style.display = isRti ? "block" : "none";
      if (certSubGroup) certSubGroup.style.display = isCert ? "block" : "none";

      const liveBadge = document.getElementById("appLiveRefBadge");
      if (liveBadge) {
        if (isRti) liveBadge.textContent = "REF: RTI-2026-XXXX";
        else if (cat.includes("Letter")) liveBadge.textContent = "REF: REQ-2026-XXXX";
        else if (cat.includes("Complaint") || cat.includes("Grievance")) liveBadge.textContent = "REF: CMP-2026-XXXX";
        else liveBadge.textContent = "REF: APP-2026-XXXX";
      }
    });
  }

  // Pre-fill citizen information if logged in
  prefillCitizenInAppForm();

  // "Generate Printable Letter" button in the form
  const btnLetterFromForm = document.getElementById("btnOpenLetterGenFromForm");
  if (btnLetterFromForm) {
    btnLetterFromForm.addEventListener("click", () => {
      switchAppSectionTab("letter");
    });
  }

  // Submit Handler
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const catInput = document.getElementById("appCategory");
      const nameInput = document.getElementById("appCitizenName");
      const phoneInput = document.getElementById("appCitizenPhone");
      const wardInput = document.getElementById("appWard");
      const propInput = document.getElementById("appPropertyNo");
      const subjectInput = document.getElementById("appSubject");
      const urgencyInput = document.getElementById("appUrgency");
      const descInput = document.getElementById("appDescription");
      const fileInput = document.getElementById("appAttachment");
      const rtiCheck = document.getElementById("rtiCitizenCheckbox");
      const rtiFee = document.getElementById("rtiFeeStatus");
      const certType = document.getElementById("certType");

      const category = catInput ? catInput.value : "Public Complaint / Grievance";
      const isRti = category.includes("RTI");

      // Validations
      let hasError = false;

      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        document.getElementById("errAppName")?.classList.add("visible");
        nameInput.classList.add("is-invalid");
        hasError = true;
      } else {
        document.getElementById("errAppName")?.classList.remove("visible");
        nameInput.classList.remove("is-invalid");
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneInput.value.trim())) {
        document.getElementById("errAppPhone")?.classList.add("visible");
        phoneInput.classList.add("is-invalid");
        hasError = true;
      } else {
        document.getElementById("errAppPhone")?.classList.remove("visible");
        phoneInput.classList.remove("is-invalid");
      }

      if (!wardInput.value) {
        document.getElementById("errAppWard")?.classList.add("visible");
        wardInput.classList.add("is-invalid");
        hasError = true;
      } else {
        document.getElementById("errAppWard")?.classList.remove("visible");
        wardInput.classList.remove("is-invalid");
      }

      if (!subjectInput.value.trim() || subjectInput.value.trim().length < 3) {
        document.getElementById("errAppSubject")?.classList.add("visible");
        subjectInput.classList.add("is-invalid");
        hasError = true;
      } else {
        document.getElementById("errAppSubject")?.classList.remove("visible");
        subjectInput.classList.remove("is-invalid");
      }

      if (!descInput.value.trim() || descInput.value.trim().length < 10) {
        document.getElementById("errAppDesc")?.classList.add("visible");
        descInput.classList.add("is-invalid");
        hasError = true;
      } else {
        document.getElementById("errAppDesc")?.classList.remove("visible");
        descInput.classList.remove("is-invalid");
      }

      if (isRti && rtiCheck && !rtiCheck.checked) {
        showToast("Please confirm Indian citizenship to submit an RTI application.", "error");
        hasError = true;
      }

      if (hasError) return;

      // Construct multipart form data
      const formData = new FormData();
      formData.append("category", category);
      formData.append("sub_type", certType && certSubGroup.style.display !== "none" ? certType.value : "");
      formData.append("citizen_name", nameInput.value.trim());
      formData.append("citizen_phone", phoneInput.value.trim());
      formData.append("ward", wardInput.value);
      formData.append("property_number", propInput ? propInput.value.trim() : "");
      formData.append("subject", subjectInput.value.trim());
      formData.append("urgency", urgencyInput ? urgencyInput.value : "Normal");
      formData.append("description", descInput.value.trim());

      const currentUser = api.getCurrentUser();
      if (currentUser && currentUser.citizen_id) {
        formData.append("citizen_id", currentUser.citizen_id);
      }

      if (isRti) {
        formData.append("is_rti", "true");
        formData.append("rti_fee_status", rtiFee ? rtiFee.value : "Pending");
      }

      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
          showToast("Attachment size exceeds 5MB limit. Please attach a smaller file.", "error");
          return;
        }
        formData.append("attachment", file);
      }

      // Button state
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-inline"></span> Submitting to Gram Panchayat...`;
      }

      try {
        const res = await api.submitApplication(formData);
        const refNo = res.reference_no || res.id;

        showToast(`Application successfully registered! Reference #: ${refNo}`, "success");

        // Clear form
        form.reset();
        prefillCitizenInAppForm();
        if (rtiNoticeBox) rtiNoticeBox.style.display = "none";
        if (certSubGroup) certSubGroup.style.display = "none";

        // Prompt user with reference number and offer tracking
        const trackPrompt = confirm(
          `Your application has been officially recorded in the Gram Panchayat register!\n\nReference Number: ${refNo}\n\nWould you like to track its live status now?`
        );
        if (trackPrompt) {
          switchAppSectionTab("track");
          const trackInput = document.getElementById("trackRefInput");
          if (trackInput) {
            trackInput.value = refNo;
            document.getElementById("btnTrackSearch")?.click();
          }
        }
      } catch (err) {
        console.error("Application submission failed:", err);
        showToast("Submission failed: " + err.message, "error");
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<span>Submit Official Application / Grievance</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        }
      }
    });
  }
}

export function prefillCitizenInAppForm() {
  const user = api.getCurrentUser();
  if (!user || user.role !== "citizen") return;

  const nameInput = document.getElementById("appCitizenName");
  const idInput = document.getElementById("appCitizenId");
  const phoneInput = document.getElementById("appCitizenPhone");
  const wardInput = document.getElementById("appWard");
  const propInput = document.getElementById("appPropertyNo");

  if (nameInput && !nameInput.value) nameInput.value = user.full_name || user.name || "";
  if (idInput) idInput.value = user.citizen_id || user.login_id || user.loginId || "";
  if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || "";
  if (wardInput && user.ward) wardInput.value = user.ward;
  if (propInput && !propInput.value) propInput.value = user.property_number || "";
}

// ==========================================================
// 3. OFFICIAL LETTER & PETITION GENERATOR
// ==========================================================
const LETTER_TEMPLATES = {
  general: {
    titleEn: "General Application to Gram Panchayat",
    titleMr: "ग्रामपंचायतीकडे सर्वसाधारण अर्ज",
    subjectEn: "Subject: Application regarding civic service and general grievance redressal",
    subjectMr: "विषय: ग्रामपंचायत नागरी सुविधा व तक्रार निवारण बाबत अर्ज",
    bodyEn: `Respected Sarpanch / Gram Sevak,\n\nI, the undersigned resident of Sundarpur, respectfully submit this application to draw your kind attention towards the matter stated above.\n\n[Please describe the background facts, locality landmark, and issue details here]\n\nI kindly request the Gram Panchayat to inspect the location and initiate necessary official resolution at the earliest.\n\nThanking you,`,
    bodyMr: `प्रति,\nमा. सरपंच / ग्रामसेवक महोदय,\nग्रामपंचायत सुंदरपूर, ता. कर्जत, जि. अहिल्यानगर.\n\nविषय: नागरी सुविधा व समस्या निवारण बाबत अर्ज.\n\nमहोदय,\n\nमी सुंदरपूर गावचा रहिवासी असून, या अर्जाद्वारे खालील विषयाकडे आपले लक्ष वेधत आहे.\n\n[येथे आपली समस्या, ठिकाण, तारीख व आवश्यक कार्यवाहीचा तपशील लिहावा]\n\nतरी ग्रामपंचायतीने त्वरित पाहणी करून योग्य ती कार्यवाही करावी ही नम्र विनंती.\n\nआपला नम्र,`
  },
  water_conn: {
    titleEn: "Request for New Tap Water Connection",
    titleMr: "नवीन घरगुती नळ जोडणी मिळणेबाबत अर्ज",
    subjectEn: "Subject: Application for sanctioning new domestic tap water connection under Jal Jeevan Mission",
    subjectMr: "विषय: जल जीवन मिशन अंतर्गत नवीन घरगुती नळ कनेक्शन मिळणेबाबत अर्ज",
    bodyEn: `Respected Gram Sevak / VWSC Committee,\n\nI am residing at Property / House No. [House Number] in Ward [Ward Name], Sundarpur. Currently, our household does not have an active tap connection.\n\nI request the Gram Panchayat to sanction a domestic piped connection. I agree to pay the prescribed road-cutting / connection deposit fees and follow all water conservation guidelines.\n\nNecessary property ownership and tax receipt documents are enclosed.`,
    bodyMr: `प्रति,\nमा. सरपंच / ग्रामसेवक तथा पाणी पुरवठा समिती,\nग्रामपंचायत सुंदरपूर.\n\nविषय: नवीन घरगुती नळ जोडणी मिळणेबाबत.\n\nमहोदय,\n\nमी सुंदरपूर येथील वॉर्ड क्रमांक [वॉर्ड नाव] मधील घर नं. [घर क्रमांक] येथे वास्तव्यास आहे. माझ्या घरात अधिकृत नळ कनेक्शन उपलब्ध नाही.\n\nतरी मला नियमानुसार नवीन नळ जोडणी मंजूर करावी. याकरिता लागणारे शासकीय शुल्क व अनामत रक्कम भरण्यास मी तयार आहे.\n\nसोबत घरपट्टी पावती व मालकी पुरावा जोडला आहे.`
  },
  water_complaint: {
    titleEn: "Water Supply Shortage / Contamination Grievance",
    titleMr: "पाणीटंचाई व दूषित पाणीपुरवठा तक्रार अर्ज",
    subjectEn: "Subject: Urgent complaint regarding irregular water supply and contaminated pipeline flow",
    subjectMr: "विषय: अनियमित पाणीपुरवठा व दूषित पाणी येण्याबाबत तातडीची तक्रार",
    bodyEn: `Respected Sarpanch / Water Works Lineman,\n\nFor the past [number] days, the piped water pressure in our area has been critically low and the water appears turbid / unfit for drinking.\n\nGiven the summer water rationing, we request the village administration to flush the pipeline, conduct chlorine testing, and dispatch a water tanker if the disruption continues.\n\nImmediate inspection by the lineman is requested.`,
    bodyMr: `प्रति,\nमा. सरपंच / ग्रामसेवक महोदय,\nग्रामपंचायत सुंदरपूर.\n\nविषय: आमच्या भागात पाणीटंचाई व गढूळ पाणीपुरवठ्याबाबत.\n\nमहोदय,\n\nगेल्या [काही] दिवसांपासून आमच्या वॉर्डात पाण्याचा दाब अत्यंत कमी असून नळाला गढूळ व दुर्गंधीयुक्त पाणी येत आहे. यामुळे ग्रामस्थांचे आरोग्य धोक्यात आले आहे.\n\nतरी ग्रामपंचायतीने त्वरित लाईनमन पाठवून पाईपलाईन दुरुस्त करावी आणि पाण्याची क्लोरीन तपासणी करावी ही विनंती.`
  },
  tax_corr: {
    titleEn: "Property Tax Assessment Correction Request",
    titleMr: "घरपट्टी कर आकारणी दुरुस्ती अर्ज (नमुना ८)",
    subjectEn: "Subject: Application for correction in Village Property Register (Namuna 8) assessment",
    subjectMr: "विषय: ग्रामपंचायत नमुना ८ नोंदवहीतील कर आकारणी व नाव दुरुस्तीबाबत",
    bodyEn: `Respected Secretary / Gram Sevak,\n\nOn reviewing my latest Property Tax demand notice for Property No. [Property Number], I noted a discrepancy in the built-up square footage / annual rate assessment.\n\nI request an authorized site inspection by the Gram Panchayat tax inspector and issuance of a rectified demand note as per actual measurements.\n\nEnclosed: Copy of previous tax receipt and construction sanction.`,
    bodyMr: `प्रति,\nमा. ग्रामसेवक / कर निर्धारक अधिकारी,\nग्रामपंचायत सुंदरपूर.\n\nविषय: घरपट्टी कर आकारणी व क्षेत्रफळ दुरुस्तीबाबत.\n\nमहोदय,\n\nमाझ्या घर नंबर [घर क्रमांक] च्या चालू वर्षाच्या कर मागणी पत्रकात क्षेत्रफळ/आकारणीमध्ये तफावत आढळून आली आहे.\n\nतरी ग्रामपंचायत कर्मचाऱ्यांमार्फत प्रत्यक्ष जागेची मोजणी करून योग्य ती कर आकारणी दुरुस्ती करण्यात यावी ही विनंती.\n\nसोबत जुनी कर पावती व मोजणी नकाशा जोडला आहे.`
  },
  residence: {
    titleEn: "Request for Residence Certificate (रहिवासी दाखला)",
    titleMr: "ग्रामपंचायत रहिवासी दाखला मिळणेबाबत अर्ज",
    subjectEn: "Subject: Application for issuance of Gram Panchayat Village Residence Certificate",
    subjectMr: "विषय: ग्रामपंचायत रहिवासी दाखला मिळणेबाबत विनंती अर्ज",
    bodyEn: `Respected Sarpanch / Gram Sevak,\n\nI am a permanent resident of Sundarpur residing at the above address for the past [years] years. My family's name is registered in the Village Family Register (कुटुंब नोंदवही).\n\nI require an official Gram Panchayat Residence Certificate for [Educational / Bank / Government Job] purposes.\n\nKindly verify the records and issue the certificate upon offline counter verification.`,
    bodyMr: `प्रति,\nमा. सरपंच / ग्रामसेवक महोदय,\nग्रामपंचायत सुंदरपूर, ता. कर्जत, जि. अहिल्यानगर.\n\nविषय: रहिवासी दाखला मिळणेबाबत.\n\nमहोदय,\n\nमी सुंदरपूर गावचा कायमचा रहिवासी असून गेल्या [काही] वर्षांपासून येथे वास्तव्यास आहे. माझे नाव ग्रामपंचायतीच्या कुटुंब नोंदवहीत नोंदवलेले आहे.\n\nमला [शासकीय कामासाठी / शैक्षणिक कामासाठी] रहिवासी दाखल्याची आवश्यकता आहे. तरी मला दाखला मिळवून द्यावा ही नम्र विनंती.`
  },
  streetlight: {
    titleEn: "Streetlight & Road Maintenance Complaint",
    titleMr: "बंद पथदिवे व रस्ता दुरुस्तीबाबत अर्ज",
    subjectEn: "Subject: Complaint regarding burnt-out streetlights and damaged road surface",
    subjectMr: "विषय: बंद पथदिवे सुरू करणे व खराब रस्त्याची दुरुस्ती करणेबाबत",
    bodyEn: `Respected Panchayat Administration,\n\nThis is to notify that [number] streetlights in our lane have been non-functional for over [days] days, causing severe inconvenience to villagers, school children, and elderly residents at night.\n\nAdditionally, the road culvert near [Landmark] has broken and requires gravel patch-work.\n\nKindly dispatch the electrical maintenance crew.`,
    bodyMr: `प्रति,\nमा. सरपंच / ग्रामपंचायत सदस्य,\nग्रामपंचायत सुंदरपूर.\n\nविषय: बंद पथदिवे दुरुस्ती व रस्त्यावरील खड्डे बुजविणेबाबत.\n\nमहोदय,\n\nआमच्या गल्लीतील [संख्या] पथदिवे गेल्या अनेक दिवसांपासून बंद आहेत. त्यामुळे रात्रीच्या वेळी ज्येष्ठ नागरिक व लहान मुलांना अंधारात ये-जा करणे कठीण झाले आहे.\n\nतरी ग्रामपंचायतीने त्वरित नवीन दिवे बसवून पथदिवे सुरू करावेत ही विनंती.`
  },
  sanitation: {
    titleEn: "Sanitation & Drainage Clearance Request",
    titleMr: "सांडपाणी गटारे स्वच्छता व कचरा उचलणेबाबत",
    subjectEn: "Subject: Request for cleaning blocked village gutter and spraying bleaching disinfectant",
    subjectMr: "विषय: तुंबलेली गटारे स्वच्छ करणे व ब्लिचिंग पावडर फवारणीबाबत",
    bodyEn: `Respected Gram Sevak / Village Health Officer,\n\nThe open drainage line in our ward is heavily clogged with silt and plastic debris, causing sewage overflow on the pathway and intense mosquito breeding.\n\nWe urgently request the Gram Panchayat sanitation team to de-silt the drain, clear garbage dumps, and spray mosquito disinfectant powder.\n\nYour prompt public health intervention is appreciated.`,
    bodyMr: `प्रति,\nमा. सरपंच / आरोग्य व स्वच्छता समिती,\nग्रामपंचायत सुंदरपूर.\n\nविषय: तुंबलेली गटारे साफ करणे व जंतुनाशक फवारणीबाबत.\n\nमहोदय,\n\nआमच्या वॉर्डातील सांडपाण्याची गटारे गाळ व कचऱ्यामुळे तुंबली असून सांडपाणी रस्त्यावर वाहत आहे. यामुळे डासांचा प्रादुर्भाव वाढून साथीचे आजार पसरण्याची भीती निर्माण झाली आहे.\n\nतरी तातडीने सफाई कामगार पाठवून गटारे स्वच्छ करावीत व ब्लिचिंग पावडरची फवारणी करावी ही विनंती.`
  }
};

let currentLetterLang = "en";

export function initLetterGenerator(showToast) {
  const tplSelect = document.getElementById("letterTemplateSelect");
  const btnEn = document.getElementById("btnLetterLangEn");
  const btnMr = document.getElementById("btnLetterLangMr");
  const sheet = document.getElementById("letterPaperSheet");
  const btnPrint = document.getElementById("btnPrintLetterSheet");
  const btnSubmit = document.getElementById("btnSubmitLetterSheet");

  function renderLetter() {
    if (!sheet) return;
    const tplKey = (tplSelect && tplSelect.value) || "general";
    const tpl = LETTER_TEMPLATES[tplKey] || LETTER_TEMPLATES.general;

    const user = api.getCurrentUser();
    const citizenName = (user && (user.full_name || user.name)) || "Tukaram Shinde";
    const citizenWard = (user && user.ward) || "Ward 1 - Patel Falia (North)";
    const citizenProp = (user && user.property_number) || "H-104";
    const citizenPhone = (user && user.phone) || "9876543210";
    const todayStr = new Date().toLocaleDateString(currentLetterLang === "mr" ? "mr-IN" : "en-GB");

    const isMr = currentLetterLang === "mr";
    const subject = isMr ? tpl.subjectMr : tpl.subjectEn;
    const body = isMr ? tpl.bodyMr : tpl.bodyEn;

    sheet.innerHTML = `
      <div class="letter-official-header" style="text-align:center; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:20px;">
        <div style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; font-weight:700;">
          ${isMr ? "महाराष्ट्र शासन • ग्रामविकास विभाग" : "Government of Maharashtra • Rural Development Department"}
        </div>
        <div style="font-size:1.6rem; font-weight:900; color:#0f172a; margin:4px 0;">
          ${isMr ? "ग्रामपंचायत सुंदरपूर" : "SUNDARPUR GRAM PANCHAYAT"}
        </div>
        <div style="font-size:0.88rem; color:#475569;">
          ${isMr ? "तालुका: कर्जत, जिल्हा: अहिल्यानगर, महाराष्ट्र" : "Taluka: Karjat, District: Ahmednagar, Maharashtra"}
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:0.92rem;">
        <div>
          <strong>${isMr ? "अर्जदार:" : "From:"}</strong><br>
          <span contenteditable="true" id="letterAuthorName">${citizenName}</span><br>
          <span contenteditable="true" id="letterAuthorAddress">${citizenProp}, ${citizenWard}</span><br>
          ${isMr ? "भ्रमणध्वनी:" : "Phone:"} <span contenteditable="true" id="letterAuthorPhone">${citizenPhone}</span>
        </div>
        <div style="text-align:right;">
          <strong>${isMr ? "दिनांक:" : "Date:"}</strong> <span contenteditable="true" id="letterDate">${todayStr}</span><br>
          <strong>${isMr ? "स्थान:" : "Place:"}</strong> <span contenteditable="true" id="letterPlace">Sundarpur</span>
        </div>
      </div>

      <div style="font-size:1rem; font-weight:800; color:#0f172a; margin:16px 0; background:#f1f5f9; padding:8px 12px; border-left:4px solid #0284c7;" contenteditable="true" id="letterSubject">
        ${subject}
      </div>

      <div style="font-size:0.95rem; line-height:1.75; color:#1e293b; min-height:180px; white-space:pre-line;" contenteditable="true" id="letterBody">
${body}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:40px; padding-top:20px;">
        <div style="font-size:0.85rem; color:#64748b;">
          ${isMr ? "नोंद: हा अधिकृत अर्ज ग्रामपंचायतीस सादर करण्याकरिता आहे." : "Note: Standard format for official submission to Gram Panchayat."}
        </div>
        <div style="text-align:center;">
          <div style="height:40px;"></div>
          <div style="border-top:1px dashed #334155; padding-top:4px; font-weight:700; font-size:0.9rem;">
            (${citizenName})<br>
            <small style="color:#64748b;">${isMr ? "अर्जदाराची सही" : "Applicant Signature"}</small>
          </div>
        </div>
      </div>
    `;
  }

  if (tplSelect) {
    tplSelect.addEventListener("change", renderLetter);
  }

  if (btnEn) {
    btnEn.addEventListener("click", () => {
      currentLetterLang = "en";
      btnEn.classList.add("active");
      if (btnMr) btnMr.classList.remove("active");
      renderLetter();
    });
  }

  if (btnMr) {
    btnMr.addEventListener("click", () => {
      currentLetterLang = "mr";
      btnMr.classList.add("active");
      if (btnEn) btnEn.classList.remove("active");
      renderLetter();
    });
  }

  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener("click", async () => {
      const subjectEl = document.getElementById("letterSubject");
      const bodyEl = document.getElementById("letterBody");
      const authorEl = document.getElementById("letterAuthorName");
      const phoneEl = document.getElementById("letterAuthorPhone");
      const addrEl = document.getElementById("letterAuthorAddress");

      const tplKey = (tplSelect && tplSelect.value) || "general";
      let category = "Application Letter";
      if (tplKey === "water_complaint" || tplKey === "streetlight" || tplKey === "sanitation") {
        category = "General Complaint";
      } else if (tplKey === "water_conn") {
        category = "Water Supply Complaint";
      } else if (tplKey === "tax_corr") {
        category = "Property Tax / Water Bill Query";
      } else if (tplKey === "residence") {
        category = "Certificate or Document Request";
      }

      const payload = {
        category,
        sub_type: tplKey,
        citizen_name: authorEl ? authorEl.textContent.trim() : "Citizen",
        citizen_phone: phoneEl ? phoneEl.textContent.trim() : "9876543210",
        ward: addrEl ? addrEl.textContent.trim() : "Ward 1",
        subject: subjectEl ? subjectEl.textContent.trim() : "Gram Panchayat Application",
        description: bodyEl ? bodyEl.textContent.trim() : "",
        urgency: "Normal"
      };

      try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-inline"></span> Submitting...`;
        const res = await api.submitApplication(payload);
        showToast(`Letter officially submitted to Gram Panchayat! Ref #${res.reference_no}`, "success");
      } catch (err) {
        showToast("Submission failed: " + err.message, "error");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Submit Directly to Panchayat</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
      }
    });
  }

  // Initial letter render
  renderLetter();
}

// ==========================================================
// 4. PUBLIC APPLICATION & RTI TRACKING
// ==========================================================
export function initApplicationTracking(showToast) {
  const trackInput = document.getElementById("trackRefInput");
  const trackBtn = document.getElementById("btnTrackSearch");
  const resultBox = document.getElementById("trackResultBox");

  if (!trackBtn || !trackInput) return;

  async function performSearch() {
    const refNo = trackInput.value.trim();
    if (!refNo || refNo.length < 5) {
      showToast("Please enter a valid application reference number (e.g. RTI-2026-1001)", "error");
      return;
    }

    trackBtn.disabled = true;
    trackBtn.innerHTML = `<span class="spinner-inline"></span> Tracking...`;

    try {
      const app = await api.trackApplication(refNo);
      renderTrackingResult(app);
    } catch (err) {
      if (resultBox) {
        resultBox.style.display = "block";
        resultBox.innerHTML = `
          <div style="background:#fee2e2; border:1px solid #fecaca; border-radius:var(--radius-md); padding:20px; color:#991b1b; text-align:center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <h4 style="margin-bottom:6px;">Reference Number Not Found</h4>
            <p style="font-size:0.9rem; margin:0;">No record was found for <strong>${escapeHtml(refNo)}</strong>. Please verify your reference number printed on your receipt.</p>
          </div>
        `;
      }
    } finally {
      trackBtn.disabled = false;
      trackBtn.innerHTML = `<span>Track Status</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    }
  }

  trackBtn.addEventListener("click", performSearch);
  trackInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });
}

function renderTrackingResult(app) {
  const resultBox = document.getElementById("trackResultBox");
  if (!resultBox) return;

  resultBox.style.display = "block";

  const isRti = app.is_rti || app.category === "RTI Application";
  const dateFmt = new Date(app.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  // Timeline step active states
  const s = (app.status || "Submitted").toLowerCase();
  const isUnderReview = s === "under review" || s === "additional information required" || s === "resolved";
  const isAssigned = (app.assigned_to && app.assigned_to.trim().length > 0) || s === "resolved";
  const isResolved = s === "resolved" || s === "rejected";

  let rtiDeadlineBlock = "";
  if (isRti && app.rti_deadline) {
    const daysLeft = app.days_remaining !== undefined ? app.days_remaining : 30;
    const isOverdue = daysLeft < 0;
    rtiDeadlineBlock = `
      <div style="background:${isOverdue ? '#fef2f2' : '#f0fdf4'}; border:1px solid ${isOverdue ? '#f87171' : '#86efac'}; border-radius:var(--radius-md); padding:12px; margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:800; color:${isOverdue ? '#b91c1c' : '#15803d'};">
            RTI Act 2005 Statutory SLA
          </span>
          <div style="font-size:0.92rem; font-weight:700; color:#0f172a;">
            Deadline: ${new Date(app.rti_deadline).toLocaleDateString("en-GB")}
          </div>
        </div>
        <span class="badge-pill" style="background:${isOverdue ? '#ef4444' : '#22c55e'}; color:#ffffff; font-weight:800;">
          ${isOverdue ? `OVERDUE BY ${Math.abs(daysLeft)} DAYS` : `${daysLeft} Days Remaining`}
        </span>
      </div>
    `;
  }

  resultBox.innerHTML = `
    <div class="tracking-result-card" style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-md);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
        <div>
          <span style="font-size:0.78rem; text-transform:uppercase; font-weight:800; color:var(--primary); letter-spacing:0.04em;">
            ${escapeHtml(app.category)}
          </span>
          <h3 style="font-size:1.35rem; font-weight:900; margin:2px 0; font-family:var(--font-mono); color:var(--text-main);">
            ${escapeHtml(app.reference_no)}
          </h3>
          <div style="font-size:0.85rem; color:var(--text-muted);">
            Filed on: <strong>${dateFmt}</strong> &bull; Ward: <strong>${escapeHtml(app.ward || "Village")}</strong>
          </div>
        </div>
        <div>
          ${formatStatusBadge(app.status)}
        </div>
      </div>

      <!-- Subject & Text -->
      <div style="margin-bottom:16px;">
        <div style="font-size:1.02rem; font-weight:800; color:var(--text-main); margin-bottom:4px;">
          ${escapeHtml(app.subject)}
        </div>
        <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6; margin:0;">
          ${escapeHtml(app.description)}
        </p>
      </div>

      ${rtiDeadlineBlock}

      <!-- Progress Timeline -->
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin:24px 0; text-align:center;">
        <div style="padding:10px; border-radius:var(--radius-sm); background:#dbeafe; color:#1e40af; font-weight:700; font-size:0.82rem;">
          1. Submitted &#10003;
        </div>
        <div style="padding:10px; border-radius:var(--radius-sm); background:${isUnderReview ? '#dbeafe' : '#f1f5f9'}; color:${isUnderReview ? '#1e40af' : '#94a3b8'}; font-weight:700; font-size:0.82rem;">
          2. Under Review
        </div>
        <div style="padding:10px; border-radius:var(--radius-sm); background:${isAssigned ? '#dbeafe' : '#f1f5f9'}; color:${isAssigned ? '#1e40af' : '#94a3b8'}; font-weight:700; font-size:0.82rem;">
          3. Officer Assigned
        </div>
        <div style="padding:10px; border-radius:var(--radius-sm); background:${isResolved ? (s === 'rejected' ? '#fee2e2' : '#dcfce7') : '#f1f5f9'}; color:${isResolved ? (s === 'rejected' ? '#991b1b' : '#166534') : '#94a3b8'}; font-weight:700; font-size:0.82rem;">
          4. ${s === 'rejected' ? 'Rejected' : 'Resolved'}
        </div>
      </div>

      <!-- Official Response Box -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-md); padding:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="font-size:0.82rem; font-weight:800; text-transform:uppercase; color:#0369a1;">
            Official Gram Panchayat Response
          </span>
          <span style="font-size:0.82rem; color:#64748b;">
            Assigned: <strong>${escapeHtml(app.assigned_to || "Panchayat Scrutiny Desk")}</strong>
          </span>
        </div>
        <p style="font-size:0.92rem; color:#334155; margin:0; line-height:1.5;">
          ${app.official_response ? escapeHtml(app.official_response) : "Your request has been received and registered. An authorized officer will inspect the matter and update the resolution remarks shortly."}
        </p>
      </div>

      ${app.attachment_path ? `
        <div style="margin-top:14px;">
          <a href="/api${app.attachment_path}" target="_blank" class="btn btn-outline-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            <span>View Supporting Attachment</span>
          </a>
        </div>
      ` : ""}
    </div>
  `;
}

// ==========================================================
// 5. PUBLIC NOTICES VIEW
// ==========================================================
export async function loadPublicNoticesView() {
  const container = document.getElementById("publicNoticesGrid") || document.getElementById("publicNoticesContainer");
  if (!container) return;

  try {
    const notices = await api.getPublicNotices();
    const isMr = getLanguage() === "mr";

    if (!notices || notices.length === 0) {
      container.innerHTML = `
        <div class="admin-empty-state" style="padding:40px; text-align:center;">
          <p>No active notices published at this time.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notices.map(n => {
      const title = isMr && n.title_mr ? n.title_mr : n.title;
      const content = isMr && n.content_mr ? n.content_mr : n.content;
      const dateFmt = new Date(n.created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      });

      return `
        <div class="notice-card" style="background:var(--bg-card); border:1px solid var(--border-light); border-left:4px solid #0284c7; border-radius:var(--radius-md); padding:20px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <span class="badge-pill" style="background:#e0f2fe; color:#0369a1; font-size:0.75rem; font-weight:800; text-transform:uppercase;">
              ${escapeHtml(n.category || "General")}
            </span>
            <span style="font-size:0.8rem; color:var(--text-muted);">${dateFmt}</span>
          </div>
          <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-main); margin-bottom:8px;">
            ${escapeHtml(title)}
          </h3>
          <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6; margin:0; white-space:pre-line;">
            ${escapeHtml(content)}
          </p>
        </div>
      `;
    }).join("");
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);">Failed to load notices: ${escapeHtml(err.message)}</p>`;
  }
}

// ==========================================================
// 6. CITIZEN PORTAL APPLICATIONS TAB
// ==========================================================
export async function loadCitizenApplications() {
  const tbody = document.getElementById("citApplicationsTableBody");
  const emptyState = document.getElementById("citApplicationsEmptyState");
  if (!tbody) return;

  try {
    let apps = await api.getCitizenApplications();
    if (apps && apps.applications) apps = apps.applications;

    if (!apps || apps.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = apps.map(app => {
      const dateFmt = new Date(app.created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short"
      });

      return `
        <tr>
          <td><strong style="font-family:var(--font-mono); color:var(--primary);">${escapeHtml(app.reference_no)}</strong></td>
          <td>${dateFmt}</td>
          <td><span style="font-size:0.82rem; font-weight:700;">${escapeHtml(app.category)}</span></td>
          <td>
            <strong>${escapeHtml(app.subject)}</strong>
            <div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(app.description.slice(0, 60))}...</div>
          </td>
          <td>${formatStatusBadge(app.status)}</td>
          <td>${escapeHtml(app.assigned_to || "Panchayat Scrutiny")}</td>
          <td>
            <div style="font-size:0.85rem; color:#1e293b; max-width:260px;">
              ${app.official_response ? escapeHtml(app.official_response) : "<em style='color:#94a3b8;'>Awaiting official review</em>"}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load citizen applications:", err);
  }
}

// ==========================================================
// 7. ADMIN PORTAL: APPLICATIONS & RTI REGISTERS, TASKS & NOTICES
// ==========================================================
let allAdminApplications = [];
let allAdminTasks = [];
let allAdminNotices = [];

export async function initAdminPanchayatModule(showToast) {
  // Wire New Task Button & Modal
  const btnAddTask = document.getElementById("btnOpenAddTaskModal");
  const modalTask = document.getElementById("adminAddTaskModal");
  const btnCloseTask = document.getElementById("btnCloseAddTaskModal");
  const btnCancelTask = document.getElementById("btnCancelAddTaskModal");
  const formTask = document.getElementById("adminAddTaskForm");

  if (btnAddTask && modalTask) {
    btnAddTask.addEventListener("click", () => {
      modalTask.hidden = false;
    });
  }
  const closeTaskModal = () => { if (modalTask) modalTask.hidden = true; };
  if (btnCloseTask) btnCloseTask.addEventListener("click", closeTaskModal);
  if (btnCancelTask) btnCancelTask.addEventListener("click", closeTaskModal);

  if (formTask) {
    formTask.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("taskTitle").value.trim();
      const category = document.getElementById("taskCategory").value;
      const priority = document.getElementById("taskPriority").value;
      const ward = document.getElementById("taskWard").value.trim();
      const assignedTo = document.getElementById("taskAssignedTo").value.trim();

      if (!title) return;

      try {
        await api.createPanchayatTask({
          title, category, priority, ward, assigned_to: assignedTo
        });
        showToast("Maintenance task created!", "success");
        formTask.reset();
        closeTaskModal();
        loadAdminTasks();
      } catch (err) {
        showToast("Failed to create task: " + err.message, "error");
      }
    });
  }

  // Wire New Notice Button & Modal
  const btnAddNotice = document.getElementById("btnOpenAddNoticeModal");
  const modalNotice = document.getElementById("adminAddNoticeModal");
  const btnCloseNotice = document.getElementById("btnCloseAddNoticeModal");
  const btnCancelNotice = document.getElementById("btnCancelAddNoticeModal");
  const formNotice = document.getElementById("adminAddNoticeForm");

  if (btnAddNotice && modalNotice) {
    btnAddNotice.addEventListener("click", () => {
      modalNotice.hidden = false;
    });
  }
  const closeNoticeModal = () => { if (modalNotice) modalNotice.hidden = true; };
  if (btnCloseNotice) btnCloseNotice.addEventListener("click", closeNoticeModal);
  if (btnCancelNotice) btnCancelNotice.addEventListener("click", closeNoticeModal);

  if (formNotice) {
    formNotice.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("noticeTitle").value.trim();
      const titleMr = document.getElementById("noticeTitleMr").value.trim();
      const category = document.getElementById("noticeCategory").value;
      const priority = document.getElementById("noticePriority").value;
      const content = document.getElementById("noticeContent").value.trim();
      const contentMr = document.getElementById("noticeContentMr").value.trim();

      if (!title || !content) return;

      try {
        await api.createAdminNotice({
          title, title_mr: titleMr, category, priority, content, content_mr: contentMr
        });
        showToast("Notice successfully published to village portal!", "success");
        formNotice.reset();
        closeNoticeModal();
        loadAdminNotices();
      } catch (err) {
        showToast("Failed to publish notice: " + err.message, "error");
      }
    });
  }

  // Wire Update Application Modal
  const modalUpdateApp = document.getElementById("adminUpdateAppModal");
  const btnCloseUpdateApp = document.getElementById("btnCloseUpdateAppModal");
  const btnCancelUpdateApp = document.getElementById("btnCancelUpdateAppModal");
  const formUpdateApp = document.getElementById("adminUpdateAppForm");

  const closeUpdateAppModal = () => { if (modalUpdateApp) modalUpdateApp.hidden = true; };
  if (btnCloseUpdateApp) btnCloseUpdateApp.addEventListener("click", closeUpdateAppModal);
  if (btnCancelUpdateApp) btnCancelUpdateApp.addEventListener("click", closeUpdateAppModal);

  if (formUpdateApp) {
    formUpdateApp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const appId = document.getElementById("adminUpdateAppId").value;
      const status = document.getElementById("updateAppStatus").value;
      const officer = document.getElementById("updateAppOfficer").value.trim();
      const response = document.getElementById("updateAppResponse").value.trim();
      const notes = document.getElementById("updateAppInternalNotes").value.trim();

      try {
        await api.updateAdminApplicationStatus(appId, {
          status,
          assigned_to: officer,
          official_response: response,
          internal_notes: notes
        });
        showToast("Application status & official response saved!", "success");
        closeUpdateAppModal();
        loadAdminApplications();
        loadAdminExecutiveKPIs();
      } catch (err) {
        showToast("Failed to update status: " + err.message, "error");
      }
    });
  }

  // Application Search & Filters
  const searchInput = document.getElementById("adminAppSearch");
  const filterCat = document.getElementById("adminAppFilterCategory");
  const filterStat = document.getElementById("adminAppFilterStatus");
  const filterWard = document.getElementById("adminAppFilterWard");

  const triggerFilter = () => {
    loadAdminApplications({
      search: searchInput ? searchInput.value.trim() : "",
      category: filterCat ? filterCat.value : "",
      status: filterStat ? filterStat.value : "",
      ward: filterWard ? filterWard.value : ""
    });
  };

  if (searchInput) searchInput.addEventListener("input", debounce(triggerFilter, 300));
  if (filterCat) filterCat.addEventListener("change", triggerFilter);
  if (filterStat) filterStat.addEventListener("change", triggerFilter);
  if (filterWard) filterWard.addEventListener("change", triggerFilter);

  // CSV Export Buttons
  const btnExportApps = document.getElementById("btnAdminExportAppsCsv");
  if (btnExportApps) {
    btnExportApps.addEventListener("click", async () => {
      try {
        showToast("Generating CSV export...", "info");
        await api.exportAdminApplicationsCsv({
          category: filterCat ? filterCat.value : "",
          status: filterStat ? filterStat.value : "",
          ward: filterWard ? filterWard.value : ""
        });
        showToast("CSV downloaded successfully!", "success");
      } catch (err) {
        showToast("Export failed: " + err.message, "error");
      }
    });
  }

  const btnExportRti = document.getElementById("btnAdminExportRtiCsv");
  if (btnExportRti) {
    btnExportRti.addEventListener("click", async () => {
      try {
        showToast("Generating RTI Register export...", "info");
        await api.exportAdminApplicationsCsv({ is_rti: "true" });
        showToast("RTI Register downloaded successfully!", "success");
      } catch (err) {
        showToast("Export failed: " + err.message, "error");
      }
    });
  }
}

export async function loadAdminApplications(filters = {}) {
  const tbody = document.getElementById("adminApplicationsTableBody");
  const emptyState = document.getElementById("adminApplicationsEmpty");
  if (!tbody) return;

  try {
    const res = await api.getAdminApplications(filters);
    const apps = res.applications || res;
    allAdminApplications = apps;

    if (!apps || apps.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = apps.map(app => {
      const dateFmt = new Date(app.created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short"
      });

      return `
        <tr>
          <td><strong style="font-family:var(--font-mono); color:var(--primary);">${escapeHtml(app.reference_no)}</strong></td>
          <td>${dateFmt}</td>
          <td>
            <strong>${escapeHtml(app.citizen_name)}</strong><br>
            <small style="color:var(--text-muted);">${escapeHtml(app.citizen_phone || "")}</small>
          </td>
          <td><span style="font-size:0.8rem; font-weight:700;">${escapeHtml(app.category)}</span></td>
          <td>
            <div style="font-weight:700; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(app.subject)}</div>
          </td>
          <td>${escapeHtml(app.ward || "")}</td>
          <td>${formatStatusBadge(app.status)}</td>
          <td>${escapeHtml(app.assigned_to || "-")}</td>
          <td>
            <button type="button" class="btn btn-outline-primary btn-sm" onclick="window.openAdminUpdateAppModal('${escapeHtml(String(app.id))}')">
              Review / Update
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load admin applications:", err);
  }
}

export async function loadAdminRtiRegister() {
  const tbody = document.getElementById("adminRtiTableBody");
  const emptyState = document.getElementById("adminRtiEmpty");
  if (!tbody) return;

  try {
    const res = await api.getAdminApplications({ is_rti: "true" });
    const rtiList = res.applications || res;

    if (!rtiList || rtiList.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = rtiList.map(app => {
      const filingDate = new Date(app.created_at).toLocaleDateString("en-GB");
      const deadline = app.rti_deadline ? new Date(app.rti_deadline).toLocaleDateString("en-GB") : "-";
      const daysLeft = app.days_remaining !== undefined ? app.days_remaining : 30;
      const isOverdue = daysLeft < 0;

      return `
        <tr>
          <td><strong style="font-family:var(--font-mono); color:#dc2626;">${escapeHtml(app.reference_no)}</strong></td>
          <td>${filingDate}</td>
          <td>
            <strong>${escapeHtml(app.citizen_name)}</strong><br>
            <small style="color:var(--text-muted);">${escapeHtml(app.citizen_phone || "")}</small>
          </td>
          <td>${escapeHtml(app.assigned_to || "Public Info Officer (PIO)")}</td>
          <td><strong>${deadline}</strong></td>
          <td>
            <span class="badge-pill" style="background:${isOverdue ? '#fee2e2' : '#fef3c7'}; color:${isOverdue ? '#b91c1c' : '#92400e'}; font-weight:800;">
              ${isOverdue ? `OVERDUE (${Math.abs(daysLeft)}d)` : `${daysLeft} days remaining`}
            </span>
          </td>
          <td>
            <span style="font-size:0.8rem; font-weight:700;">${escapeHtml(app.rti_fee_status || "Pending")}</span>
          </td>
          <td>${formatStatusBadge(app.status)}</td>
          <td>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="window.openAdminUpdateAppModal('${escapeHtml(String(app.id))}')">
              SLA Action
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load admin RTI register:", err);
  }
}

export async function loadAdminTasks() {
  const tbody = document.getElementById("adminTasksTableBody");
  const emptyState = document.getElementById("adminTasksEmpty");
  if (!tbody) return;

  try {
    const tasks = await api.getPanchayatTasks();
    allAdminTasks = tasks;

    if (!tasks || tasks.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = tasks.map(t => {
      const isDone = t.status === "Completed";
      return `
        <tr>
          <td><strong>#TSK-${t.id}</strong></td>
          <td>
            <strong>${escapeHtml(t.title)}</strong>
          </td>
          <td>${escapeHtml(t.category || "General")}</td>
          <td>
            <span class="priority-pill priority-${(t.priority || "Normal").toLowerCase()}">
              ${escapeHtml(t.priority || "Normal")}
            </span>
          </td>
          <td>${escapeHtml(t.ward || "-")}</td>
          <td>${escapeHtml(t.assigned_to || "-")}</td>
          <td>
            <span class="status-tag ${isDone ? 'status-completed' : (t.status === 'In Progress' ? 'status-in-progress' : 'status-open')}">
              ${escapeHtml(t.status)}
            </span>
          </td>
          <td>
            <div style="display:inline-flex; gap:6px;">
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.viewAdminTask('${escapeHtml(JSON.stringify(t)).replace(/'/g, "&#39;")}')">
                View
              </button>
              <button type="button" class="btn btn-sm ${isDone ? 'btn-secondary' : 'btn-outline-success'}" onclick="window.toggleAdminTaskStatus('${escapeHtml(String(t.id))}', '${isDone ? 'Pending' : 'Completed'}')">
                ${isDone ? 'Reopen' : 'Mark Done'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load admin tasks:", err);
  }
}

export async function loadAdminNotices() {
  const tbody = document.getElementById("adminNoticesTableBody");
  const emptyState = document.getElementById("adminNoticesEmpty");
  if (!tbody) return;

  try {
    const notices = await api.getPublicNotices();
    allAdminNotices = notices;

    if (!notices || notices.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = notices.map(n => {
      const dateFmt = new Date(n.created_at).toLocaleDateString("en-GB");
      return `
        <tr>
          <td>#${n.id}</td>
          <td>
            <strong>${escapeHtml(n.title)}</strong>
            ${n.title_mr ? `<div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(n.title_mr)}</div>` : ""}
          </td>
          <td>${escapeHtml(n.category || "General")}</td>
          <td>${escapeHtml(n.priority || "Normal")}</td>
          <td>${dateFmt}</td>
          <td>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="window.deleteAdminNotice('${escapeHtml(String(n.id))}')">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load admin notices:", err);
  }
}

export async function loadAdminExecutiveKPIs() {
  try {
    const summary = await api.getPanchayatSummary();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal("execKpiCitizens", summary.citizens_count || 0);
    setVal("execKpiProps", `${summary.properties_count || 0} properties registered`);

    setVal("execKpiToday", summary.applications_today || 0);
    setVal("execKpiTotalApps", `${summary.applications_total || 0} total applications`);

    setVal("execKpiPending", summary.pending_applications || 0);
    setVal("execKpiResolved", `${summary.resolved_applications || 0} resolved / closed`);

    setVal("execKpiRti", summary.active_rti || 0);
    setVal("execKpiRtiOverdue", `${summary.overdue_rti || 0} overdue SLA`);

    setVal("execKpiCollected", `₹${(summary.total_collected || 0).toLocaleString()}`);
    setVal("execKpiOutstanding", `₹${(summary.total_outstanding || 0).toLocaleString()} pending dues`);

    setVal("execKpiWaterFill", `${summary.water_reserve_fill_percent || 0}%`);
    setVal("execKpiWaterLiters", `${(summary.water_storage_liters || 0).toLocaleString()} / ${(summary.water_capacity_liters || 0).toLocaleString()} L`);

    setVal("execKpiTasks", summary.open_tasks || 0);
    setVal("execKpiTasksOpen", `${summary.total_tasks || 0} total village works`);

    setVal("execKpiNotices", summary.public_notices_count || 0);

    const tsEl = document.getElementById("adminExecTimestamp");
    if (tsEl) tsEl.textContent = "Synced: " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    console.error("Failed to load admin executive KPIs:", err);
  }
}

// Window global bridges for inline onclicks in admin tables
window.openAdminUpdateAppModal = async function(id) {
  try {
    const raw = await api.getAdminApplicationById(id);
    const app = raw.application || raw;
    const modal = document.getElementById("adminUpdateAppModal");
    if (!modal || !app) return;

    document.getElementById("adminUpdateAppId").value = app.id || "";
    document.getElementById("updateAppRefNo").textContent = app.reference_no || "-";
    document.getElementById("updateAppSubject").textContent = app.subject || "-";
    document.getElementById("updateAppDesc").textContent = app.description || "-";
    document.getElementById("updateAppCitizen").textContent = app.citizen_name || app.applicant_name || "-";
    document.getElementById("updateAppPhone").textContent = app.citizen_phone || app.applicant_phone || "-";
    document.getElementById("updateAppWard").textContent = app.ward || app.ward_area || "-";
    document.getElementById("updateAppStatus").value = app.status || "Submitted";
    document.getElementById("updateAppOfficer").value = app.assigned_to || "";
    document.getElementById("updateAppResponse").value = app.official_response || app.officer_remarks || "";
    document.getElementById("updateAppInternalNotes").value = app.internal_notes || "";

    const attWrap = document.getElementById("updateAppAttachmentWrap");
    const attLink = document.getElementById("updateAppAttachmentLink");
    if (app.attachment_path && attWrap && attLink) {
      attWrap.style.display = "block";
      attLink.href = app.attachment_path.startsWith("http") ? app.attachment_path : `/api${app.attachment_path.startsWith('/') ? '' : '/'}${app.attachment_path}`;
    } else if (attWrap) {
      attWrap.style.display = "none";
    }

    modal.hidden = false;
  } catch (err) {
    alert("Could not load application: " + err.message);
  }
};

window.viewAdminTask = function(taskJson) {
  try {
    const t = typeof taskJson === "string" ? JSON.parse(taskJson) : taskJson;
    const modal = document.getElementById("adminTaskViewModal");
    if (!modal || !t) return;

    const setT = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || "-";
    };

    setT("taskViewId", t.id || "-");
    setT("taskViewTitle", t.title || "-");
    setT("taskViewCategory", t.category || "General");
    setT("taskViewPriority", t.priority || "Normal");
    setT("taskViewWard", t.ward || "All Wards");
    setT("taskViewAssigned", t.assigned_to || "Unassigned");
    setT("taskViewDueDate", t.due_date ? String(t.due_date).split("T")[0] : "No deadline");
    setT("taskViewCreatedBy", t.created_by || "Admin");
    setT("taskViewDesc", t.description || "No additional description provided.");

    const compWrap = document.getElementById("taskViewCompletionWrap");
    if (t.completion_notes && compWrap) {
      compWrap.style.display = "block";
      setT("taskViewCompletionNotes", t.completion_notes);
    } else if (compWrap) {
      compWrap.style.display = "none";
    }

    const badge = document.getElementById("taskViewStatusBadge");
    if (badge) {
      badge.textContent = t.status || "Pending";
      badge.className = "status-tag " + (t.status === "Completed" ? "status-completed" : (t.status === "In Progress" ? "status-in-progress" : "status-open"));
    }

    modal.hidden = false;
  } catch (err) {
    console.error("viewAdminTask error:", err);
  }
};

// Wire close handlers for adminTaskViewModal
const closeTaskModal = () => {
  const modal = document.getElementById("adminTaskViewModal");
  if (modal) modal.hidden = true;
};
const btnCloseTask = document.getElementById("btnCloseTaskViewModal");
const btnCancelTask = document.getElementById("btnCancelTaskViewModal");
if (btnCloseTask) btnCloseTask.addEventListener("click", closeTaskModal);
if (btnCancelTask) btnCancelTask.addEventListener("click", closeTaskModal);

window.toggleAdminTaskStatus = async function(id, newStatus) {
  try {
    await api.updatePanchayatTaskStatus(id, newStatus);
    loadAdminTasks();
    loadAdminExecutiveKPIs();
  } catch (err) {
    alert("Failed to update task: " + err.message);
  }
};

window.deleteAdminNotice = async function(id) {
  if (!confirm("Are you sure you want to unpublish and delete this notice?")) return;
  try {
    await api.deleteAdminNotice(id);
    loadAdminNotices();
    loadAdminExecutiveKPIs();
  } catch (err) {
    alert("Failed to delete notice: " + err.message);
  }
};

// ==========================================================
// UTILITY HELPERS
// ==========================================================
function formatStatusBadge(status) {
  const s = status || "Submitted";
  let cls = "status-tag";
  if (s === "Resolved") cls += " status-completed";
  else if (s === "Under Review") cls += " status-in-progress";
  else if (s === "Additional Information Required") cls += " status-warning";
  else if (s === "Rejected") cls += " status-critical";
  else cls += " status-open";

  return `<span class="${cls}">${escapeHtml(s)}</span>`;
}

function escapeHtml(str) {
  if (typeof str !== "string") return str == null ? "" : String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
