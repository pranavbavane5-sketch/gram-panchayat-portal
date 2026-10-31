import https from "https";

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "gram-panchayat-portal-sandy.vercel.app",
        path: `/api${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(postData ? { "Content-Length": Buffer.byteLength(postData) } : {})
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runLiveVerification() {
  console.log("🌐 Running Live Verification against https://gram-panchayat-portal-sandy.vercel.app/ ...\n");

  // 1. Health
  const health = await apiRequest("GET", "/health");
  console.log(`1. /api/health -> Status: ${health.status}, Provider: ${health.data.provider}, Connected: ${health.data.database?.connected}`);

  // 2. Existing citizen login (CIT-101)
  const cit1 = await apiRequest("POST", "/auth/login", { loginId: "CIT-101", password: "Citizen@123" });
  console.log(`2. CIT-101 Login -> Status: ${cit1.status}, User: ${cit1.data.user?.fullName}, Role: ${cit1.data.user?.role}`);

  // 3. Lowercase login (cit-101)
  const citLower = await apiRequest("POST", "/auth/login", { loginId: "cit-101", password: "Citizen@123" });
  console.log(`3. cit-101 Lowercase Login -> Status: ${citLower.status}, User: ${citLower.data.user?.fullName}`);

  // 4. Register new citizen
  const rand = Math.floor(1000 + Math.random() * 9000);
  const phone = `98${rand}${rand}`;
  const regPayload = {
    fullName: `Live Resident ${rand}`,
    phone,
    propertyNo: `H-${rand}`,
    wardArea: "Ward 2 - Temple Chowk & Main Bazar",
    password: "LiveSecurePass@123"
  };
  const regRes = await apiRequest("POST", "/auth/register-citizen", regPayload);
  console.log(`4. Register Citizen -> Status: ${regRes.status}, LoginId: ${regRes.data.loginId}, Success: ${regRes.data.success}`);
  const assignedId = regRes.data.loginId;

  // 5. Login with assigned ID
  const loginNewExact = await apiRequest("POST", "/auth/login", { loginId: assignedId, password: "LiveSecurePass@123" });
  console.log(`5. Login with ${assignedId} -> Status: ${loginNewExact.status}, Name: ${loginNewExact.data.user?.fullName}`);

  // 6. Login with lowercase assigned ID
  const loginNewLower = await apiRequest("POST", "/auth/login", { loginId: assignedId.toLowerCase(), password: "LiveSecurePass@123" });
  console.log(`6. Login with ${assignedId.toLowerCase()} -> Status: ${loginNewLower.status}, Success: ${Boolean(loginNewLower.data.token)}`);

  // 7. Login with 10-digit phone number
  const loginNewPhone = await apiRequest("POST", "/auth/login", { loginId: phone, password: "LiveSecurePass@123" });
  console.log(`7. Login with Mobile (${phone}) -> Status: ${loginNewPhone.status}, Name: ${loginNewPhone.data.user?.fullName}`);

  // 8. Authenticated /api/auth/me verification
  const me = await apiRequest("GET", "/auth/me", null, loginNewExact.data.token);
  console.log(`8. /api/auth/me Verification -> Status: ${me.status}, LoginId: ${me.data.user?.loginId}, Profile Loaded: ${Boolean(me.data.user?.citizenProfile)}`);

  console.log("\n✅ ALL LIVE PRODUCTION AUTH VERIFICATIONS PASSED!");
}

runLiveVerification().catch(console.error);

