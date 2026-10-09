/**
 * Verhoeff Algorithm for Aadhaar Number Checksum Validation
 * Official UIDAI mathematical checksum specification.
 */

// Multiplication table (d)
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// Permutation table (p)
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

// Inverse table (inv)
const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a 12-digit Aadhaar number using the Verhoeff algorithm.
 * @param {string} aadhaarNumber - The 12-digit Aadhaar string.
 * @returns {boolean} - True if valid format and checksum matches.
 */
export const validateVerhoeff = (aadhaarNumber) => {
  if (!aadhaarNumber || typeof aadhaarNumber !== 'string') {
    return false;
  }

  const clean = aadhaarNumber.replace(/[\s-]/g, '');

  // Must be exactly 12 numerical digits
  if (!/^\d{12}$/.test(clean)) {
    return false;
  }

  // Aadhaar numbers do NOT start with 0 or 1
  if (clean[0] === '0' || clean[0] === '1') {
    return false;
  }

  // Calculate Verhoeff checksum
  let c = 0;
  const digits = clean.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }

  return c === 0;
};

/**
 * Formats 12-digit Aadhaar into spaced blocks: "XXXX XXXX XXXX"
 */
export const formatAadhaarNumber = (value) => {
  const clean = (value || '').replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(' ');
};

