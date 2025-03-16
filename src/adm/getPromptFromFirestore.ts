import admin from "firebase-admin";



export async function getPromptFromFirestore(){
  try {
    const snapshot = await admin.firestore()
      .collection('configuration')
      .doc('tVHQgKGlsoMix1vX2qLy')
      .get();

    const configuration = snapshot.data();

    if (configuration !== undefined) {
      var promptString = configuration.prompt; // Se prompt já for uma string, isso é suficiente
      console.log("primeiro!/n");
      return promptString;
    } else {
      throw new Error('Configuration is undefined.');
    }
  } catch (err) {
    console.log(err);
  }

}
