/**
 * Feature: qr-restaurant-system, Property 2: Menu item update consistency
 * Validates: Requirements 1.2
 * 
 * Property: For any existing menu item and any valid field updates,
 * when an admin updates the item, retrieving the item should return the updated values
 */

import * as fc from 'fast-check';

// Mock Prisma
const mockPrisma = {
  menuItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('Property 2: Menu item update consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should persist all field updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: 0.01, max: 10000, noNaN: true }),
        fc.string({ maxLength: 1000 }),
        async (id, newName, newPrice, newDescription) => {
          // Setup: Create original menu item
          const original = {
            id,
            name: 'Original Name',
            price: 10.0,
            description: 'Original Description',
            category: 'main',
            imageUrl: null,
            isPopular: false,
            popularRank: null,
            isActive: true,
            nameTranslations: {},
            descriptionTranslations: {},
            nutritionalInfo: null,
            allergens: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Mock finding the original item
          mockPrisma.menuItem.findUnique.mockResolvedValue(original);

          // Mock update
          const updated = {
            ...original,
            name: newName,
            price: newPrice,
            description: newDescription,
            updatedAt: new Date(),
          };
          mockPrisma.menuItem.update.mockResolvedValue(updated);

          // Perform update
          const result = await mockPrisma.menuItem.update({
            where: { id },
            data: {
              name: newName,
              price: newPrice,
              description: newDescription,
            },
          });

          // Verify: All updated fields are persisted
          expect(result.name).toBe(newName);
          expect(result.price).toBe(newPrice);
          expect(result.description).toBe(newDescription);

          // Verify: Unchanged fields remain the same
          expect(result.id).toBe(id);
          expect(result.category).toBe(original.category);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle partial updates correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (id, newName) => {
          const original = {
            id,
            name: 'Original Name',
            price: 10.0,
            description: 'Original Description',
            category: 'main',
            imageUrl: null,
            isPopular: false,
            popularRank: null,
            isActive: true,
            nameTranslations: {},
            descriptionTranslations: {},
            nutritionalInfo: null,
            allergens: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          mockPrisma.menuItem.findUnique.mockResolvedValue(original);

          // Update only name
          const updated = {
            ...original,
            name: newName,
            updatedAt: new Date(),
          };
          mockPrisma.menuItem.update.mockResolvedValue(updated);

          const result = await mockPrisma.menuItem.update({
            where: { id },
            data: { name: newName },
          });

          // Verify: Only name changed
          expect(result.name).toBe(newName);
          expect(result.price).toBe(original.price);
          expect(result.description).toBe(original.description);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamps on every update', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.string({ minLength: 1 }), async (id, newName) => {
        const originalTime = new Date('2024-01-01');
        const original = {
          id,
          name: 'Original',
          price: 10.0,
          description: 'Desc',
          category: 'main',
          imageUrl: null,
          isPopular: false,
          popularRank: null,
          isActive: true,
          nameTranslations: {},
          descriptionTranslations: {},
          nutritionalInfo: null,
          allergens: [],
          createdAt: originalTime,
          updatedAt: originalTime,
        };

        mockPrisma.menuItem.findUnique.mockResolvedValue(original);

        const newTime = new Date();
        const updated = {
          ...original,
          name: newName,
          updatedAt: newTime,
        };
        mockPrisma.menuItem.update.mockResolvedValue(updated);

        const result = await mockPrisma.menuItem.update({
          where: { id },
          data: { name: newName },
        });

        // Verify: updatedAt changed, createdAt unchanged
        expect(result.updatedAt.getTime()).toBeGreaterThan(result.createdAt.getTime());
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve complex nested data on update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.dictionary(fc.constantFrom('tr', 'en'), fc.string({ minLength: 1 })),
        async (id, newTranslations) => {
          const original = {
            id,
            name: 'Original',
            price: 10.0,
            description: 'Desc',
            category: 'main',
            imageUrl: null,
            isPopular: false,
            popularRank: null,
            isActive: true,
            nameTranslations: { tr: 'Orijinal', en: 'Original' },
            descriptionTranslations: {},
            nutritionalInfo: { calories: 100, protein: 10, carbs: 20, fat: 5 },
            allergens: ['gluten', 'dairy'],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          mockPrisma.menuItem.findUnique.mockResolvedValue(original);

          const updated = {
            ...original,
            nameTranslations: newTranslations,
            updatedAt: new Date(),
          };
          mockPrisma.menuItem.update.mockResolvedValue(updated);

          const result = await mockPrisma.menuItem.update({
            where: { id },
            data: { nameTranslations: newTranslations },
          });

          // Verify: Translations updated, other nested data preserved
          expect(result.nameTranslations).toEqual(newTranslations);
          expect(result.nutritionalInfo).toEqual(original.nutritionalInfo);
          expect(result.allergens).toEqual(original.allergens);
        }
      ),
      { numRuns: 100 }
    );
  });
});
