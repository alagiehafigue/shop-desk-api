import crypto from "crypto";

const DEFAULT_BASE_URL = "https://api.paystack.co";
const DEFAULT_CURRENCY = "GHS";

function getPaystackConfig() {
  return {
    baseUrl: (process.env.PAYSTACK_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    currency: (process.env.PAYSTACK_CURRENCY || DEFAULT_CURRENCY).toUpperCase(),
    secretKey: process.env.PAYSTACK_SECRET_KEY,
  };
}

function assertPaystackConfig() {
  const { secretKey } = getPaystackConfig();

  if (!secretKey) {
    throw new Error("Missing Paystack config: PAYSTACK_SECRET_KEY");
  }
}

async function paystackRequest(path, { method = "GET", body } = {}) {
  const { baseUrl, secretKey } = getPaystackConfig();

  assertPaystackConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.status === false) {
    throw new Error(payload?.message || "Paystack request failed");
  }

  return payload?.data;
}

function toSubunit(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Paystack amount must be greater than zero");
  }

  return Math.round(numericAmount * 100);
}

export function buildPaystackReference(saleId) {
  const saleFragment = saleId.replace(/-/g, "").slice(0, 12);
  const entropy = crypto.randomBytes(4).toString("hex");

  return `shopdesk-${saleFragment}-${Date.now()}-${entropy}`;
}

export function getPaystackCurrency() {
  return getPaystackConfig().currency;
}

export async function initializePaystackTransaction({
  amount,
  email,
  reference,
  channels,
  metadata,
}) {
  const currency = getPaystackCurrency();

  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: {
      amount: toSubunit(amount),
      channels,
      currency,
      email,
      metadata,
      reference,
    },
  });
}

export async function verifyPaystackTransaction(reference) {
  if (!reference) {
    throw new Error("Paystack reference is required");
  }

  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}
