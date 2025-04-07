"use client"

import { useRootContext } from "@/src/app/context/root"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apis } from "@/src/apis"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import {
  IconButton,
  InputAdornment,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material"
import Image from "next/image"
import Link from "next/link"

export default function LoginForm() {
  // Estado para controlar si el componente está montado
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    nombreUsuario: "",
    contrasena: "",
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [intentosFallidos, setIntentosFallidos] = useState(0)
  const [cuentaBloqueada, setCuentaBloqueada] = useState(false)
  const [cuentaVencida, setCuentaVencida] = useState(false)
  // Agregar un nuevo estado para almacenar el ID del usuario
  const [userId, setUserId] = useState(null)

  const router = useRouter()

  // Usamos useEffect para acceder al contexto solo en el cliente
  const context = useRootContext()
  const [contextData, setContextData] = useState({ session: null, setState: null })

  useEffect(() => {
    // Marcar como montado
    setMounted(true)

    // Acceder al contexto solo en el cliente
    try {
      if (context && context.setState) {
        setContextData({
          session: context.session,
          setState: context.setState,
        })
      }
    } catch (error) {
      console.error("Error al acceder al contexto:", error)
    }
  }, [context])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // En el método handleSubmit, actualizar el manejo de errores para diferenciar entre BLOQUEADO y VENCIDO
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)
    setDebugInfo(null)
    setCuentaVencida(false)
    setUserId(null)

    try {
      console.log("Enviando solicitud de login:", formData)

      const response = await fetch(apis.login.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Respuesta recibida:", response.status)

      const data = await response.json()
      console.log("Datos recibidos:", data)

      if (response.status === 200) {
        // Reiniciamos contador de intentos fallidos en caso de éxito
        setIntentosFallidos(0)
        setCuentaBloqueada(false)

        // Guardar tokens en localStorage para persistencia
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken)
          console.log("Token guardado en localStorage")

          // Decodificar el token para obtener información del usuario
          try {
            const tokenParts = data.accessToken.split(".")
            const payload = JSON.parse(atob(tokenParts[1]))

            // Guardar información básica del usuario
            localStorage.setItem(
              "user",
              JSON.stringify({
                id: payload.idUsuario,
                nombre: payload.nombre,
                apellido: payload.apellido,
                rol: payload.rol,
              }),
            )
            console.log("Datos de usuario guardados en localStorage")

            // Extraer el ID de usuario del payload del token
            if (payload.idUsuario) {
              setUserId(payload.idUsuario)
              console.log("ID de usuario extraído del token:", payload.idUsuario)
            }
          } catch (tokenError) {
            console.error("Error al procesar token:", tokenError)
          }
        }

        // Verificar si la cuenta tiene contraseña vencida
        if (data.cuentaVencida) {
          setCuentaVencida(true)
          setError("Tu contraseña ha vencido. Por favor, cámbiala para continuar usando el sistema.")
          setSuccess(false) // No mostrar mensaje de éxito si la contraseña está vencida
        } else {
          // Mostrar mensaje de éxito solo si la contraseña no está vencida
          setSuccess(true)

          // SOLUCIÓN: Usar window.location.href para redirección directa
          console.log("Redirigiendo directamente al dashboard...")
          window.location.href = "/dashboard"
          return // Detener la ejecución del resto del código
        }

        // Guardar información de depuración
        setDebugInfo({
          status: "success",
          message: "Login exitoso",
          data: data,
          token: {
            header: JSON.parse(atob(data.accessToken.split(".")[0])),
            payload: JSON.parse(atob(data.accessToken.split(".")[1])),
          },
        })

        // Establecer la sesión en el contexto
        if (contextData.setState && contextData.setState.setSession) {
          try {
            console.log("Estableciendo sesión con datos:", data)

            // Decodificar el token para mostrar en depuración
            const tokenParts = data.accessToken.split(".")
            const header = JSON.parse(atob(tokenParts[0]))
            const payload = JSON.parse(atob(tokenParts[1]))

            console.log("Token decodificado:", { header, payload })

            // Establecer la sesión con los datos del usuario y el token
            contextData.setState.setSession({
              ...payload,
              token: data.accessToken,
            })

            // Verificar si la cuenta tiene contraseña vencida
            if (data.cuentaVencida) {
              setCuentaVencida(true)
              setError("Tu contraseña ha vencido. Por favor, cámbiala para continuar usando el sistema.")
            } else {
              // Redirigir después de un breve retraso solo si la contraseña no está vencida
              console.log("Preparando redirección a la página principal...")

              // SOLUCIÓN ALTERNATIVA: Si la redirección directa no funcionó, intentar con router.push
              setTimeout(() => {
                console.log("Redirigiendo con router.push...")
                router.push("/dashboard")
              }, 1500)
            }
          } catch (contextError) {
            console.error("Error al establecer la sesión:", contextError)
            setError("Error al establecer la sesión. Por favor, inténtalo de nuevo.")
            setDebugInfo({
              status: "error",
              message: "Error al establecer la sesión",
              error: contextError.message,
            })
          }
        } else {
          console.error("Contexto no disponible correctamente:", contextData)
          setError("Error de configuración. Por favor, contacta al administrador.")
          setDebugInfo({
            status: "error",
            message: "Contexto no disponible correctamente",
            context: contextData,
          })
        }
      } else {
        // Manejar diferentes tipos de errores
        if (data.cuentaBloqueada) {
          setCuentaBloqueada(true)
          setError("Tu cuenta ha sido bloqueada por múltiples intentos fallidos. Contacta al administrador.")
        } else if (data.cuentaVencida) {
          setCuentaVencida(true)
          setError("Tu contraseña ha vencido. Por favor, cámbiala para continuar usando el sistema.")

          // Intentar extraer el ID de usuario del token si está disponible
          try {
            if (data.accessToken) {
              const tokenParts = data.accessToken.split(".")
              const payload = JSON.parse(atob(tokenParts[1]))
              if (payload.idUsuario) {
                setUserId(payload.idUsuario)
              }
            }
          } catch (tokenError) {
            console.error("Error al extraer ID de usuario del token:", tokenError)
          }
        } else if (data.intentosRestantes !== undefined) {
          const nuevosIntentosFallidos = 3 - data.intentosRestantes
          setIntentosFallidos(nuevosIntentosFallidos)
          setError(
            `Usuario o contraseña inválidos. Te quedan ${data.intentosRestantes} ${
              data.intentosRestantes === 1 ? "intento" : "intentos"
            }.`,
          )
        } else {
          setError(data.message || "Usuario o contraseña inválidos")
        }

        setDebugInfo({
          status: "error",
          message: "Error de autenticación",
          data: data,
        })
      }
    } catch (err) {
      console.error("Error en la solicitud de login:", err)
      setError("Error de conexión. Verifica tu conexión a internet.")
      setDebugInfo({
        status: "error",
        message: "Error en la solicitud",
        error: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Si no está montado, no renderizamos nada para evitar problemas de hidratación
  if (!mounted) {
    return null
  }

  // Una vez montado, renderizamos el formulario completo
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </div>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Bienvenido a DistriSoft</h2>

        {error && (
          <Alert severity={cuentaBloqueada ? "error" : "warning"} className="mb-4">
            {error}
            {cuentaVencida && (
              <Box sx={{ mt: 1 }}>
                <Button
                  component={Link}
                  href={`/profile/change-password?vencida=true${userId ? `&userId=${userId}` : ""}`}
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Cambiar contraseña
                </Button>
              </Box>
            )}
          </Alert>
        )}

        {success && (
          <Alert severity="success" className="mb-4">
            ¡Inicio de sesión exitoso! Redirigiendo...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <TextField
              fullWidth
              label="Nombre de Usuario"
              id="nombreUsuario"
              name="nombreUsuario"
              type="text"
              autoComplete="username"
              required
              value={formData.nombreUsuario}
              onChange={handleChange}
              InputProps={{ style: { color: "black" } }}
              disabled={cuentaBloqueada || isLoading}
            />
          </div>

          <div className="mb-4">
            <TextField
              fullWidth
              label="Contraseña"
              id="contrasena"
              name="contrasena"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.contrasena}
              onChange={handleChange}
              InputProps={{
                style: { color: "black" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={cuentaBloqueada || isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={cuentaBloqueada || isLoading}
            />
          </div>

          <div className="mb-4">
            <FormControlLabel
              control={
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  color="primary"
                  disabled={cuentaBloqueada || isLoading}
                />
              }
              label="Recuérdame"
            />
          </div>

          <Button type="submit" fullWidth variant="contained" color="primary" disabled={isLoading || cuentaBloqueada}>
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                Iniciando sesión...
              </Box>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-gray-700 hover:text-gray-800">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div>
  )
}

