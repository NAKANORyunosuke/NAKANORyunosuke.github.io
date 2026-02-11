import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

const CONFIG_PATH = "_config.yml";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ANALYTICS_DATA_API_BASE =
    "https://analyticsdata.googleapis.com/v1beta";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

function parseConfigGoogleAnalyticsId(configText) {
    const match = configText.match(
        /^\s*google_analytics:\s*["']?([^"'#\r\n]+)["']?/m,
    );
    return match ? match[1].trim() : "";
}

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith("--")) continue;
        const key = token.slice(2);
        const next = argv[i + 1];
        if (!next || next.startsWith("--")) {
            args[key] = "true";
            continue;
        }
        args[key] = next;
        i += 1;
    }
    return args;
}

function base64UrlEncode(input) {
    const raw = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return raw
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function createJwtAssertion({ clientEmail, privateKey }) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 3600;

    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: clientEmail,
        scope: ANALYTICS_SCOPE,
        aud: GOOGLE_OAUTH_TOKEN_URL,
        exp: expiresAt,
        iat: issuedAt,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const signer = createSign("RSA-SHA256");
    signer.update(unsignedToken);
    signer.end();
    const signature = signer.sign(privateKey);
    return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

async function fetchAccessToken(assertion) {
    const body = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
    });

    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, payload };
}

async function fetchGaReport({ propertyId, accessToken }) {
    const endpoint = `${GOOGLE_ANALYTICS_DATA_API_BASE}/properties/${encodeURIComponent(propertyId)}:runReport`;
    const body = {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, payload };
}

function extractErrorReason(payload) {
    const details = payload?.error?.details;
    if (!Array.isArray(details)) return null;
    for (const item of details) {
        if (item?.reason) return item.reason;
    }
    return null;
}

function printFailureHints({ status, payload }) {
    const message = payload?.error?.message || "Unknown API error";
    const reason = extractErrorReason(payload);
    const activationUrl = payload?.error?.details?.find(
        (d) => d?.metadata?.activationUrl,
    )?.metadata?.activationUrl;

    console.error(`GA4 API check failed (${status}): ${message}`);
    if (reason) {
        console.error(`Reason: ${reason}`);
    }

    if (reason === "SERVICE_DISABLED") {
        console.error(
            "Next action: Enable Google Analytics Data API in your GCP project.",
        );
        if (activationUrl) {
            console.error(`Activation URL: ${activationUrl}`);
        }
        return;
    }

    if (status === 403) {
        console.error(
            "Next action: Add the service account email to GA4 property access (Viewer or Analyst).",
        );
        return;
    }

    if (status === 404) {
        console.error(
            "Next action: Verify GA4_PROPERTY_ID (numeric) and property existence.",
        );
        return;
    }

    if (status === 401) {
        console.error(
            "Next action: Check service account key and JWT auth settings.",
        );
        return;
    }
}

async function loadCredentials(args) {
    const keyFile =
        args["key-file"] || process.env.GA4_SERVICE_ACCOUNT_KEY_FILE || "";
    if (keyFile) {
        const raw = await readFile(keyFile, "utf8");
        const json = JSON.parse(raw);
        if (!json.client_email || !json.private_key) {
            throw new Error(
                `Service account JSON is missing client_email/private_key: ${keyFile}`,
            );
        }
        return {
            clientEmail: json.client_email,
            privateKey: String(json.private_key).replace(/\\n/g, "\n"),
            source: `key-file:${keyFile}`,
        };
    }

    const envEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
    const envKey = process.env.GA4_PRIVATE_KEY;
    if (envEmail && envKey) {
        return {
            clientEmail: envEmail.trim(),
            privateKey: envKey.replace(/\\n/g, "\n"),
            source: "env",
        };
    }

    throw new Error(
        "Missing credentials. Set --key-file <path> or GA4_SERVICE_ACCOUNT_EMAIL + GA4_PRIVATE_KEY.",
    );
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const configText = await readFile(CONFIG_PATH, "utf8");
    const measurementId = parseConfigGoogleAnalyticsId(configText);
    const propertyId = (
        args["property-id"] ||
        process.env.GA4_PROPERTY_ID ||
        ""
    ).trim();

    if (!propertyId) {
        throw new Error(
            "Missing GA4 property id. Set --property-id <id> or GA4_PROPERTY_ID.",
        );
    }

    const creds = await loadCredentials(args);

    console.log("=== GA Counter Check ===");
    console.log(`Measurement ID (_config.yml): ${measurementId || "(empty)"}`);
    console.log(`Property ID: ${propertyId}`);
    console.log(`Credential source: ${creds.source}`);
    console.log(`Service account: ${creds.clientEmail}`);

    const assertion = createJwtAssertion({
        clientEmail: creds.clientEmail,
        privateKey: creds.privateKey,
    });

    const tokenResult = await fetchAccessToken(assertion);
    if (!tokenResult.ok || !tokenResult.payload?.access_token) {
        console.error(`OAuth token fetch failed (${tokenResult.status}).`);
        console.error(JSON.stringify(tokenResult.payload, null, 2));
        process.exit(1);
    }
    console.log("OAuth token: OK");

    const reportResult = await fetchGaReport({
        propertyId,
        accessToken: tokenResult.payload.access_token,
    });

    if (!reportResult.ok) {
        printFailureHints({
            status: reportResult.status,
            payload: reportResult.payload,
        });
        process.exit(1);
    }

    const metricValues = reportResult.payload?.rows?.[0]?.metricValues || [];
    const pageViews = Number(metricValues[0]?.value ?? 0);
    const users = Number(metricValues[1]?.value ?? 0);
    console.log("GA4 report: OK");
    console.log(`7d page views: ${pageViews.toLocaleString("en-US")}`);
    console.log(`7d users: ${users.toLocaleString("en-US")}`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
