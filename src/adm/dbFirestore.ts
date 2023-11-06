import admin from "firebase-admin";




export const initializeDb = admin.initializeApp({
  credential: admin.credential.cert("serviceAccountKey.json")
});
