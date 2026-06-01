import admin from 'firebase-admin';
import { env } from './env';

const isPlaceholder = !env.FIREBASE_PROJECT_ID ||
  env.FIREBASE_PROJECT_ID.includes('placeholder') ||
  env.FIREBASE_PRIVATE_KEY.includes('placeholder');

// Storage bucket — derived from project ID (matches Firebase default bucket)
export const STORAGE_BUCKET = `${env.FIREBASE_PROJECT_ID}.firebasestorage.app`;

if (!admin.apps.length) {
  if (isPlaceholder) {
    admin.initializeApp({ projectId: 'lastcall-dev' });
    console.warn('⚠️  Firebase running in stub mode — phone auth disabled. Set real credentials to enable.');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   env.FIREBASE_PROJECT_ID,
        privateKey:  env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: STORAGE_BUCKET,
    });
  }
}

export const firebaseAdmin     = admin;
export const firebaseAuth      = admin.auth();
export const firebaseMessaging = admin.messaging();
export const firebaseStorage   = admin.storage();
