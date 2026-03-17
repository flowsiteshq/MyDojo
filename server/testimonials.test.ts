import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAllTestimonials, getFeaturedTestimonials, createTestimonial } from "./db";
import { getDb } from "./db";
import { testimonials } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Testimonials API", () => {
  let testTestimonialId: number;

  beforeAll(async () => {
    // Clean up any test data
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM testimonials WHERE memberName LIKE 'Test%'");
    }
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM testimonials WHERE memberName LIKE 'Test%'");
    }
  });

  it("should create a new testimonial", async () => {
    const result = await createTestimonial({
      memberName: "Test User",
      memberPhoto: "https://example.com/photo.jpg",
      program: "Dragon Kids",
      rating: 5,
      title: "Test Testimonial",
      content: "This is a test testimonial content.",
      memberSince: "Member since 2024",
      featured: 0,
      isApproved: 0,
    });

    expect(result).toBeDefined();
    // The result might not have insertId in the expected format, so we'll query to get the ID
    const db = await getDb();
    if (db) {
      const [rows] = await db.execute("SELECT id FROM testimonials WHERE memberName = 'Test User' ORDER BY id DESC LIMIT 1");
      testTestimonialId = (rows as any)[0].id;
      expect(testTestimonialId).toBeGreaterThan(0);
    }
  });

  it("should get all testimonials", async () => {
    // First approve the test testimonial
    const db = await getDb();
    if (db) {
      await db
        .update(testimonials)
        .set({ isApproved: 1 })
        .where(eq(testimonials.id, testTestimonialId));
    }

    const allTestimonials = await getAllTestimonials();
    expect(Array.isArray(allTestimonials)).toBe(true);
    expect(allTestimonials.length).toBeGreaterThan(0);
    
    // All testimonials should be approved
    allTestimonials.forEach((t) => {
      expect(t.isApproved).toBe(1);
    });
  });

  it("should filter testimonials by program", async () => {
    const filteredTestimonials = await getAllTestimonials({ program: "Dragon Kids" });
    expect(Array.isArray(filteredTestimonials)).toBe(true);
    
    // All testimonials should be for Dragon Kids program
    filteredTestimonials.forEach((t) => {
      expect(t.program).toBe("Dragon Kids");
    });
  });

  it("should filter testimonials by minimum rating", async () => {
    const ratedTestimonials = await getAllTestimonials({ minRating: 5 });
    expect(Array.isArray(ratedTestimonials)).toBe(true);
    
    // All testimonials should have rating >= 5
    ratedTestimonials.forEach((t) => {
      expect(t.rating).toBeGreaterThanOrEqual(5);
    });
  });

  it("should filter testimonials by both program and rating", async () => {
    const combinedFilterTestimonials = await getAllTestimonials({
      program: "Dragon Kids",
      minRating: 5,
    });
    expect(Array.isArray(combinedFilterTestimonials)).toBe(true);
    
    // All testimonials should match both filters
    combinedFilterTestimonials.forEach((t) => {
      expect(t.program).toBe("Dragon Kids");
      expect(t.rating).toBeGreaterThanOrEqual(5);
    });
  });

  it("should get featured testimonials", async () => {
    // Mark test testimonial as featured
    const db = await getDb();
    if (db) {
      await db
        .update(testimonials)
        .set({ featured: 1 })
        .where(eq(testimonials.id, testTestimonialId));
    }

    const featuredTestimonials = await getFeaturedTestimonials(3);
    expect(Array.isArray(featuredTestimonials)).toBe(true);
    expect(featuredTestimonials.length).toBeLessThanOrEqual(3);
    
    // All testimonials should be featured and approved
    featuredTestimonials.forEach((t) => {
      expect(t.featured).toBe(1);
      expect(t.isApproved).toBe(1);
    });
  });

  it("should respect the limit parameter for featured testimonials", async () => {
    const limitedTestimonials = await getFeaturedTestimonials(2);
    expect(Array.isArray(limitedTestimonials)).toBe(true);
    expect(limitedTestimonials.length).toBeLessThanOrEqual(2);
  });

  it("should order testimonials by featured status and creation date", async () => {
    const orderedTestimonials = await getAllTestimonials();
    
    // Featured testimonials should come first
    let foundNonFeatured = false;
    for (const t of orderedTestimonials) {
      if (foundNonFeatured && t.featured === 1) {
        throw new Error("Featured testimonials should come before non-featured");
      }
      if (t.featured === 0) {
        foundNonFeatured = true;
      }
    }
  });
});
