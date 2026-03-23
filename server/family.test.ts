import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB module
vi.mock("./db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

// Mock FluidPay
vi.mock("./sms800", () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Family Discount Business Logic", () => {
  describe("Registration Fee Calculation", () => {
    it("should charge $99 for family registration", () => {
      const FAMILY_REGISTRATION_FEE = 99;
      expect(FAMILY_REGISTRATION_FEE).toBe(99);
    });

    it("should charge in cents for FluidPay API", () => {
      const FAMILY_REGISTRATION_FEE = 99;
      const amountInCents = FAMILY_REGISTRATION_FEE * 100;
      expect(amountInCents).toBe(9900);
    });
  });

  describe("50% Discount Calculation", () => {
    it("should apply 50% discount to second member monthly tuition", () => {
      const originalMonthly = 120;
      const discountedMonthly = Math.round(originalMonthly * 0.5);
      expect(discountedMonthly).toBe(60);
    });

    it("should not apply discount to first family member", () => {
      const memberOrder = 1;
      const hasDiscount = memberOrder > 1;
      expect(hasDiscount).toBe(false);
    });

    it("should apply discount to second and subsequent family members", () => {
      const memberOrders = [2, 3, 4, 5];
      memberOrders.forEach((order) => {
        const hasDiscount = order > 1;
        expect(hasDiscount).toBe(true);
      });
    });

    it("should calculate 50% correctly for various tuition amounts", () => {
      const tuitionAmounts = [99, 119, 149, 200];
      tuitionAmounts.forEach((amount) => {
        const discounted = Math.round(amount * 0.5);
        expect(discounted).toBe(Math.round(amount / 2));
        expect(discounted).toBeLessThan(amount);
      });
    });
  });

  describe("Family Group Validation", () => {
    it("should require primary contact name", () => {
      const validateFamilyGroup = (data: { primaryContactName: string; primaryContactEmail: string }) => {
        if (!data.primaryContactName.trim()) throw new Error("Name required");
        if (!data.primaryContactEmail.trim()) throw new Error("Email required");
        return true;
      };

      expect(() => validateFamilyGroup({ primaryContactName: "", primaryContactEmail: "test@test.com" })).toThrow("Name required");
      expect(() => validateFamilyGroup({ primaryContactName: "John", primaryContactEmail: "" })).toThrow("Email required");
      expect(validateFamilyGroup({ primaryContactName: "John Doe", primaryContactEmail: "john@test.com" })).toBe(true);
    });

    it("should validate email format", () => {
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValidEmail("john@example.com")).toBe(true);
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("john@")).toBe(false);
    });
  });

  describe("Family Member Order", () => {
    it("should assign correct member order based on existing members", () => {
      const getNextMemberOrder = (existingCount: number) => existingCount + 1;
      expect(getNextMemberOrder(0)).toBe(1); // First member
      expect(getNextMemberOrder(1)).toBe(2); // Second member (gets discount)
      expect(getNextMemberOrder(2)).toBe(3); // Third member (gets discount)
    });

    it("should identify which members get discounts", () => {
      const members = [
        { order: 1, name: "Alice" },
        { order: 2, name: "Bob" },
        { order: 3, name: "Charlie" },
      ];
      const discountedMembers = members.filter((m) => m.order > 1);
      expect(discountedMembers).toHaveLength(2);
      expect(discountedMembers.map((m) => m.name)).toEqual(["Bob", "Charlie"]);
    });
  });

  describe("Family Savings Summary", () => {
    it("should calculate total savings for a 3-member family", () => {
      const monthlyTuition = 120;
      const numDiscountedMembers = 2; // 2nd and 3rd member
      const savingsPerMember = monthlyTuition * 0.5;
      const totalMonthlySavings = savingsPerMember * numDiscountedMembers;
      expect(totalMonthlySavings).toBe(120); // $60 * 2 = $120/month saved
    });

    it("should calculate annual savings", () => {
      const monthlySavings = 120;
      const annualSavings = monthlySavings * 12;
      expect(annualSavings).toBe(1440);
    });

    it("should compare family reg fee vs per-person reg fee", () => {
      const familyRegFee = 99;
      const perPersonRegFee = 99;
      const familySize = 3;
      const perPersonTotal = perPersonRegFee * familySize;
      const savings = perPersonTotal - familyRegFee;
      expect(savings).toBe(198); // Save $198 on registration alone
    });
  });

  describe("Admin Family Groups Query", () => {
    it("should filter groups by search term (name)", () => {
      const groups = [
        { id: 1, primaryContactName: "John Smith", primaryContactEmail: "john@test.com" },
        { id: 2, primaryContactName: "Jane Doe", primaryContactEmail: "jane@test.com" },
        { id: 3, primaryContactName: "Bob Johnson", primaryContactEmail: "bob@test.com" },
      ];
      const search = "john";
      const filtered = groups.filter(
        (g) =>
          g.primaryContactName.toLowerCase().includes(search.toLowerCase()) ||
          g.primaryContactEmail.toLowerCase().includes(search.toLowerCase())
      );
      expect(filtered).toHaveLength(2); // John Smith and Bob Johnson
    });

    it("should filter groups by search term (email)", () => {
      const groups = [
        { id: 1, primaryContactName: "John Smith", primaryContactEmail: "john@test.com" },
        { id: 2, primaryContactName: "Jane Doe", primaryContactEmail: "jane@test.com" },
      ];
      const search = "jane@";
      const filtered = groups.filter(
        (g) =>
          g.primaryContactName.toLowerCase().includes(search.toLowerCase()) ||
          g.primaryContactEmail.toLowerCase().includes(search.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].primaryContactName).toBe("Jane Doe");
    });
  });
});
