import { eventName } from "..";
import { getPromptFromFirestore } from "../adm/getPromptFromFirestore";


export function initPrompt() {

  return getPromptFromFirestore().then((value) => {
    if (typeof value !== 'string') {
      throw new Error('O prompt recebido não é uma string.');
    }
    // Agora você tem certeza de que 'value' é uma string e pode usá-la como tal.
    console.log("segundo");
    return value;
  });
}

  //.replace(/{{[\s]?eventName[\s]?}}/g, eventName)  //aqui é onde substituímos o nome do evento- {{ storeName }}
