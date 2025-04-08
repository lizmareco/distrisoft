"use client"

import { useRootContext } from "@/src/app/context/root"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { apis } from "@/src/apis"
import { Visibility, VisibilityOff, CheckCircleOutline, Warning, ErrorOutline } from "@mui/icons-material"
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
  Link as MuiLink,
} from "@mui/material"
import Image from "next/image"
import Link from "next/link"

export default function LoginForm() {
  // Constante para el número máximo de intentos fallidos
  const MAX_INTENTOS_FALLIDOS = 3
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
  const [showPassword, setShowPassword] = useState(false)
  const [intentosFallidos, setIntentosFallidos] = useState(0)
  const [userState, setUserState] = useState(null) // Estado del usuario: ACTIVO, BLOQUEADO, VENCIDO, etc.
  const [userId, setUserId] = useState(null)
  const [diasVencidos, setDiasVencidos] = useState(0)

  const router = useRouter()

  // Usamos useEffect para acceder al contexto solo en el cliente
  const context = useRootContext()
  const [contextData, setContextData] = useState({ session: null, setState: null })

  const initializeContext = useCallback(() => {
    if (context && context.setState) {
      setContextData({
        session: context.session,
        setState: context.setState,
      })
    } else {
      console.error("Contexto no disponible.")
    }
  }, [context])

  useEffect(() => {
    setMounted(true)
    initializeContext()
  }, [initializeContext])

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
    setUserState(null)
    setUserId(null)
    setDiasVencidos(0)

    try {
      console.log("Enviando solicitud de login:", formData)

      // Primero, verificar si el usuario existe y obtener su información
      const checkUserResponse = await fetch(
        `/api/auth/check-user?nombreUsuario=${encodeURIComponent(formData.nombreUsuario)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (checkUserResponse.ok) {
        const userData = await checkUserResponse.json()

        // Si el usuario existe, verificar si la contraseña ha vencido
        if (userData.usuario) {
          const ultimoCambioContrasena = new Date(userData.usuario.ultimoCambioContrasena)
          const fechaActual = new Date()
          const diasTranscurridos = Math.floor((fechaActual - ultimoCambioContrasena) / (1000 * 60 * 60 * 24))

          console.log("Días transcurridos desde último cambio:", diasTranscurridos)

          // Si han pasado 90 días o más y el estado es ACTIVO, cambiar a VENCIDO
          if (diasTranscurridos >= 90 && userData.usuario.estado === "ACTIVO") {
            console.log("La contraseña ha vencido. Cambiando estado a VENCIDO")

            // Actualizar el estado del usuario a VENCIDO
            await fetch("/api/auth/update-user-state", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                idUsuario: userData.usuario.idUsuario,
                estado: "VENCIDO",
              }),
            })

            // Establecer el estado como vencido en el frontend
            setUserState("VENCIDO")
            setUserId(userData.usuario.idUsuario)
            setDiasVencidos(diasTranscurridos - 90)
            setError("Tu contraseña ha vencido. Por favor, cámbiala para continuar usando el sistema.")
            setIsLoading(false)
            return // Detener el proceso de login
          }
        }
      }

      // Continuar con el proceso normal de login
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

        // Guardar el ID de usuario si está disponible
        if (data.userId) {
          setUserId(data.userId)
        }

        // Verificar si la cuenta tiene contraseña vencida
        if (data.cuentaVencida) {
          setUserState("VENCIDO")
          setError("Tu contraseña ha vencido. Por favor, cámbiala para continuar usando el sistema.")

          // Si hay información sobre días vencidos, mostrarla
          if (data.diasVencidos) {
            setDiasVencidos(data.diasVencidos)
          }
        } else {
          // Mostrar mensaje de éxito solo si el usuario está ACTIVO
          setSuccess(true)

          // Establecer la sesión en el contexto
          if (contextData.setState && contextData.setState.setSession) {
            try {
              console.log("Estableciendo sesión con datos:", data.user || data)

              // Decodificar el token para mostrar en depuración
              const tokenParts = data.accessToken.split(".")
              const header = JSON.parse(atob(tokenParts[0]))
              const payload = JSON.parse(atob(tokenParts[1]))

              console.log("Token decodificado:", { header, payload })

              // Establecer la sesión con los datos del usuario y el token
              contextData.setState.setSession({
                ...(data.user || {}),
                token: data.accessToken,
                permisos: payload.permisos || [],
              })

              // IMPORTANTE: Redirigir al dashboard después de establecer la sesión
              console.log("Preparando redirección al dashboard...")
              setTimeout(() => {
                console.log("Redirigiendo al dashboard...")
                router.push("/dashboard")
              }, 1000)
            } catch (contextError) {
              console.error("Error al establecer la sesión:", contextError)
              setError("Error al establecer la sesión. Por favor, inténtalo de nuevo.")
            }
          } else {
            console.error("Contexto no disponible correctamente:", contextData)
            setError("Error de configuración. Por favor, contacta al administrador.")
          }
        }
      } else {
        // Manejar diferentes tipos de errores basados en el estado del usuario
        if (data.cuentaBloqueada || data.estado === "BLOQUEADO") {
          setUserState("BLOQUEADO")
          setError("Tu cuenta ha sido bloqueada por múltiples intentos fallidos. Contacta al administrador.")
        } else if (data.estado === "INACTIVO") {
          setUserState("INACTIVO")
          setError("Tu cuenta está inactiva. Por favor, contacta al administrador del sistema.")
        } else if (data.cuentaVencida || data.estado === "VENCIDO") {
          setUserState("VENCIDO")
          setError("Tu contraseña ha vencido. Por favor, cámbiala para continuar usando el sistema.")
          if (data.userId) {
            setUserId(data.userId)
          }
          if (data.diasVencidos) {
            setDiasVencidos(data.diasVencidos)
          }
        } else if (data.intentosRestantes !== undefined) {
          // Manejar intentos fallidos - Importante: actualizar correctamente el contador
          const nuevosIntentosFallidos = MAX_INTENTOS_FALLIDOS - data.intentosRestantes
          setIntentosFallidos(nuevosIntentosFallidos)
          setError(
            `Usuario o contraseña inválidos. Te quedan ${data.intentosRestantes} ${
              data.intentosRestantes === 1 ? "intento" : "intentos"
            }.`,
          )
        } else {
          // Error genérico
          setError(data.message || "Usuario o contraseña inválidos")
        }
      }
    } catch (err) {
      console.error("Error en la solicitud de login:", err)
      setError("Error de conexión. Verifica tu conexión a internet.")
    } finally {
      setIsLoading(false)
    }
  }

  // Si no está montado, no renderizamos nada para evitar problemas de hidratación
  if (!mounted) {
    return null
  }

  // Determinar si la cuenta está bloqueada o inactiva
  const isCuentaBloqueada = userState === "BLOQUEADO"
  const isCuentaInactiva = userState === "INACTIVO"
  const isCuentaVencida = userState === "VENCIDO"

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
          <Alert
            severity={isCuentaBloqueada || isCuentaInactiva ? "error" : isCuentaVencida ? "warning" : "warning"}
            icon={isCuentaVencida ? <Warning /> : isCuentaBloqueada ? <ErrorOutline /> : undefined}
            sx={{
              width: "100%",
              mb: 2,
              border: isCuentaBloqueada ? "1px solid #d32f2f" : isCuentaVencida ? "1px solid #ed6c02" : "none",
              bgcolor: isCuentaBloqueada
                ? "rgba(211, 47, 47, 0.1)"
                : isCuentaVencida
                  ? "rgba(237, 108, 2, 0.1)"
                  : undefined,
            }}
          >
            <Typography variant="body1" fontWeight={isCuentaBloqueada || isCuentaVencida ? "medium" : "normal"}>
              {error}
            </Typography>

            {intentosFallidos > 0 && !isCuentaBloqueada && !isCuentaVencida && !isCuentaInactiva && (
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {Array(Math.min(intentosFallidos, MAX_INTENTOS_FALLIDOS))
                    .fill()
                    .map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "error.main",
                        }}
                      />
                    ))}
                  {Array(MAX_INTENTOS_FALLIDOS - Math.min(intentosFallidos, MAX_INTENTOS_FALLIDOS))
                    .fill()
                    .map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "grey.300",
                        }}
                      />
                    ))}
                </Box>
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {intentosFallidos === 1
                    ? "1 intento fallido"
                    : intentosFallidos >= MAX_INTENTOS_FALLIDOS
                      ? "Máximo de intentos alcanzado"
                      : `${intentosFallidos} intentos fallidos`}
                </Typography>
              </Box>
            )}

            {isCuentaBloqueada && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: "medium", color: "error.main" }}>
                  Tu cuenta ha sido bloqueada por seguridad. Por favor, contacta al administrador del sistema para
                  desbloquearla.
                </Typography>
              </Box>
            )}

            {isCuentaVencida && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
                  {diasVencidos > 0
                    ? `Tu contraseña venció hace ${diasVencidos} ${diasVencidos === 1 ? "día" : "días"}.`
                    : "Tu contraseña ha vencido."}{" "}
                  Debes cambiarla para continuar.
                </Typography>
                <Button
                  component={Link}
                  href={`/profile/change-password?vencida=true${userId ? `&userId=${userId}` : ""}`}
                  variant="contained"
                  color="warning"
                  size="small"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Cambiar Contraseña
                </Button>
              </Box>
            )}
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
            disabled={isCuentaBloqueada || isCuentaInactiva || isCuentaVencida || isLoading || success}
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                opacity: isCuentaBloqueada || isCuentaVencida ? 0.6 : 1,
              },
            }}
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
            disabled={isCuentaBloqueada || isCuentaInactiva || isCuentaVencida || isLoading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isCuentaBloqueada || isCuentaInactiva || isCuentaVencida || isLoading || success}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                opacity: isCuentaBloqueada || isCuentaVencida ? 0.6 : 1,
              },
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                color="primary"
                disabled={isCuentaBloqueada || isCuentaInactiva || isCuentaVencida || isLoading || success}
              />
            }
            label="Recuérdame"
            sx={{
              mb: 2,
              opacity: isCuentaBloqueada || isCuentaVencida ? 0.6 : 1,
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color={isCuentaVencida ? "warning" : "primary"}
            disabled={
              isLoading || isCuentaBloqueada || isCuentaInactiva || isCuentaVencida || success || !contextData.setState
            }
            sx={{
              py: 1.5,
              mb: 2,
              fontSize: "1rem",
              opacity: isCuentaBloqueada || isCuentaVencida ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                Iniciando sesión...
              </Box>
            ) : isCuentaBloqueada ? (
              "Cuenta bloqueada"
            ) : isCuentaVencida ? (
              "Contraseña vencida"
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <MuiLink
              component={Link}
              href="/auth/forgot-password"
              variant="body2"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              ¿Olvidaste tu contraseña?
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
