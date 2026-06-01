import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { firebaseStorage, STORAGE_BUCKET } from '../config/firebase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE      = 10 * 1024 * 1024; // 10 MB

// Use memory storage — file goes into req.file.buffer, then we push to Firebase
const memStorage = multer.memoryStorage();

const multerInstance = multer({
  storage: memStorage,
  limits:  { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WEBP, PDF'));
    }
  },
});

/**
 * Upload a file buffer to Firebase Storage and return its public URL.
 * Files are stored under the given folder and made publicly readable.
 */
async function uploadToFirebase(
  file: Express.Multer.File,
  folder: string,
): Promise<string> {
  const ext      = path.extname(file.originalname).toLowerCase() || '.jpg';
  const filename = `${folder}/${uuidv4()}${ext}`;
  const bucket   = firebaseStorage.bucket(STORAGE_BUCKET);
  const fileRef  = bucket.file(filename);

  await fileRef.save(file.buffer, {
    metadata: { contentType: file.mimetype },
  });

  // Make the file publicly accessible
  await fileRef.makePublic();

  return `https://storage.googleapis.com/${STORAGE_BUCKET}/${filename}`;
}

/**
 * Build an Express middleware that:
 * 1. Parses the multipart form field with multer
 * 2. Uploads the file to Firebase Storage
 * 3. Attaches the public URL to req.file.location (S3-compatible interface)
 */
function buildUpload(folder: string, fieldName: string) {
  const multerMiddleware = multerInstance.single(fieldName);

  return async (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next(); // no file uploaded — that's fine

      try {
        const url = await uploadToFirebase(req.file, folder);
        // Attach URL in the same place multer-s3 would put it
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
