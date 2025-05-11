import { initTRPC } from "@trpc/server";


const trpc = initTRPC.create()

export const trpcRouter = trpc.router({
  trpc.procedure.query(()=>{
    
  }),
})

export type TrpcRouter = typeof  trpcRouter
