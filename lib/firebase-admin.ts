import admin from 'firebase-admin';

const serviceAccountBase64 = process.env.SERVICE_ACCOUNT_KEY || '';
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
