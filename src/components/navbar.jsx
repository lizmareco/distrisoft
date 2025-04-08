"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Button,
} from "@mui/material"
import { Logout, Dashboard, Notifications, NotificationsActive } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import { useRootContext } from "@/src/app/context/root"

export default function Navbar() {
  // Todos los hooks al inicio del componente
  const router = useRouter()
  const pathname = usePathname()
  const { session, setState } = useRootContext()
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  // Verificar si estamos en una página de autenticación
  const isAuthPage = pathname?.includes("/auth/") || pathname === "/auth" || pathname === "/profile/change-password"

  // Efecto para marcar el componente como montado y cargar notificaciones
  useEffect(() => {
    setMounted(true)

    // Solo cargar notificaciones si no estamos en una página de autenticación
    if (!isAuthPage && mounted) {
      fetchNotifications()
    }
  }, [isAuthPage, mounted])

  // Función para cargar notificaciones
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const handleLogout = async () => {
    setUserMenuAnchor(null)

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (setState && setState.setSession) {
        setState.setSession(null)
      }

      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      alert("Error al cerrar sesión")
    }
  }

  // Funciones para el menú de usuario
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  // Funciones para el menú de notificaciones
  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }

  const handleChangePassword = () => {
    router.push("/profile/change-password")
    handleNotificationClose()
  }

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (session?.nombre) {
      return session.nombre.charAt(0).toUpperCase()
    }
    return "U"
  }

  // Calcular notificaciones no leídas
  const unreadCount = notifications.filter((n) => !n.leido).length

  // No renderizar durante la hidratación
  if (!mounted) {
    return null
  }

  // No renderizar en páginas de autenticación
  if (isAuthPage) {
    return null
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <IconButton color="inherit" edge="start" onClick={() => router.push("/dashboard")} sx={{ mr: 2 }}>
            <Dashboard />
          </IconButton>
          <Typography variant="h6" component="div">
            DistriSoft
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Notificaciones */}
          <Tooltip title="Notificaciones">
            <IconButton color="inherit" onClick={handleNotificationOpen}>
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

            <Box sx={{ maxHeight: 250, overflow: "auto" }}>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Box
                    key={notification.idNotificacion}
                    sx={{
                      p: 2,
                      borderBottom: "1px solid #eee",
                      bgcolor: notification.leido ? "transparent" : "rgba(25, 118, 210, 0.08)",
                    }}
                  >
                    <Typography variant="body1">{notification.mensaje}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.fechaEnvio).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2">No tienes notificaciones</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2 }}>
              <Button variant="contained" color="primary" fullWidth onClick={handleChangePassword}>
                Cambiar Contraseña
              </Button>
            </Box>
          </Menu>

          {/* Avatar y menú de usuario */}
          <Tooltip title="Perfil de usuario">
            <IconButton color="inherit" onClick={handleUserMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.dark" }}>{getUserInitials()}</Avatar>
            </IconButton>
          </Tooltip>

          <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={handleUserMenuClose}>
            <MenuItem
              onClick={() => {
                handleUserMenuClose()
                router.push("/profile")
              }}
            >
              Mi Perfil
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose()
                router.push("/profile/change-password")
              }}
            >
              Cambiar Contraseña
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
