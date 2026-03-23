import crypto from "crypto";

const DEFAULT_BASE_URL = "https://sandbox.momodeveloper.mtn.com";
const DEFAULT_TARGET_ENV = "sandbox";
const DEFAULT_CURRENCY = "EUR";
const DEFAULT_POLL_ATTEMPTS = 8;
const DEFAULT_POLL_INTERVAL_MS = 2500;

function getConfig() {
  return {
    apiKey: process.env.MTN_MOMO_API_KEY,
    apiUser: process.env.MTN_MOMO_API_USER,
    baseUrl: process.env.MTN_MOMO_BASE_URL || DEFAULT_BASE_URL,
    callbackUrl: process.env.MTN_MOMO_CALLBACK_URL,
    currency: process.env.MTN_MOMO_CURRENCY || DEFAULT_CURRENCY,
    primaryKey: process.env.MTN_MOMO_COLLECTION_PRIMARY_KEY,
    targetEnvironment: process.env.MTN_MOMO_TARGET_ENV || DEFAULT_TARGET_ENV,
  };
}

function validateConfig(config) {
  const missing = [];

  if (!config.primaryKey) missing.push("MTN_MOMO_COLLECTION_PRIMARY_KEY");
  if (!config.apiUser) missing.push("MTN_MOMO_API_USER");
  if (!config.apiKey) missing.push("MTN_MOMO_API_KEY");

  if (missing.length) {
    throw new Error(
      `Missing MTN MoMo sandbox config: ${missing.join(", ")}`,
    );
  }
}

function buildBasicAuth(apiUser, apiKey) {
  return `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString("base64")}`;
}

async function parseJsonSafely(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function getAccessToken(config) {
  const response = await fetch(`${config.baseUrl}/collection/token/`, {
    headers: {
      Authorization: buildBasicAuth(config.apiUser, config.apiKey),
      "Ocp-Apim-Subscription-Key": config.primaryKey,
    },
    method: "POST",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.message ||
        data.error_description ||
        "Unable to obtain MTN MoMo access token",
    );
  }

  return data.access_token;
}

async function createRequestToPay({
  accessToken,
  amount,
  config,
  payerPhone,
  saleId,
}) {
  const referenceId = crypto.randomUUID();
  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
    body: JSON.stringify({
      amount: Number(amount).toFixed(2),
      currency: config.currency,
      externalId: saleId,
      payer: {
        partyIdType: "MSISDN",
        partyId: payerPhone,
      },
      payerMessage: "ShopDesk Mobile Money payment",
      payeeNote: `Sale ${saleId}`,
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": config.primaryKey,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": config.targetEnvironment,
      ...(config.callbackUrl ? { "X-Callback-Url": config.callbackUrl } : {}),
    },
    method: "POST",
  });

  const data = await parseJsonSafely(response);

  if (response.status !== 202) {
    throw new Error(
      data.message ||
        data.reason ||
        data.error_description ||
        "MTN MoMo request to pay failed",
    );
  }

  return referenceId;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getRequestStatus({ accessToken, config, referenceId }) {
  const response = await fetch(
    `${config.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Ocp-Apim-Subscription-Key": config.primaryKey,
        "X-Target-Environment": config.targetEnvironment,
      },
      method: "GET",
    },
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.reason ||
        data.error_description ||
        "Unable to fetch MTN MoMo payment status",
    );
  }

  return data;
}

export async function simulateMtnMomoCollection({
  amount,
  payerPhone,
  saleId,
}) {
  const config = getConfig();
  validateConfig(config);

  const accessToken = await getAccessToken(config);
  const referenceId = await createRequestToPay({
    accessToken,
    amount,
    config,
    payerPhone,
    saleId,
  });

  const maxAttempts = Number(
    process.env.MTN_MOMO_STATUS_POLL_ATTEMPTS || DEFAULT_POLL_ATTEMPTS,
  );
  const pollInterval = Number(
    process.env.MTN_MOMO_STATUS_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS,
  );

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await getRequestStatus({
      accessToken,
      config,
      referenceId,
    });

    if (status.status === "SUCCESSFUL") {
      return {
        currency: config.currency,
        referenceId,
        status,
      };
    }

    if (status.status === "FAILED" || status.status === "REJECTED") {
      throw new Error(
        status.reason || "MTN MoMo payment was rejected in sandbox",
      );
    }

    await wait(pollInterval);
  }

  throw new Error(
    "MTN MoMo payment is still pending. Confirm the sandbox request and try again.",
  );
}
