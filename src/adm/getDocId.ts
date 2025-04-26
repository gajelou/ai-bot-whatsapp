import admin from "firebase-admin";

export async function getDocId(phone: number) {
  try {
    const snapshot = await admin.firestore()
      .collection('configuration')
      .where('phone', '==', phone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error(`Nenhum documento encontrado com o telefone ${phone}`);
    }

    const doc = snapshot.docs[0];
    console.log("Document ID encontrado:", doc.id);
    return doc.id;

  } catch (err) {
    console.error("Erro ao buscar usuário por telefone:", err);
  }
}
