import admin from "firebase-admin";

const serviceAccount = require('../../serviceAccountKey.json');



export const initializeDb = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
