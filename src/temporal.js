import bcrypt from "bcryptjs"

const password = "Prueba123!"
const saltRounds = 10

bcrypt.hash(password, saltRounds).then((hash) => {
  console.log("Nuevo hash generado:", hash)
})