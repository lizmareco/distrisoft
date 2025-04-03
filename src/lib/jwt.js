import jwt from "jsonwebtoken"

// Obtener la clave secreta del entorno
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key"

// Tiempo de expiración (en segundos)
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "30m" // 30 minutos por defecto
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d" // 7 días por defecto

/**
 * Genera un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @param {string} type - Tipo de token ('access' o 'refresh')
 * @returns {string} Token JWT
 */
export function generateToken(payload, type = "access") {
  const secret = type === "refresh" ? JWT_REFRESH_SECRET : JWT_SECRET
  const expiresIn = type === "refresh" ? REFRESH_TOKEN_EXPIRY : ACCESS_TOKEN_EXPIRY

  return jwt.sign(payload, secret, { expiresIn })
}

/**
 * Verifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @param {string} type - Tipo de token ('access' o 'refresh')
 * @returns {Object} Payload decodificado
 */
export function verifyJWT(token, type = "access") {
  try {
    const secret = type === "refresh" ? JWT_REFRESH_SECRET : JWT_SECRET
    return jwt.verify(token, secret)
  } catch (error) {
    console.error("Error al verificar el token JWT:", error.message)
    throw error
  }
}

/**
 * Decodifica un token JWT sin verificar la firma
 * @param {string} token - Token JWT a decodificar
 * @returns {Object} Payload decodificado
 */
export function decodeJWT(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    console.error("Error al decodificar el token JWT:", error.message)
    throw error
  }
}

