/**
 * All monetary values are stored as integers in paise (1 INR = 100 paise).
 * Display format: ₹X,XX,XXX.XX
 */

export function paise(rupees) {
  return Math.round(parseFloat(rupees) * 100);
}

export function rupees(p) {
  return p / 100;
}

export function formatINR(paiseAmount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paiseAmount / 100);
}

/** Round tax: half-up on 0.5 paise */
export function calculateTax(subtotalPaise, taxRatePct) {
  return Math.round(subtotalPaise * taxRatePct / 100);
}
