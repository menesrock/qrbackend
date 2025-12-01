/**
 * Feature: qr-restaurant-system, Property 26: Feedback date filtering
 * Validates: Requirements 6.1
 * 
 * Property: For any feedback data and time period filter (daily, weekly, monthly),
 * only feedback within the specified period should be displayed
 */

import * as fc from 'fast-check';

interface FeedbackItem {
  id: string;
  createdAt: Date;
  ratings: {
    service: number;
    hygiene: number;
    product: number;
    overall: number;
  };
}

const filterFeedbackByDate = (
  feedback: FeedbackItem[],
  startDate: Date,
  endDate: Date
): FeedbackItem[] => {
  return feedback.filter((item) => {
    const itemDate = new Date(item.createdAt);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

describe('Property 26: Feedback date filtering', () => {
  it('should only return feedback within date range', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            ratings: fc.record({
              service: fc.integer({ min: 1, max: 5 }),
              hygiene: fc.integer({ min: 1, max: 5 }),
              product: fc.integer({ min: 1, max: 5 }),
              overall: fc.integer({ min: 1, max: 5 }),
            }),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
        fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }),
        (feedbackList, startDate, endDate) => {
          fc.pre(startDate < endDate);

          const filtered = filterFeedbackByDate(feedbackList, startDate, endDate);

          // All filtered items should be within the date range
          filtered.forEach((item) => {
            const itemDate = new Date(item.createdAt);
            expect(itemDate >= startDate).toBe(true);
            expect(itemDate <= endDate).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no feedback in date range', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-03-31') }),
            ratings: fc.record({
              service: fc.integer({ min: 1, max: 5 }),
              hygiene: fc.integer({ min: 1, max: 5 }),
              product: fc.integer({ min: 1, max: 5 }),
              overall: fc.integer({ min: 1, max: 5 }),
            }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (feedbackList) => {
          const startDate = new Date('2024-06-01');
          const endDate = new Date('2024-06-30');

          const filtered = filterFeedbackByDate(feedbackList, startDate, endDate);

          expect(filtered.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle daily filter correctly', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }), (date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const feedbackList: FeedbackItem[] = [
          {
            id: '1',
            createdAt: new Date(date),
            ratings: { service: 5, hygiene: 5, product: 5, overall: 5 },
          },
          {
            id: '2',
            createdAt: new Date(date.getTime() - 86400000), // Previous day
            ratings: { service: 4, hygiene: 4, product: 4, overall: 4 },
          },
        ];

        const filtered = filterFeedbackByDate(feedbackList, dayStart, dayEnd);

        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe('1');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: qr-restaurant-system, Property 30: Average rating calculation
 * Validates: Requirements 6.5
 * 
 * Property: For any set of feedback entries, the displayed average for each category
 * should equal the mathematical average of all ratings in that category
 */

const calculateAverageRatings = (feedback: FeedbackItem[]) => {
  if (feedback.length === 0) {
    return { service: 0, hygiene: 0, product: 0, overall: 0 };
  }

  const totals = feedback.reduce(
    (acc, item) => ({
      service: acc.service + item.ratings.service,
      hygiene: acc.hygiene + item.ratings.hygiene,
      product: acc.product + item.ratings.product,
      overall: acc.overall + item.ratings.overall,
    }),
    { service: 0, hygiene: 0, product: 0, overall: 0 }
  );

  return {
    service: totals.service / feedback.length,
    hygiene: totals.hygiene / feedback.length,
    product: totals.product / feedback.length,
    overall: totals.overall / feedback.length,
  };
};

describe('Property 30: Average rating calculation', () => {
  it('should calculate correct average for each rating category', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            createdAt: fc.date(),
            ratings: fc.record({
              service: fc.integer({ min: 1, max: 5 }),
              hygiene: fc.integer({ min: 1, max: 5 }),
              product: fc.integer({ min: 1, max: 5 }),
              overall: fc.integer({ min: 1, max: 5 }),
            }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (feedbackList) => {
          const averages = calculateAverageRatings(feedbackList);

          // Calculate expected averages manually
          const expectedService =
            feedbackList.reduce((sum, item) => sum + item.ratings.service, 0) /
            feedbackList.length;
          const expectedHygiene =
            feedbackList.reduce((sum, item) => sum + item.ratings.hygiene, 0) /
            feedbackList.length;
          const expectedProduct =
            feedbackList.reduce((sum, item) => sum + item.ratings.product, 0) /
            feedbackList.length;
          const expectedOverall =
            feedbackList.reduce((sum, item) => sum + item.ratings.overall, 0) /
            feedbackList.length;

          expect(averages.service).toBeCloseTo(expectedService, 5);
          expect(averages.hygiene).toBeCloseTo(expectedHygiene, 5);
          expect(averages.product).toBeCloseTo(expectedProduct, 5);
          expect(averages.overall).toBeCloseTo(expectedOverall, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero averages for empty feedback list', () => {
    const averages = calculateAverageRatings([]);

    expect(averages.service).toBe(0);
    expect(averages.hygiene).toBe(0);
    expect(averages.product).toBe(0);
    expect(averages.overall).toBe(0);
  });

  it('should handle single feedback item correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          service: fc.integer({ min: 1, max: 5 }),
          hygiene: fc.integer({ min: 1, max: 5 }),
          product: fc.integer({ min: 1, max: 5 }),
          overall: fc.integer({ min: 1, max: 5 }),
        }),
        (ratings) => {
          const feedbackList: FeedbackItem[] = [
            {
              id: '1',
              createdAt: new Date(),
              ratings,
            },
          ];

          const averages = calculateAverageRatings(feedbackList);

          expect(averages.service).toBe(ratings.service);
          expect(averages.hygiene).toBe(ratings.hygiene);
          expect(averages.product).toBe(ratings.product);
          expect(averages.overall).toBe(ratings.overall);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain average within valid range (1-5)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            createdAt: fc.date(),
            ratings: fc.record({
              service: fc.integer({ min: 1, max: 5 }),
              hygiene: fc.integer({ min: 1, max: 5 }),
              product: fc.integer({ min: 1, max: 5 }),
              overall: fc.integer({ min: 1, max: 5 }),
            }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (feedbackList) => {
          const averages = calculateAverageRatings(feedbackList);

          expect(averages.service).toBeGreaterThanOrEqual(1);
          expect(averages.service).toBeLessThanOrEqual(5);
          expect(averages.hygiene).toBeGreaterThanOrEqual(1);
          expect(averages.hygiene).toBeLessThanOrEqual(5);
          expect(averages.product).toBeGreaterThanOrEqual(1);
          expect(averages.product).toBeLessThanOrEqual(5);
          expect(averages.overall).toBeGreaterThanOrEqual(1);
          expect(averages.overall).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
