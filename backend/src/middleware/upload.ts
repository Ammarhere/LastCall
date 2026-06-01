import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE      = 10 * 1024 * 1024; // 10 MB

const memStorage = multer.memoryStorage();

const multerInstance = multer({
  storage:    memStorage,
  limits:     { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WEBP, PDF'));
    }
  },
});

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 * Images are auto-optimized (quality + format) for fast loading on mobile.
 */
async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
): Promise<string> {
  const isPDF    = file.mimetype === 'application/pdf';
  const publicId = `lastcall/${folder}/${uuidv4()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id:     publicId,
        resource_type: isPDF ? 'raw' : 'image',
        // Auto-optimize images for mobile — smaller files, faster loads in Pakistan
        ...(isPDF ? {} : {
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        }),
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
        resolve(result.secure_url);
      },
    );
    uploadStream.end(file.buffer);
  });
}

/**
 * Middleware factory: multer parses the multipart field,
 * then Cloudinary stores it and attaches the URL to req.file.location
 */
function buildUpload(folder: string, fieldName: string) {
  const multerMid = multerInstance.single(fieldName);

  return async (req: Request, res: Response, next: NextFunction) => {
    multerMid(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next();

      try {
        const url = await uploadToCloudinary(req.file, folder);
        (req.file as any).location = url;
        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
}

export const uploadBagPhoto     = buildUpload('bags', 'photo');
export const uploadPartnerLogo  = buildUpload('partners/logos', 'logo');
export const uploadPartnerCover = buildUpload('partners/covers', 'cover');
export const uploadDocument     = buildUpload('documents', 'document');
export const uploadAvatar       = buildUpload('avatars', 'avatar');
