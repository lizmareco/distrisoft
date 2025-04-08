"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apis } from "@/src/apis"
import { TextField, Button, Alert } from "@mui/material"
import { ArrowBack, Email } from "@mui/icons-material"

export default function ForgotPasswordForm() {
  const [correo, setCorreo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleChange = (e) => {
    setCorreo(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch(apis.forgotPassword.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setCorreo("")
      } else {
        setError(data.message || "Ocurrió un error al procesar tu solicitud")
      }
    } catch (err) {
      console.error("Error al solicitar recuperación:", err)
      setError("Error de conexión. Verifica tu conexión a internet.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Recuperar Contraseña</h2>

      <p className="text-center text-gray-600 mb-6">
        Ingresa tu correo electrónico y te enviaremos instrucciones para recuperar tu contraseña.
      </p>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className="mb-4" icon={<Email fontSize="inherit" />}>
          Si el correo existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña. Por favor,
          revisa tu bandeja de entrada y la carpeta de spam.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <TextField
            fullWidth
            label="Correo Electrónico"
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            required
            value={correo}
            onChange={handleChange}
            disabled={isLoading || success}
            InputProps={{ style: { color: "black" } }}
          />
        </div>

        <div className="mb-4">
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading || success}
            sx={{ py: 1.5 }}
          >
            {isLoading ? "Enviando..." : "Enviar Instrucciones"}
          </Button>
        </div>

        <div>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push("/auth/login")}
            sx={{ py: 1.5 }}
          >
            Volver al Inicio de Sesión
          </Button>
        </div>
      </form>
    </div>
  )
}

