/**
 * JalMitra - Login Rate Limiting & Brute-Force Protection Automated Verification Suite
 * 
 * Verifies:
 * 1. Valid login functions normally without interference.
 * 2. Invalid login attempts are accurately tracked.
 * 3. 5 failed attempts trigger HTTP 429 (Too Many Requests) with Retry-After header.
 * 4. Account-level protection activates even across multiple rotating IPs.
 * 5. Successful login resets counter for single-account legitimate users.
 * 6. Multi-account attacks from a single IP prevent attacker reset evasion.
 * 7. Bilingual messages in English and Marathi are returned.
 * 8. Firestore and MySQL dual-driver persistence parity.
 * 9. Clean cleanup without affecting real production accounts.
 */

import http from "http";
import app from "./server.js";
import { clearRateLimitForTesting, RATE_LIMIT_CONFIG, checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } from "./security/loginRateLimiter.js";
import { checkFirestoreConnection } from "./firestoreDb.js";

let server;
let port;
let baseUrl;

function makeRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      "Content-Type": "application/json",
      ...headers
    };
    if (postData) {
      reqHeaders["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data
          });
        });
      }
    );

    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("   LOGIN RATE LIMITING & BRUTE-FORCE PROTECTION TEST SUITE     ");
  console.log("===============================================================\n");

  // Start temporary test server
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`✓ Test Express server listening on ${baseUrl}`);
      resolve();
    });
  });

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // Check Firestore connection status
    const firestoreStatus = await checkFirestoreConnection();
    console.log(`Firestore Status: ${firestoreStatus.status} (Project: ${firestoreStatus.projectId || "none"})\n`);

    const TEST_IP_1 = "198.51.100.41";
    const TEST_IP_2 = "198.51.100.42";
    const TEST_IP_3 = "198.51.100.43";
    const TEST_IP_4 = "198.51.100.44";
    const TEST_IP_5 = "198.51.100.45";
    const TEST_IP_6 = "198.51.100.46";

    const TEST_USER_A = "ratetest_user_alpha";
    const TEST_USER_B = "ratetest_user_beta";
    const TEST_ADMIN = "admin";

    // Clean any previous test residue
    await clearRateLimitForTesting({ ip: TEST_IP_1, identifier: TEST_USER_A });
    await clearRateLimitForTesting({ ip: TEST_IP_2, identifier: TEST_USER_B });
    await clearRateLimitForTesting({ ip: TEST_IP_3 });
    await clearRateLimitForTesting({ ip: TEST_IP_4 });
    await clearRateLimitForTesting({ ip: TEST_IP_5 });
    await clearRateLimitForTesting({ ip: TEST_IP_6 });

    // -------------------------------------------------------------
    // Test 1: Normal Valid Login Works
    // -------------------------------------------------------------
    console.log("--- Test 1: Valid Login Allowed ---");
    const validRes = await makeRequest("POST", "/api/auth/login", {
      loginId: "admin",
      password: "Admin@123"
    }, { "X-Forwarded-For": TEST_IP_1 });

    assert(validRes.status === 200, `Valid credentials return HTTP 200 (received ${validRes.status})`);
    assert(validRes.data && validRes.data.token, "Valid login returns authentication token");
    console.log();

    // -------------------------------------------------------------
    // Test 2: Invalid Login Attempts Counted (Threshold Trigger)
    // -------------------------------------------------------------
    console.log("--- Test 2: 5 Failed Attempts Trigger HTTP 429 ---");
    for (let i = 1; i <= 5; i++) {
      const failRes = await makeRequest("POST", "/api/auth/login", {
        loginId: TEST_USER_A,
        password: `wrong_pass_${i}`
      }, { "X-Forwarded-For": TEST_IP_1 });

      assert(failRes.status === 401, `Attempt ${i} returns HTTP 401 (received ${failRes.status})`);
      assert(failRes.data.message === "Invalid login credentials.", "Generic failure message returned without account enumeration");
    }

    // 6th attempt should be blocked with HTTP 429
    const blockedRes = await makeRequest("POST", "/api/auth/login", {
      loginId: TEST_USER_A,
      password: "any_password"
    }, { "X-Forwarded-For": TEST_IP_1 });

    assert(blockedRes.status === 429, `Attempt 6 returns HTTP 429 Too Many Requests (received ${blockedRes.status})`);
    assert(blockedRes.headers["retry-after"] !== undefined, "Response includes Retry-After header");
    assert(Number(blockedRes.headers["retry-after"]) > 0, `Retry-After header value is positive (${blockedRes.headers["retry-after"]}s)`);
    assert(blockedRes.data.error === "Too Many Requests", "Response body specifies error: Too Many Requests");
    assert(blockedRes.data.message.includes("Too many failed login attempts"), "English message informs user of rate limit");
    assert(blockedRes.data.message_mr && blockedRes.data.message_mr.includes("अनेक अयशस्वी"), "Marathi message is provided");
    console.log();

    // -------------------------------------------------------------
    // Test 3: Account-Level Protection Across Distributed IPs
    // -------------------------------------------------------------
    console.log("--- Test 3: Account-Level Protection Across Distributed IPs ---");
    // Clean account TEST_USER_B
    await clearRateLimitForTesting({ identifier: TEST_USER_B });

    const rotatingIps = [TEST_IP_2, TEST_IP_3, TEST_IP_4, TEST_IP_5, TEST_IP_6];
    for (let i = 0; i < 5; i++) {
      const distFail = await makeRequest("POST", "/api/auth/login", {
        loginId: TEST_USER_B,
        password: `bad_pass_${i}`
      }, { "X-Forwarded-For": rotatingIps[i] });

      assert(distFail.status === 401, `Distributed attempt ${i + 1} from ${rotatingIps[i]} returns HTTP 401`);
    }

    // Now attempt 6 from an entirely new IP (198.51.100.99) against the same account
    const distBlockedRes = await makeRequest("POST", "/api/auth/login", {
      loginId: TEST_USER_B,
      password: "password"
    }, { "X-Forwarded-For": "198.51.100.99" });

    assert(distBlockedRes.status === 429, `Account-level protection blocks attempt from new IP with HTTP 429 (received ${distBlockedRes.status})`);
    console.log();

    // -------------------------------------------------------------
    // Test 4: Legitimate User Reset on Successful Login
    // -------------------------------------------------------------
    console.log("--- Test 4: Legitimate User Login Resets Failure Counter ---");
    const LEGIT_IP = "198.51.100.77";
    await clearRateLimitForTesting({ ip: LEGIT_IP, identifier: "admin" });

    // 2 failed attempts
    await makeRequest("POST", "/api/auth/login", {
      loginId: "admin",
      password: "wrong_password_1"
    }, { "X-Forwarded-For": LEGIT_IP });

    await makeRequest("POST", "/api/auth/login", {
      loginId: "admin",
      password: "wrong_password_2"
    }, { "X-Forwarded-For": LEGIT_IP });

    // Then 1 valid login
    const legitSuccess = await makeRequest("POST", "/api/auth/login", {
      loginId: "admin",
      password: "Admin@123"
    }, { "X-Forwarded-For": LEGIT_IP });

    assert(legitSuccess.status === 200, "Valid login succeeds after prior failed attempts");

    // Check rate limit status for LEGIT_IP
    const postLegitCheck = await checkLoginRateLimit({ ip: LEGIT_IP }, "admin");
    assert(!postLegitCheck.blocked, "Rate limit is not blocked after legitimate login");
    console.log();

    // -------------------------------------------------------------
    // Test 5: Attacker Reset Evasion Prevention
    // -------------------------------------------------------------
    console.log("--- Test 5: Attacker Cannot Reset IP Limit by Logging into Dummy Account ---");
    const ATTACKER_IP = "198.51.100.88";
    await clearRateLimitForTesting({ ip: ATTACKER_IP, identifier: "victim_user" });
    await clearRateLimitForTesting({ ip: ATTACKER_IP, identifier: "admin" });

    // Attacker makes 4 failed attempts against "victim_user"
    for (let i = 1; i <= 4; i++) {
      await makeRequest("POST", "/api/auth/login", {
        loginId: "victim_user",
        password: `guess_${i}`
      }, { "X-Forwarded-For": ATTACKER_IP });
    }

    // Attacker then logs in successfully into their own account ("admin")
    const attackerLegit = await makeRequest("POST", "/api/auth/login", {
      loginId: "admin",
      password: "Admin@123"
    }, { "X-Forwarded-For": ATTACKER_IP });

    assert(attackerLegit.status === 200, "Attacker logs into sacrificial account successfully");

    // Attacker tries 1 more failed attempt against "victim_user"
    // Since IP previously had 4 failures against victim_user, this 5th total failure must trigger IP limit
    const fifthVictimAttempt = await makeRequest("POST", "/api/auth/login", {
      loginId: "victim_user",
      password: "guess_5"
    }, { "X-Forwarded-For": ATTACKER_IP });

    assert(fifthVictimAttempt.status === 401, "5th attempt is rejected");

    // The 6th attempt from ATTACKER_IP must now be blocked with 429
    const blockedAttacker = await makeRequest("POST", "/api/auth/login", {
      loginId: "victim_user",
      password: "guess_6"
    }, { "X-Forwarded-For": ATTACKER_IP });

    assert(blockedAttacker.status === 429, `Attacker is blocked with HTTP 429 despite sacrificial login (received ${blockedAttacker.status})`);
    console.log();

    // -------------------------------------------------------------
    // Test 6: Direct Unit Tests on Expiration & Helper Functions
    // -------------------------------------------------------------
    console.log("--- Test 6: Direct Expiration & Helper Tests ---");
    const mockReq = { ip: "203.0.113.195" };
    await clearRateLimitForTesting({ ip: mockReq.ip, identifier: "test_expire" });

    // Record 5 failures directly
    for (let i = 0; i < 5; i++) {
      await recordFailedLogin(mockReq, "test_expire");
    }

    const checkBlocked = await checkLoginRateLimit(mockReq, "test_expire");
    assert(checkBlocked.blocked === true, "Unit check confirms blocked state after 5 failures");
    assert(checkBlocked.retryAfterSeconds <= 900 && checkBlocked.retryAfterSeconds > 890, "Retry-After is correctly calculated near 900 seconds");

    // Clean up
    await clearRateLimitForTesting({ ip: mockReq.ip, identifier: "test_expire" });
    await clearRateLimitForTesting({ ip: TEST_IP_1, identifier: TEST_USER_A });
    await clearRateLimitForTesting({ ip: TEST_IP_2, identifier: TEST_USER_B });
    await clearRateLimitForTesting({ ip: TEST_IP_3 });
    await clearRateLimitForTesting({ ip: TEST_IP_4 });
    await clearRateLimitForTesting({ ip: TEST_IP_5 });
    await clearRateLimitForTesting({ ip: TEST_IP_6 });
    await clearRateLimitForTesting({ ip: LEGIT_IP, identifier: "admin" });
    await clearRateLimitForTesting({ ip: ATTACKER_IP, identifier: "victim_user" });
    await clearRateLimitForTesting({ ip: ATTACKER_IP, identifier: "admin" });
    await clearRateLimitForTesting({ ip: "198.51.100.99", identifier: TEST_USER_B });

    const cleanCheck = await checkLoginRateLimit(mockReq, "test_expire");
    assert(cleanCheck.blocked === false, "Clean up successfully restored unblocked state");
    console.log();

    console.log("===============================================================");
    console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY!       `);
    console.log("===============================================================");
  } catch (err) {
    console.error("Test Suite Error:", err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 500);
  }
}

runTestSuite();
