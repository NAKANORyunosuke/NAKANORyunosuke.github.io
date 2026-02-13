import { createSign } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const CONFIG_PATH = "_config.yml";
const OUTPUT_PATH = "_data/ga_counter.json";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ANALYTICS_DATA_API_BASE =
    "https://analyticsdata.googleapis.com/v1beta";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const ALL_TIME_START_DATE = "2015-08-14";
const FIXED_GA4_PROPERTY_ID = "492231658";

function base64UrlEncode(input) {
    const raw = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return raw
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function parseConfigGoogleAnalyticsId(configText) {
    const match = configText.match(
        /^\s*google_analytics:\s*["']?([^"'#\r\n]+)["']?/m,
    );
    return match ? match[1].trim() : "";
}

function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}

function createJwtAssertion({ clientEmail, privateKey }) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 3600;

    const header = {
        alg: "RS256",
        typ: "JWT",
    };

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
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(
            `Failed to fetch Google OAuth token (${response.status}): ${detail}`,
        );
    }

    const payload = await response.json();
    if (!payload.access_token) {
        throw new Error("OAuth response does not contain access_token.");
    }
    return payload.access_token;
}

async function fetchGaCounter({ propertyId, accessToken }) {
    const endpoint = `${GOOGLE_ANALYTICS_DATA_API_BASE}/properties/${encodeURIComponent(propertyId)}:runReport`;
    const body = {
        // GA4 Data API has no "all-time" keyword. Use an early fixed start date.
        dateRanges: [{ startDate: ALL_TIME_START_DATE, endDate: "today" }],
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

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(
            `Failed to fetch GA4 report (${response.status}): ${detail}`,
        );
    }

    const payload = await response.json();
    const metricValues = payload?.rows?.[0]?.metricValues;
    if (!Array.isArray(metricValues) || metricValues.length < 2) {
        throw new Error(
            "Unexpected GA4 report response: metric values are missing.",
        );
    }

    const pageViews = Number(metricValues[0]?.value ?? 0);
    const users = Number(metricValues[1]?.value ?? 0);

    if (!Number.isFinite(pageViews) || !Number.isFinite(users)) {
        throw new Error(
            "Unexpected GA4 report response: metric values are not numeric.",
        );
    }

    return { pageViews, users };
}

async function main() {
    const configText = await readFile(CONFIG_PATH, "utf8");
    const measurementId = parseConfigGoogleAnalyticsId(configText);
    const propertyId = FIXED_GA4_PROPERTY_ID;
    const clientEmail = getRequiredEnv("GA4_SERVICE_ACCOUNT_EMAIL");
    const privateKey = getRequiredEnv("GA4_PRIVATE_KEY").replace(/\\n/g, "\n");

    const assertion = createJwtAssertion({ clientEmail, privateKey });
    const accessToken = await fetchAccessToken(assertion);
    const { pageViews, users } = await fetchGaCounter({
        propertyId,
        accessToken,
    });

    const payload = {
        measurement_id: measurementId,
        property_id: propertyId,
        period: "all_time",
        date_range_start: ALL_TIME_START_DATE,
        date_range_end: "today",
        page_views_total: pageViews,
        users_total: users,
        page_views_total_text: pageViews.toLocaleString("en-US"),
        users_total_text: users.toLocaleString("en-US"),
        // Legacy keys kept for backward compatibility in templates/scripts.
        page_views_30d: pageViews,
        users_30d: users,
        page_views_30d_text: pageViews.toLocaleString("en-US"),
        users_30d_text: users.toLocaleString("en-US"),
        updated_at: new Date().toISOString(),
    };

    await writeFile(
        OUTPUT_PATH,
        `${JSON.stringify(payload, null, 2)}\n`,
        "utf8",
    );
    console.log(
        `Updated ${OUTPUT_PATH}: PV=${payload.page_views_total_text}, Users=${payload.users_total_text}`,
    );
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
