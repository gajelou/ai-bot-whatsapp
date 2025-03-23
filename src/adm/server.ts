import express from "express";
import { userMessage, aiResponse } from "..";
import auth from '../auth/auth'


const server = express()
server.use(express.json());
const { verifyToken } = auth; 



server.get("/message",verifyToken, (req,res)=>{
  res.status(200).send(userMessage);
});

server.get("/response",verifyToken, (req,res)=>{
  res.status(200).send(aiResponse);
});


server.listen(3000, ()=>{
  console.log("Server's up! Listening.");
})

export default server;
