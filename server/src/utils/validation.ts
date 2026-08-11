/**
 * Enterprise Validation Rules and Helper functions for GSTIN, PAN, HSN, SAC, IFSC, Pincode and more.
 */

export const REGEX_PATTERNS = {
  // Indian GSTIN (15 characters: e.g. 22AAAAA0000A1Z5)
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,

  // Indian Permanent Account Number (PAN: 10 chars, e.g. ABCDE1234F)
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,

  // Indian Financial System Code (IFSC: 11 characters: e.g. HDFC0000123)
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,

  // HSN Code (4, 6 or 8 digit tariff classification numbers)
  HSN: /^[0-9]{4,8}$/,

  // SAC Code (Service accounting code: 6 digits starting with 99)
  SAC: /^99[0-9]{4}$/,

  // Phone: 10-digit mobile number optionally prefixed with country code
  PHONE: /^(?:\+91|91)?[6-9]\d{9}$/,

  // Email validation regex
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Indian postal pincode (6 digits)
  PINCODE: /^[1-9][0-9]{5}$/
};

export const validateGstNumber = (gst: string): boolean => {
  if (!gst) return false;
  return REGEX_PATTERNS.GSTIN.test(gst.toUpperCase());
};

export const validatePanNumber = (pan: string): boolean => {
  if (!pan) return false;
  return REGEX_PATTERNS.PAN.test(pan.toUpperCase());
};

export const validateIfscCode = (ifsc: string): boolean => {
  if (!ifsc) return false;
  return REGEX_PATTERNS.IFSC.test(ifsc.toUpperCase());
};

export const validateHsnCode = (hsn: string): boolean => {
  if (!hsn) return false;
  return REGEX_PATTERNS.HSN.test(hsn);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  return REGEX_PATTERNS.PHONE.test(phone.replace(/\s+/g, ''));
};

export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  return REGEX_PATTERNS.EMAIL.test(email);
};

export const validatePincode = (pin: string): boolean => {
  if (!pin) return false;
  return REGEX_PATTERNS.PINCODE.test(pin);
};

// Generic express middleware validation helper
export const checkValidBody = (schema: Record<string, (val: any) => boolean>) => {
  return (req: any, res: any, next: any) => {
    const errors: string[] = [];
    Object.keys(schema).forEach(field => {
      const val = req.body[field];
      if (val !== undefined && val !== null && val !== '') {
        const isValid = schema[field](val);
        if (!isValid) {
          errors.push(`Field '${field}' is invalid.`);
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    next();
  };
};
