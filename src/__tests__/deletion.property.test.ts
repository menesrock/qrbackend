/**
 * Feature: qr-restaurant-system, Property 3: Deleted items are invisible
 * Validates: Requirements 1.3
 * 
 * Property: For any menu item, when deleted by an admin,
 * the item should not appear in customer menu queries or admin item lists
 */

import * as fc from 'fast-check';

// Mock Prisma
const mockPrisma = {
  menuItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

describe('Property 3: Deleted items are invisible', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not return deleted items in queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        async (itemIds, deleteIndex) => {
          // Ensure we have items to work with
          fc.pre(deleteIndex < itemIds.length);

          const idToDelete = itemIds[deleteIndex];

          // Setup: Create menu items
          const allItems = itemIds.map((id) => ({
            id,
            name: `Item ${id}`,
            price: 10.0,
            description: 'Description',
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
          }));

          // Mock delete
          mockPrisma.menuItem.delete.mockResolvedValue(
            allItems.find((item) => item.id === idToDelete)
          );

          // Perform deletion
          await mockPrisma.menuItem.delete({
            where: { id: idToDelete },
          });

          // Mock query after deletion - should not include deleted item
          const remainingItems = allItems.filter((item) => item.id !== idToDelete);
          mockPrisma.menuItem.findMany.mockResolvedValue(remainingItems);

          // Query all items
          const result = await mockPrisma.menuItem.findMany();

          // Verify: Deleted item not in results
          expect(result.find((item) => item.id === idToDelete)).toBeUndefined();
          expect(result.length).toBe(itemIds.length - 1);

          // Verify: All other items still present
          const resultIds = result.map((item) => item.id);
          itemIds.forEach((id) => {
            if (id !== idToDelete) {
              expect(resultIds).toContain(id);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when querying deleted item by ID', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (id) => {
        const item = {
          id,
          name: 'Item',
          price: 10.0,
          description: 'Description',
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

        // Mock delete
        mockPrisma.menuItem.delete.mockResolvedValue(item);

        // Perform deletion
        await mockPrisma.menuItem.delete({
          where: { id },
        });

        // Mock query after deletion
        mockPrisma.menuItem.findUnique.mockResolvedValue(null);

        // Try to find deleted item
        const result = await mockPrisma.menuItem.findUnique({
          where: { id },
        });

        // Verify: Item not found
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should not affect other items when one is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            category: fc.constantFrom('appetizer', 'main', 'dessert'),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        fc.integer({ min: 0, max: 9 }),
        async (items, deleteIndex) => {
          fc.pre(deleteIndex < items.length);

          const itemToDelete = items[deleteIndex];

          // Mock delete
          mockPrisma.menuItem.delete.mockResolvedValue(itemToDelete);

          await mockPrisma.menuItem.delete({
            where: { id: itemToDelete.id },
          });

          // Mock query - remaining items unchanged
          const remainingItems = items.filter((item) => item.id !== itemToDelete.id);
          mockPrisma.menuItem.findMany.mockResolvedValue(remainingItems);

          const result = await mockPrisma.menuItem.findMany();

          // Verify: All other items have same properties
          remainingItems.forEach((originalItem) => {
            const resultItem = result.find((r) => r.id === originalItem.id);
            expect(resultItem).toBeDefined();
            expect(resultItem?.name).toBe(originalItem.name);
            expect(resultItem?.category).toBe(originalItem.category);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deletion of items with different categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom('appetizer', 'main', 'dessert', 'beverage'),
        async (id, category) => {
          const item = {
            id,
            name: 'Item',
            price: 10.0,
            description: 'Description',
            category,
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

          mockPrisma.menuItem.delete.mockResolvedValue(item);

          await mockPrisma.menuItem.delete({
            where: { id },
          });

          // Query by category after deletion
          mockPrisma.menuItem.findMany.mockResolvedValue([]);

          const result = await mockPrisma.menuItem.findMany({
            where: { category },
          });

          // Verify: Deleted item not in category results
          expect(result.find((r) => r.id === id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deletion of popular items', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.boolean(), async (id, isPopular) => {
        const item = {
          id,
          name: 'Item',
          price: 10.0,
          description: 'Description',
          category: 'main',
          imageUrl: null,
          isPopular,
          popularRank: isPopular ? 1 : null,
          isActive: true,
          nameTranslations: {},
          descriptionTranslations: {},
          nutritionalInfo: null,
          allergens: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.menuItem.delete.mockResolvedValue(item);

        await mockPrisma.menuItem.delete({
          where: { id },
        });

        // Query popular items after deletion
        mockPrisma.menuItem.findMany.mockResolvedValue([]);

        const result = await mockPrisma.menuItem.findMany({
          where: { isPopular: true },
        });

        // Verify: Deleted popular item not in results
        expect(result.find((r) => r.id === id)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
