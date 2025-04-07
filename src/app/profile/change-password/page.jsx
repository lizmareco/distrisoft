"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
} from "@mui/material"
import { Visibility, VisibilityOff, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from "@mui/icons-material"

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isVencida = searchParams.get("vencida") === "true"
  const userId = searchParams.get("userId")

  // Estados para controlar la visibilidad de las contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Estado para alerta personalizada
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState("success")

  // Estados para validaciones de contraseña
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  })

  // Validar la contraseña cuando cambia
  useEffect(() => {
    setValidations({
      minLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
      passwordsMatch: newPassword === confirmPassword && newPassword !== "",
    })
  }, [newPassword, confirmPassword])

  // Verificar si todas las validaciones pasan
  const allValidationsPassed = Object.values(validations).every((validation) => validation === true)

  // Manejador para cerrar la alerta personalizada
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setSnackbarOpen(false)
  }

  // Función para mostrar alertas personalizadas
  const showAlert = (message, severity = "success") => {
    setAlertMessage(message)
    setAlertSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Verificar todas las validaciones antes de enviar
    if (!allValidationsPassed) {
      setError("Por favor, asegúrate de cumplir con todos los requisitos de la contraseña.")
      return
    }

    setLoading(true)

    try {
      console.log("Enviando solicitud de cambio de contraseña...")

      // Obtener el token de las cookies del navegador
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      }, {})

      const accessToken = cookies.at
      console.log("Token encontrado en cookies:", accessToken ? "Sí" : "No")

      // Preparar los datos para enviar
      const requestData = {
        currentPassword,
        newPassword,
      }

      // Si tenemos un userId del parámetro de búsqueda, lo incluimos
      if (userId) {
        requestData.userId = userId
        console.log("Incluyendo userId en la solicitud:", userId)
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        body: JSON.stringify(requestData),
        credentials: "include", // Importante: incluir cookies en la solicitud
      })

      const data = await response.json()
      console.log("Respuesta:", data)

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar la contraseña")
      }

      setSuccess(true)
      showAlert("Contraseña actualizada correctamente", "success")

      // Esperar 2 segundos y luego redirigir al dashboard
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      console.error("Error al cambiar la contraseña:", err)
      setError(err.message || "Error al cambiar la contraseña")
      showAlert(err.message || "Error al cambiar la contraseña", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Cambiar Contraseña
        </Typography>

        {isVencida && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            Tu contraseña ha vencido. Por favor, cámbiala para continuar usando el sistema.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            Contraseña actualizada correctamente. Redirigiendo...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Contraseña Actual"
            type={showCurrentPassword ? "text" : "password"}
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                    disabled={loading || success}
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="Nueva Contraseña"
            type={showNewPassword ? "text" : "password"}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                    disabled={loading || success}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Nueva Contraseña"
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={loading || success}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Lista de requisitos de contraseña */}
          <Box sx={{ mt: 2, mb: 2, bgcolor: "background.paper", p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="medium">
              La contraseña debe cumplir con los siguientes requisitos:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: "36px" }}>
                  {validations.minLength ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="Al menos 8 caracteres" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: "36px" }}>
                  {validations.hasUpperCase ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="Al menos una letra mayúscula" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: "36px" }}>
                  {validations.hasLowerCase ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="Al menos una letra minúscula" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: "36px" }}>
                  {validations.hasNumber ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="Al menos un número" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: "36px" }}>
                  {validations.hasSpecialChar ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="Al menos un carácter especial (!@#$%^&*)" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: "36px" }}>
                  {validations.passwordsMatch ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                </ListItemIcon>
                <ListItemText primary="Las contraseñas coinciden" />
              </ListItem>
            </List>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || success || !allValidationsPassed}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                Procesando...
              </Box>
            ) : (
              "Cambiar Contraseña"
            )}
          </Button>
        </Box>
      </Paper>

      {/* Alerta personalizada */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={alertSeverity} variant="filled" sx={{ width: "100%" }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}
