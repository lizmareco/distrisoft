import bcrypt from "bcryptjs"

// Configuración para bcrypt
const SALT_ROUNDS = 10

/**
 * Encripta una contraseña usando bcrypt
 * @param {string} password - La contraseña en texto plano
 * @returns {Promise<string>} - La contraseña encriptada
 */
export const encryptPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS)
  } catch (error) {
    console.error("Error al encriptar contraseña:", error)
    throw new Error("Error al procesar la contraseña")
  }
}

/**
 * Verifica si una contraseña coincide con su versión encriptada
 * @param {string} password - La contraseña en texto plano
 * @param {string} hashedPassword - La contraseña encriptada
 * @returns {Promise<boolean>} - true si coinciden, false si no
 */
export const verifyPassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error("Error al verificar contraseña:", error)
    return false
  }
}

/**
 * Valida la complejidad de una contraseña
 * @param {string} password - La contraseña a validar
 * @returns {Object} - Objeto con el resultado de la validación
 */
export const validatePasswordComplexity = (password) => {
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  }

  const isValid = Object.values(validations).every(Boolean)

  const errors = []
  if (!validations.length) errors.push("La contraseña debe tener al menos 8 caracteres")
  if (!validations.uppercase) errors.push("La contraseña debe incluir al menos una letra mayúscula")
  if (!validations.lowercase) errors.push("La contraseña debe incluir al menos una letra minúscula")
  if (!validations.number) errors.push("La contraseña debe incluir al menos un número")
  if (!validations.special) errors.push("La contraseña debe incluir al menos un carácter especial")

  return {
    isValid,
    validations,
    errors,
  }
}

