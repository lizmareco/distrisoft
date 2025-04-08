/**
 * Valida la complejidad de una contraseña
 * @param {string} password - La contraseña a validar
 * @returns {Object} Objeto con el resultado de la validación
 */
export function validatePasswordComplexity(password) {
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const isValid = Object.values(validations).every(Boolean)
  const errors = []

  if (!validations.length) errors.push("La contraseña debe tener al menos 8 caracteres")
  if (!validations.uppercase) errors.push("La contraseña debe contener al menos una letra mayúscula")
  if (!validations.lowercase) errors.push("La contraseña debe contener al menos una letra minúscula")
  if (!validations.number) errors.push("La contraseña debe contener al menos un número")
  if (!validations.special) errors.push("La contraseña debe contener al menos un carácter especial")

  return { isValid, validations, errors }
}

