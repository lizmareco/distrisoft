// Tiempos de expiración para cookies (en segundos)
export const ACCESS_TOKEN_MAX_AGE = Number.parseInt(process.env.ACCESS_TOKEN_MAX_AGE || "1800")
export const REFRESH_TOKEN_MAX_AGE = Number.parseInt(process.env.REFRESH_TOKEN_MAX_AGE || "1296000")

// Claves JWT
export const JWT_SECRET = process.env.JWT_SECRET
export const JWT_SECRET_EXPIRE = process.env.JWT_SECRET_EXPIRE || "30m"
export const JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN
export const JWT_REFRESH_TOKEN_EXPIRE = process.env.JWT_REFRESH_TOKEN_EXPIRE || "15d"
