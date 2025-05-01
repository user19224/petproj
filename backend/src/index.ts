import express from 'express'
import {initTRPC} from '@trpc/server'


const expressApp = express()
const ideas = [
    {
      nick: 'nickname1',
      name: 'Idea 1',
      description: 'Description of idea 1...',                                                                                                           },
    {
      nick: 'nickname2',
      name: 'Idea 2',
      description: 'Description of idea 2...',
    },
    {
      nick: 'nickname3',
      name: 'Idea 3',
      description: 'Description of idea 3...',
    },
    {
      nick: 'nickname4',
      name: 'Idea 4',
      description: 'Description of idea 4...',
    },
    {
      nick: 'nickname5',
      name: 'Idea 5',
      description: 'Description of idea 5...',
    },
  ]

expressApp.get('/ideas',(req,res)=>{
  
    res.send(ideas)
})

expressApp.listen(3000,()=>{
  console.info("Listening at https://localhost:3000")
})
