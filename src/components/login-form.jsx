"use client"

import { useRootContext } from "@/src/app/context/root"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apis } from "@/src/apis"
import { Visibility, VisibilityOff, CheckCircleOutline } from "@mui/icons-material"
import {
  IconButton,
  InputAdornment,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Fade,
} from "@mui/material"
import Image from "next/image"

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)
    setDebugInfo(null)

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

        // Mostrar mensaje de éxito
        setSuccess(true)

        // Guardar información de depuración
        setDebugInfo({
          status: "success",
          message: "Login exitoso",
          data: data,
        })

        // Establecer la sesión en el contexto
        if (contextData.setState && contextData.setState.setSession) {
          try {
            console.log("Estableciendo sesión con datos:", data.user)
            contextData.setState.setSession(data.user)

            // Redirigir después de un breve retraso para asegurar que la sesión se establezca
            // y que el usuario pueda ver el mensaje de éxito
            setTimeout(() => {
              console.log("Redirigiendo a la página principal")
              router.push("/")
            }, 1500)
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
        } else if (data.intentosRestantes !== undefined) {
          const nuevosIntentosFallidos = 3 - data.intentosRestantes
          setIntentosFallidos(nuevosIntentosFallidos)
          setError(
            `Usuario o contraseña inválidos. Te quedan ${data.intentosRestantes} ${data.intentosRestantes === 1 ? "intento" : "intentos"}.`,
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
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden", // Evita barras de desplazamiento
        }}
      >
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </Box>

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ fontWeight: "bold", color: "text.primary" }}
        >
          Bienvenido a DistriSoft
        </Typography>

        {!contextData.setState && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            Error de configuración: El contexto no está disponible. Por favor, contacta al administrador.
          </Alert>
        )}

        {error && (
          <Alert severity={cuentaBloqueada ? "error" : "warning"} sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Fade in={success}>
            <Alert
              icon={<CheckCircleOutline fontSize="inherit" />}
              severity="success"
              sx={{
                width: "100%",
                mb: 2,
                display: "flex",
                alignItems: "center",
                "& .MuiAlert-message": {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                },
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                ¡Inicio de sesión exitoso! Redirigiendo...
              </Typography>
              <CircularProgress size={20} color="success" sx={{ ml: 2 }} />
            </Alert>
          </Fade>
        )}



        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <TextField
            margin="normal"
            fullWidth
            label="Nombre de Usuario"
            id="nombreUsuario"
            name="nombreUsuario"
            type="text"
            autoComplete="username"
            required
            value={formData.nombreUsuario}
            onChange={handleChange}
            disabled={cuentaBloqueada || isLoading || success}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="normal"
            fullWidth
            label="Contraseña"
            id="contrasena"
            name="contrasena"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={formData.contrasena}
            onChange={handleChange}
            disabled={cuentaBloqueada || isLoading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={cuentaBloqueada || isLoading || success}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                color="primary"
                disabled={cuentaBloqueada || isLoading || success}
              />
            }
            label="Recuérdame"
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading || cuentaBloqueada || success || !contextData.setState}
            sx={{
              py: 1.5,
              mb: 2,
              fontSize: "1rem",
            }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                Iniciando sesión...
              </Box>
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography
              variant="body2"
              component="a"
              href="#"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              ¿Olvidaste tu contraseña?
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

