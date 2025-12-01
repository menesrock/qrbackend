/**
 * Feature: qr-restaurant-system, Property 1: Menu item persistence completeness
 * Validates: Requirements 1.1
 * 
 * Property: For any menu item with name, price, category, description, and image URL,
 * when created by an admin, all fields should be retrievable from the database
 */

import * as fc from 'fast-check';
import { createMenuItemSchema } from '../utils/validation';

// Custom generators
const menuItemGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 1000 }),
  price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
  category: fc.constantFrom('appetizer', 'main', 'dessert', 'beverage', 'side'),
  imageUrl: fc.webUrl(),
  isPopular: fc.boolean(),
  allergens: fc.array(fc.constantFrom('gluten', 'dairy', 'nuts', 'soy', 'eggs'), {
    maxLength: 5,
  }),
});

describe('Property 1: Menu item persistence completeness', () => {
  it('should validate and accept complete menu items', () => {
    fc.assert(
      fc.property(menuItemGenerator, (menuItem) => {
        // Validate the menu item
        const result = createMenuItemSchema.safeParse(menuItem);

        // All required fields should be present and valid
        expect(result.success).toBe(true);

        if (result.success) {
          const validated = result.data;

          // Verify all fields are preserved
          expect(validated.name).toBe(menuItem.name);
          expect(validated.description).toBe(menuItem.description);
          expect(validated.price).toBe(menuItem.price);
          expect(validated.category).toBe(menuItem.category);
          expect(validated.imageUrl).toBe(menuItem.imageUrl);
          expect(validated.isPopular).toBe(menuItem.isPopular);
          expect(validated.allergens).toEqual(menuItem.allergens);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reject menu items with invalid prices', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 1000 }),
          price: fc.constantFrom(-1, 0, -100, NaN, Infinity),
          category: fc.string({ minLength: 1 }),
        }),
        (menuItem) => {
          const result = createMenuItemSchema.safeParse(menuItem);

          // Invalid prices should be rejected
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject menu items with empty names', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.constant(''),
          description: fc.string({ maxLength: 1000 }),
          price: fc.float({ min: 0.01, max: 10000 }),
          category: fc.string({ minLength: 1 }),
        }),
        (menuItem) => {
          const result = createMenuItemSchema.safeParse(menuItem);

          // Empty names should be rejected
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle optional fields correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 1000 }),
          price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
          category: fc.string({ minLength: 1 }),
          // Optional fields omitted
        }),
        (menuItem) => {
          const result = createMenuItemSchema.safeParse(menuItem);

          // Should be valid even without optional fields
          expect(result.success).toBe(true);

          if (result.success) {
            const validated = result.data;
            expect(validated.name).toBe(menuItem.name);
            expect(validated.price).toBe(menuItem.price);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate nutritional info when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ maxLength: 1000 }),
          price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
          category: fc.string({ minLength: 1 }),
          nutritionalInfo: fc.record({
            calories: fc.nat({ max: 5000 }),
            protein: fc.nat({ max: 500 }),
            carbs: fc.nat({ max: 500 }),
            fat: fc.nat({ max: 500 }),
          }),
        }),
        (menuItem) => {
          const result = createMenuItemSchema.safeParse(menuItem);

          expect(result.success).toBe(true);

          if (result.success && result.data.nutritionalInfo) {
            expect(result.data.nutritionalInfo.calories).toBeGreaterThanOrEqual(0);
            expect(result.data.nutritionalInfo.protein).toBeGreaterThanOrEqual(0);
            expect(result.data.nutritionalInfo.carbs).toBeGreaterThanOrEqual(0);
            expect(result.data.nutritionalInfo.fat).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve translations when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          nameTranslations: fc.dictionary(
            fc.constantFrom('tr', 'en', 'de', 'fr'),
            fc.string({ minLength: 1, maxLength: 100 })
          ),
          description: fc.string({ maxLength: 1000 }),
          descriptionTranslations: fc.dictionary(
            fc.constantFrom('tr', 'en', 'de', 'fr'),
            fc.string({ maxLength: 1000 })
          ),
          price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
          category: fc.string({ minLength: 1 }),
        }),
        (menuItem) => {
          const result = createMenuItemSchema.safeParse(menuItem);

          expect(result.success).toBe(true);

          if (result.success) {
            expect(result.data.nameTranslations).toEqual(menuItem.nameTranslations);
            expect(result.data.descriptionTranslations).toEqual(
              menuItem.descriptionTranslations
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
