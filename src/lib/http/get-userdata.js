import jwt from "jsonwebtoken"

export const getUserData = (request, permission) => {
  const accessToken = request.cookies.get("at")?.value
  if (!accessToken) throw new Error("No access token provided")
  
  const userData = jwt.decode(accessToken)

  if(userData.permisos.includes(permission)) {
    return userData
  }

  throw new Error("No tiene permiso para realizar esta acción")
}