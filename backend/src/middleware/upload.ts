import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3, S3_BUCKET } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPEG, PNG, WEBP, PDF'));
  }
}

function buildUpload(folder: string) {
  const storage = S3_BUCKET
    ? multerS3({
        s3: s3 as any,
        bucket: S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${folder}/${uuidv4()}${ext}`);
        },
      })
    : multer.memoryStorage();

  return multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
}

export const uploadBagPhoto      = buildUpload('bags').single('photo');
export const uploadPartnerLogo   = buildUpload('partners/logos').single('logo');
export const uploadPartnerCover  = buildUpload('partners/covers').single('cover');
export const uploadDocument      = buildUpload('documents').single('document');
export const uploadAvatar        = buildUpload('avatars').single('avatar');
