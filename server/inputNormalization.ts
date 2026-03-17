/**
 * Input Normalization and Validation
 * 
 * Handles user input parsing, normalization, and validation for the chatbot.
 */

/**
 * Normalize text input: trim and lowercase
 */
export function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Check if user wants to skip email
 * Keywords: skip, no, not now, prefer not, none, n/a
 */
export function isEmailSkipIntent(text: string): boolean {
  const normalized = normalize(text);
  const skipKeywords = [
    "skip",
    "no",
    "not now",
    "prefer not",
    "none",
    "n/a",
    "na",
    "nope",
    "no thanks",
    "pass",
  ];

  return skipKeywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Parse and validate phone number
 * Strips non-digits and validates length
 */
export function parsePhone(input: string): { valid: boolean; phone: string | null; error: string | null } {
  // Strip all non-digit characters
  const digitsOnly = input.replace(/\D/g, "");

  // Validate length (10-11 digits)
  if (digitsOnly.length < 10) {
    return {
      valid: false,
      phone: null,
      error: "Phone number must be at least 10 digits",
    };
  }

  if (digitsOnly.length > 11) {
    return {
      valid: false,
      phone: null,
      error: "Phone number must be no more than 11 digits",
    };
  }

  // Format as (XXX) XXX-XXXX
  let formatted: string;
  if (digitsOnly.length === 10) {
    formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else {
    // 11 digits, assume first is country code
    formatted = `+${digitsOnly[0]} (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }

  return {
    valid: true,
    phone: formatted,
    error: null,
  };
}

/**
 * Parse and validate email address
 */
export function parseEmail(input: string): { valid: boolean; email: string | null; error: string | null } {
  const trimmed = input.trim();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      email: null,
      error: "Please enter a valid email address",
    };
  }

  return {
    valid: true,
    email: trimmed.toLowerCase(),
    error: null,
  };
}

/**
 * Parse and validate child age
 * Accepts: "8", "8 years old", "eight", etc.
 */
export function parseAge(input: string): { valid: boolean; age: number | null; error: string | null } {
  const normalized = normalize(input);

  // Try to extract number
  const numberMatch = normalized.match(/\d+/);
  if (numberMatch) {
    const age = parseInt(numberMatch[0], 10);

    if (age < 3 || age > 17) {
      return {
        valid: false,
        age: null,
        error: "Child age must be between 3 and 17 years old",
      };
    }

    return {
      valid: true,
      age,
      error: null,
    };
  }

  // Try to parse word numbers
  const wordNumbers: Record<string, number> = {
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
  };

  for (const [word, num] of Object.entries(wordNumbers)) {
    if (normalized.includes(word)) {
      return {
        valid: true,
        age: num,
        error: null,
      };
    }
  }

  return {
    valid: false,
    age: null,
    error: "Please enter a valid age (3-17)",
  };
}

/**
 * Parse class_for intent from user input
 * Returns: "self", "child", "other", or null
 */
export function parseClassFor(input: string): "self" | "child" | "other" | null {
  const normalized = normalize(input);

  // Self keywords — use word-boundary regex for short words like "me" to prevent
  // false positives (e.g. "someone" contains "me" but should map to "other")
  const selfKeywords = ["myself", "self", "i am", "i'm", "for me", "my own"];
  if (selfKeywords.some((keyword) => normalized.includes(keyword))) {
    return "self";
  }
  // "me" needs word-boundary check to avoid matching "someone", "time", etc.
  if (/\bme\b/.test(normalized)) {
    return "self";
  }

  // Adult family / friend keywords — check BEFORE child keywords to avoid false positives
  // e.g. "It's for my husband" should NOT match child flow
  const adultOtherKeywords = [
    "husband",
    "wife",
    "spouse",
    "partner",
    "boyfriend",
    "girlfriend",
    "fiance",
    "fiancee",
    "friend",
    "family",
    "someone else",
    "other",
    "relative",
    "brother",
    "sister",
    "coworker",
    "colleague",
  ];
  if (adultOtherKeywords.some((keyword) => normalized.includes(keyword))) {
    return "other";
  }

  // Child keywords — "for my" removed to prevent matching "for my husband/wife/etc."
  const childKeywords = [
    "child",
    "kid",
    "son",
    "daughter",
    "my boy",
    "my girl",
    "my kids",
    "my children",
    "my kid",
  ];
  if (childKeywords.some((keyword) => normalized.includes(keyword))) {
    return "child";
  }

  return null;
}

/**
 * Validate name input
 */
export function parseName(input: string): { valid: boolean; name: string | null; error: string | null } {
  const trimmed = input.trim();
  const normalized = normalize(input);

  if (trimmed.length < 2) {
    return {
      valid: false,
      name: null,
      error: "Please enter your full name",
    };
  }

  // Check if it's just numbers or special characters
  if (!/[a-zA-Z]/.test(trimmed)) {
    return {
      valid: false,
      name: null,
      error: "Please enter a valid name",
    };
  }

  // Extract name from common patterns like "My name is Vincent", "I'm Vincent", "This is Vincent"
  // IMPORTANT: Check these patterns BEFORE checking rejection keywords
  const namePatterns = [
    // "My name is Vincent but...", "I'm Vincent and...", "This is Vincent I want..."
    /(?:my name is|my name's|i'm|i am|this is|call me)\s+([a-z]+(?:\s+[a-z]+)?)(?:\s+(?:but|and|i would like|i'd like|i want|i just|to|for|\.|,|$))/i,
    // "Vincent but I want...", "Vincent and I'd like..."
    /^([a-z]+(?:\s+[a-z]+)?)\s+(?:but|and|i would like|i'd like|i want|i just)/i,
    // "I'm Vincent I just want..."
    /(?:i'm|i am)\s+([a-z]+(?:\s+[a-z]+)?)\s+i\s+(?:just|would|want)/i,
  ];

  for (const pattern of namePatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extractedName = match[1].trim();
      // Validate extracted name
      if (extractedName.length >= 2 && extractedName.split(/\s+/).length <= 4) {
        return {
          valid: true,
          name: extractedName,
          error: null,
        };
      }
    }
  }

  // Reject inputs that look like questions or requests (not names)
  const nonNameKeywords = [
    "i'd like",
    "i want",
    "enroll",
    "sign up",
    "book",
    "schedule",
    "class",
    "trial",
    "how much",
    "what time",
    "when",
    "where",
    "can i",
    "could i",
    "would like",
  ];

  if (nonNameKeywords.some((keyword) => normalized.includes(keyword))) {
    return {
      valid: false,
      name: null,
      error: "I appreciate your interest! But first, what's your name?",
    };
  }

  // Reject if input is too long (likely a sentence, not a name)
  if (trimmed.split(/\s+/).length > 4) {
    return {
      valid: false,
      name: null,
      error: "Please enter just your name (first and last name)",
    };
  }

  return {
    valid: true,
    name: trimmed,
    error: null,
  };
}

/**
 * Parse child's name from user input
 * Accepts simple names (first name only or first + last)
 */
export function parseChildName(input: string): { valid: boolean; name: string | null; error: string | null } {
  const trimmed = input.trim();
  
  // Reject empty input
  if (!trimmed) {
    return {
      valid: false,
      name: null,
      error: "Please enter your child's name",
    };
  }
  
  // Reject if it looks like a rejection/skip intent
  const rejectKeywords = ["skip", "no", "not now", "prefer not", "none", "n/a", "na", "nope", "pass"];
  const normalized = normalize(trimmed);
  if (rejectKeywords.some(keyword => normalized === keyword || normalized.includes(keyword))) {
    return {
      valid: false,
      name: null,
      error: "Please enter your child's name",
    };
  }
  
  // Accept names with 1-3 words (e.g., "Tommy", "Tommy Smith", "Mary Jane Smith")
  const words = trimmed.split(/\s+/);
  if (words.length > 3) {
    return {
      valid: false,
      name: null,
      error: "Please enter just your child's first name or full name",
    };
  }
  
  // Capitalize each word
  const capitalizedName = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return {
    valid: true,
    name: capitalizedName,
    error: null,
  };
}
