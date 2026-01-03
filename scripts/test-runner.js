const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runTests() {
  console.log(`Running tests against ${BASE_URL}...\n`);

  // 1. Health Check
  console.log("1. Testing Health Check...");
  try {
    const health = await fetch(`${BASE_URL}/api/healthz`).then((r) => r.json());
    console.log("   Health:", health);
    if (!health.ok)
      console.warn("   WARNING: Health check failed. Is Redis connected?");
  } catch (e) {
    console.error("   ERROR: Could not connect to server. Is it running?");
    return;
  }

  // 2. Create Paste
  console.log("\n2. Testing Creation...");
  const createRes = await fetch(`${BASE_URL}/api/pastes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Hello World", max_views: 2 }),
  });
  const createData = await createRes.json();
  console.log("   Created:", createData);
  const pasteId = createData.id;

  if (!pasteId) {
    console.error("   FAILED: No ID returned");
    return;
  }

  // 3. Fetch Paste (View 1)
  console.log("\n3. Fetching Paste (View 1/2)...");
  const get1 = await fetch(`${BASE_URL}/api/pastes/${pasteId}`);
  const data1 = await get1.json();
  console.log("   Status:", get1.status);
  console.log("   Views Remaining:", data1.remaining_views);

  // 4. Fetch Paste (View 2)
  console.log("\n4. Fetching Paste (View 2/2)...");
  const get2 = await fetch(`${BASE_URL}/api/pastes/${pasteId}`);
  const data2 = await get2.json();
  console.log("   Status:", get2.status);
  console.log("   Views Remaining:", data2.remaining_views);

  // 5. Fetch Paste (View 3 - Should Fail)
  console.log("\n5. Fetching Paste (View 3/2 - Expect 404)...");
  const get3 = await fetch(`${BASE_URL}/api/pastes/${pasteId}`);
  console.log("   Status:", get3.status);
  if (get3.status === 404) console.log("   SUCCESS: Paste unavailable.");
  else console.error("   FAILED: Paste still available.");

  // 6. Test TTL with Time Travel
  console.log("\n6. Testing TTL (Time Travel)...");
  const ttlRes = await fetch(`${BASE_URL}/api/pastes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Time Travel", ttl_seconds: 60 }),
  });
  const ttlData = await ttlRes.json();
  const ttlId = ttlData.id;
  console.log("   Created TTL Paste:", ttlId);

  // Check immediately (Real time)
  const check1 = await fetch(`${BASE_URL}/api/pastes/${ttlId}`);
  console.log("   Immediate Check Status:", check1.status);

  // Check 2 minutes later (Fake time)
  const futureTime = Date.now() + 120000;
  console.log("   Checking in Future (+2 mins) using x-test-now-ms...");
  const check2 = await fetch(`${BASE_URL}/api/pastes/${ttlId}`, {
    headers: { "x-test-now-ms": futureTime.toString() },
  });
  console.log("   Future Status:", check2.status);
  if (check2.status === 404) console.log("   SUCCESS: Expired correctly.");
  else console.warn("   WARNING: Did not expire. Is TEST_MODE=1 enabled?");
}

runTests().catch(console.error);
