type DecimalInput = number | string;

function powerOfTen(exponent: number) {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 100) {
    throw new Error("PayHere decimal precision is invalid.");
  }
  return BigInt(10) ** BigInt(exponent);
}

function parsePositiveDecimal(value: DecimalInput) {
  const text = typeof value === "number" ? value.toString() : value.trim();
  const match = /^\+?(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match || (typeof value === "number" && !Number.isFinite(value))) {
    throw new Error("PayHere amount and exchange rate must be positive numbers.");
  }

  const fraction = match[2] ?? "";
  const exponent = Number(match[3] ?? "0");
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) {
    throw new Error("PayHere decimal precision is invalid.");
  }

  let coefficient = BigInt(`${match[1]}${fraction}`);
  let scale = fraction.length - exponent;
  if (scale < 0) {
    coefficient *= powerOfTen(-scale);
    scale = 0;
  }
  if (coefficient <= BigInt(0)) {
    throw new Error("PayHere amount and exchange rate must be positive numbers.");
  }

  return { coefficient, scale };
}

export function calculateUaePayHereCharge(
  sourceAmount: DecimalInput,
  exchangeRate: DecimalInput,
) {
  const source = parsePositiveDecimal(sourceAmount);
  const rate = parsePositiveDecimal(exchangeRate);
  const product = source.coefficient * rate.coefficient;
  const divisor = powerOfTen(source.scale + rate.scale);
  const wholeAmount = product / divisor;
  const remainder = product % divisor;

  // Match PostgreSQL numeric round(..., 0), including exact half-LKR values.
  const roundedAmount =
    wholeAmount + (remainder * BigInt(2) >= divisor ? BigInt(1) : BigInt(0));
  if (roundedAmount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("PayHere amount exceeds the supported range.");
  }

  return Number(roundedAmount);
}

export function formatPayHereAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("PayHere amount must be a positive number.");
  }

  return amount.toFixed(2);
}
