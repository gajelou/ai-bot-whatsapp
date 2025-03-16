import express from "express";
import { userMessage, aiResponse } from "..";


const server = express()
server.use(express.json());


server.get("/message", (req,res)=>{
  res.status(200).send(userMessage);
});

server.get("/response", (req,res)=>{
  res.status(200).send(aiResponse);
});


server.listen(3000, ()=>{
  console.log("Server's up! Listening.");
})

export default server;
