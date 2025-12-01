import { Request, Response } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log('Upload request received');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const uploadDir = config.upload.uploadDir;
    const isSvg = file.mimetype === 'image/svg+xml';
    const isWebp = file.mimetype === 'image/webp';

    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'No buffer',
    });

    // Ensure upload directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const processedImages: Record<string, string> = {};
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    if (isSvg) {
      // For SVG files, just save the file (no resizing)
      const filename = `image-${uniqueSuffix}.svg`;
      const filepath = path.join(uploadDir, filename);
      
      // Save SVG buffer to file
      await fs.writeFile(filepath, file.buffer);
      
      // For SVG, all sizes point to the same file
      processedImages.thumbnail = `/uploads/${filename}`;
      processedImages.medium = `/uploads/${filename}`;
      processedImages.full = `/uploads/${filename}`;
    } else if (isWebp) {
      // For WEBP files, resize to 480x480px (square format)
      const filename = `image-${uniqueSuffix}.webp`;
      const filepath = path.join(uploadDir, filename);

      console.log('Processing WEBP file from buffer ->', filepath);
      
      await sharp(file.buffer)
        .resize(480, 480, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      processedImages.thumbnail = `/uploads/${filename}`;
      processedImages.medium = `/uploads/${filename}`;
      processedImages.full = `/uploads/${filename}`;
    } else {
      // For raster images (PNG, JPG, etc.), resize to 480x480px (square format)
      const filename = `image-${uniqueSuffix}.webp`;
      const filepath = path.join(uploadDir, filename);

      console.log('Processing raster image from buffer ->', filepath);
      
      await sharp(file.buffer)
        .resize(480, 480, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      processedImages.thumbnail = `/uploads/${filename}`;
      processedImages.medium = `/uploads/${filename}`;
      processedImages.full = `/uploads/${filename}`;
    }

    console.log('Upload successful:', processedImages);
    res.json({
      message: 'Image uploaded successfully',
      images: processedImages,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const uploadDir = config.upload.uploadDir;

    // Delete all sizes
    const sizes = ['thumbnail', 'medium', 'full'];
    const baseName = filename.replace(/-(thumbnail|medium|full)\.webp$/, '');

    for (const size of sizes) {
      const filepath = path.join(uploadDir, `${baseName}-${size}.webp`);
      try {
        await fs.unlink(filepath);
      } catch (err) {
        // File might not exist, continue
      }
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};
