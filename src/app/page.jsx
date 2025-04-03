"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material"
import { Notifications, NotificationsActive, Logout } from "@mui/icons-material"

export default function Dashboard() {
  const router = useRouter()

  // Estados para los menús
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)

  // Estados para alertas personalizadas
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState("info") // 'error', 'warning', 'info', 'success'

  // Datos estáticos para notificaciones
  const notifications = [
    {
      id: 1,
      message: "Tu contraseña vencerá en 10 días. Por favor, cámbiala para evitar el bloqueo de tu cuenta.",
      date: new Date().toLocaleString(),
      read: false,
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  // Manejadores para el menú de notificaciones
  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }

  // Manejadores para el menú de usuario
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  // Manejador para cerrar la alerta personalizada
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setSnackbarOpen(false)
  }

  // Función para mostrar alertas personalizadas
  const showAlert = (message, severity = "info") => {
    setAlertMessage(message)
    setAlertSeverity(severity)
    setSnackbarOpen(true)
  }

  // Manejador para cambiar contraseña
  const handleChangePassword = () => {
    handleNotificationClose()
    showAlert("Redirigiendo a cambiar contraseña...", "info")
    setTimeout(() => {
      router.push("/profile/change-password")
    }, 1000)
  }

  // Manejador para cerrar sesión
  const handleLogout = () => {
    handleUserMenuClose()
    showAlert("Sesión cerrada exitosamente", "success")
    setTimeout(() => {
      router.push("/auth/login")
    }, 1500)
  }

  return (
    <>
      {/* Navbar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DistriSoft
          </Typography>

          {/* Icono de notificaciones */}
          <Tooltip title="Notificaciones">
            <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={unreadCount} color="error">
                {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Menú de notificaciones */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            PaperProps={{
              sx: { width: 350, maxHeight: 400 },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Notificaciones</Typography>
            </Box>

            <List>
              {notifications.map((notification) => (
                <ListItem key={notification.id}>
                  <ListItemText primary={notification.message} secondary={notification.date} />
                </ListItem>
              ))}
            </List>

            <Box sx={{ p: 2 }}>
              <Button variant="contained" color="primary" fullWidth onClick={handleChangePassword}>
                Cambiar Contraseña
              </Button>
            </Box>
          </Menu>

          {/* Avatar de usuario */}
          <Tooltip title="Perfil de usuario">
            <IconButton color="inherit" onClick={handleUserMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.dark" }}>U</Avatar>
            </IconButton>
          </Tooltip>

          {/* Menú de usuario */}
          <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={handleUserMenuClose}>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Contenido del Dashboard */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard de Prueba
          </Typography>

          <Typography paragraph>Este es un dashboard simplificado de pruebas.</Typography>

          
        </Paper>
      </Container>

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
    </>
  )
}

