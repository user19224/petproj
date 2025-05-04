import { TrpcProvider } from "./lib/trpc"
import { AllIdeasPage } from "./pages/AllIdesPage"

 

export const App = ()=>{
  return (

    <TrpcProvider>

      <AllIdeasPage />
    </TrpcProvider>
    
  )
}
