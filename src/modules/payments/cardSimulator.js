import crypto from "crypto";

function normalizeLast4(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeAuthCode(value) {
  return String(value ?? "").trim().toUpperCase();
}

export async function simulateCardTerminalPayment({
  amount,
  authCode,
  cardHolderName,
  cardLast4,
  saleId,
}) {
  const normalizedLast4 = normalizeLast4(cardLast4);
  const normalizedAuthCode = normalizeAuthCode(authCode);
  const holderName = String(cardHolderName ?? "").trim();

  if (normalizedLast4.length !== 4) {
    throw new Error("Card payments require a valid last 4 digits value");
  }

  if (!holderName) {
    throw new Error("Card payments require a cardholder name");
  }

  if (normalizedAuthCode.length < 4) {
    throw new Error("Card payments require a terminal authorization code");
  }

  return {
    amount: Number(amount),
    approvalCode: normalizedAuthCode,
    cardHolderName: holderName,
    cardLast4: normalizedLast4,
    referenceId: `CARD-${saleId.slice(0, 8)}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`,
    terminalStatus: "APPROVED",
  };
}
