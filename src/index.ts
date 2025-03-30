import { Message, Whatsapp, create } from "venom-bot"
import  OpenAI from "openai"
import {openai} from './lib/openai'
import { initPrompt } from "./utils/initPrompt"
import server from "./adm/server"
import { initializeDb } from "./adm/dbFirestore"


server
initializeDb

console.log("passou!")





async function completion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<string | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    temperature: 0,
    max_tokens: 256,
    messages,
  })

  return completion.choices[0].message.content
}



export var userMessage:string[] = []
export let aiResponse:string[] = []

create({
  session: "bot-gpt",
  disableWelcome: true,
  browserArgs: ['--headless=new']
})
  .then(async (client: Whatsapp) => await start(client)
  
  
  )
  .catch((err) => {
    console.log(err)
  })

async function start(client: Whatsapp) {
  
  const customerChat: OpenAI.Chat.ChatCompletionMessageParam[] = [{
    role: "system",
    content: await initPrompt(),
  }]
    client.onMessage(async (message: Message) => {
      
      
      if (!message.body || message.isGroupMsg) return

      customerChat.push({
        role: "user",
        content: message.body,
      })

      userMessage.push(message.body)
      

      console.log("message: ", message.body)
      
      
      const response = (await completion(customerChat)) || "Poderia repetir, por favor?"

      

      console.log("message: ", response)

    
      customerChat.push({
        role: "assistant",
        content: response,
      })
      aiResponse.push(response)
    
  
      await client.sendText(message.from, response)
      
  }

  )
 
}

