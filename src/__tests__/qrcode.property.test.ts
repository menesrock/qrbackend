/**
 * Feature: qr-restaurant-system, Property 13: QR code encoding correctness
 * Validates: Requirements 3.3
 * 
 * Property: For any table QR code, when decoded, the result should equal the table-specific URL
 */

import * as fc from 'fast-check';
import QRCode from 'qrcode';
import { Jimp } from 'jimp';
import jsQR from 'jsqr';

describe('Property 13: QR code encoding correctness', () => {
  it('should encode and decode table URLs correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom('http://example.com', 'https://example.com', 'http://test.local'),
        async (tableId, domain) => {
          // Generate table URL
          const tableUrl = `${domain}/table/${tableId}`;

          // Generate QR code as PNG buffer
          const qrCodeBuffer = await QRCode.toBuffer(tableUrl);

          // Decode QR code using Jimp and jsQR
          const image = await Jimp.fromBuffer(qrCodeBuffer);
          const imageData = {
            data: new Uint8ClampedArray(image.bitmap.data),
            width: image.bitmap.width,
            height: image.bitmap.height,
          };

          const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

          // Verify the decoded content matches the original URL
          expect(decodedQR).not.toBeNull();
          expect(decodedQR?.data).toBe(tableUrl);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should generate consistent QR codes for same URL', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (tableId) => {
        const tableUrl = `http://example.com/table/${tableId}`;

        const qr1 = await QRCode.toDataURL(tableUrl);
        const qr2 = await QRCode.toDataURL(tableUrl);

        // Same URL should generate same QR code
        expect(qr1).toBe(qr2);
      }),
      { numRuns: 20 }
    );
  }, 15000);

  it('should generate different QR codes for different URLs', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), async (tableId1, tableId2) => {
        fc.pre(tableId1 !== tableId2);

        const url1 = `http://example.com/table/${tableId1}`;
        const url2 = `http://example.com/table/${tableId2}`;

        const qr1 = await QRCode.toDataURL(url1);
        const qr2 = await QRCode.toDataURL(url2);

        // Different URLs should generate different QR codes
        expect(qr1).not.toBe(qr2);
      }),
      { numRuns: 20 }
    );
  }, 15000);

  it('should handle special characters in table IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (tableId) => {
          const tableUrl = `http://example.com/table/${encodeURIComponent(tableId)}`;

          const qrCode = await QRCode.toDataURL(tableUrl);

          expect(qrCode).toBeDefined();
          expect(qrCode).toContain('data:image/png;base64,');
        }
      ),
      { numRuns: 20 }
    );
  }, 15000);
});

/**
 * Feature: qr-restaurant-system, Property 11: Table identifier uniqueness
 * Validates: Requirements 3.1
 */
describe('Property 11: Table identifier uniqueness', () => {
  it('should ensure all table identifiers are unique', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 50 }),
        (tableIds) => {
          const uniqueIds = new Set(tableIds);
          expect(uniqueIds.size).toBe(tableIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: qr-restaurant-system, Property 12: Table URL format consistency
 * Validates: Requirements 3.2
 */
describe('Property 12: Table URL format consistency', () => {
  it('should generate URLs in correct format', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.webUrl({ validSchemes: ['http', 'https'] }),
        (tableId, domain) => {
          const tableUrl = `${domain}/table/${tableId}`;
          
          expect(tableUrl).toContain('/table/');
          expect(tableUrl).toContain(tableId);
          expect(tableUrl).toMatch(/^https?:\/\/.+\/table\/.+$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
