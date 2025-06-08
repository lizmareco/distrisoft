import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export const getUserData = async (request, permission) => {
  // 1. Intentar obtener el token de la cookie
  const cookieStore = await cookies()
  let accessToken = cookieStore.get("at")?.value

  // 2. Si no está en la cookie, buscar en el header Authorization
  if (!accessToken && request.headers) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7)
    }
  }

  if (!accessToken) throw new Error("Sesión no iniciada")
  
  const userData = jwt.decode(accessToken)

  if(userData.permisos.includes(permission)) {
    return userData
  }

  throw new Error("No tiene permiso para realizar esta acción")
}