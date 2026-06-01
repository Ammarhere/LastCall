import admin from 'firebase-admin';
import { env } from './env';

const isPlaceholder = !env.FIREBASE_PROJECT_ID ||
  env.FIREBASE_PROJECT_ID.includes('placeholder') ||
  env.FIREBASE_PRIVATE_KEY.includes('placeholder');

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
    });
  }
}

export const firebaseAdmin     = admin;
export const firebaseAuth      = admin.auth();
export const firebaseMessaging = admin.messaging();
