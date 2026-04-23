import { auth } from "../../utils/auth" 
export default defineEventHandler((event) => {
  
  return auth.handler(toWebRequest(event))

  //    bypass: true,
//    message: "Auth disabled"
})
