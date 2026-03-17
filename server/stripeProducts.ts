/**
 * Stripe Products and Prices Configuration
 * Defines membership packages for MyDojo Martial Arts
 */

export interface MembershipProduct {
  id: number;
  name: string;
  monthlyPrice: number; // in dollars
  registrationFee: number;
  downPayment: number;
  description: string;
  benefits: string[];
  invitationOnly: boolean;
}

/**
 * Membership packages with month-to-month billing
 * All packages require 60-day cancellation notice
 */
export const MEMBERSHIP_PRODUCTS: MembershipProduct[] = [
  {
    id: 1,
    name: "Foundation",
    monthlyPrice: 149.00,
    registrationFee: 99.00,
    downPayment: 248.00, // monthlyPrice ($149) + enrollmentFee ($99)
    description: "Month-to-month program for beginners. Cancel with 60-day notice.",
    benefits: [
      "1 White Traditional Karate Gi",
      "2x 30min Martial Arts Classes Weekly",
      "$49 Certification Fee",
      "Access to Basic Curriculum",
      "Progression Tracking"
    ],
    invitationOnly: false
  },
  {
    id: 2,
    name: "Black Belt",
    monthlyPrice: 199.00,
    registrationFee: 99.00,
    downPayment: 298.00, // monthlyPrice ($199) + enrollmentFee ($99)
    description: "Month-to-month comprehensive program. Cancel with 60-day notice.",
    benefits: [
      "1 Traditional Red Karate Gi",
      "3x 60min Martial Arts Classes Weekly",
      "$49 Certification Fee",
      "Access to Advance Curriculum",
      "Community Events",
      "Guest Seminars"
    ],
    invitationOnly: false
  },
  {
    id: 3,
    name: "Leadership",
    monthlyPrice: 249.00,
    registrationFee: 99.00,
    downPayment: 348.00, // monthlyPrice ($249) + enrollmentFee ($99)
    description: "Month-to-month elite program (invitation only). Cancel with 60-day notice.",
    benefits: [
      "1 Traditional Black Karate Gi",
      "Unlimited Classes Weekly",
      "$49 Certification Fee",
      "Community Events",
      "Guest Seminars",
      "Competition Support",
      "Leadership Classes & Seminars",
      "Access to exclusive Leadership Curriculum"
    ],
    invitationOnly: true
  }
];

/**
 * Get membership product by ID
 */
export function getMembershipProduct(id: number): MembershipProduct | undefined {
  return MEMBERSHIP_PRODUCTS.find(p => p.id === id);
}

/**
 * Get available membership products (non-invitation only)
 */
export function getAvailableMembershipProducts(): MembershipProduct[] {
  return MEMBERSHIP_PRODUCTS.filter(p => !p.invitationOnly);
}
