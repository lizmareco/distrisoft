"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Divider,
  ListItemIcon,
  Button,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material"
import { Logout, AdminPanelSettings, History, Security, Dashboard, Menu as MenuIcon } from "@mui/icons-material"

// Importar el componente de notificaciones
import NotificationBell from "./notification-bell"
import { useRootContext } from "@/src/app/context/root"

export default function Navbar() {
  const router = useRouter()
  const { session } = useRootContext()
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  // Cargar datos del perfil del usuario
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session) {
        try {
          setLoading(true)
          const response = await fetch("/api/usuarios/profile", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            setUserProfile(data)
          }
        } catch (error) {
          console.error("Error al cargar perfil:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserProfile()
  }, [session])

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleLogout = async () => {
    handleUserMenuClose()

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Mostrar alerta personalizada
      alert("Sesión cerrada exitosamente")

      // Redirigir al login
      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      alert("Error al cerrar sesión")
    }
  }

  const handleNavigate = (path) => {
    handleUserMenuClose()
    setMobileMenuOpen(false)
    router.push(path)
  }

  // Verificar si el usuario es administrador
  const isAdmin = session?.rol === "ADMINISTRADOR_SISTEMA"

  // Enlaces de navegación (solo Dashboard)
  const navLinks = [{ text: "Dashboard", path: "/", icon: <Dashboard fontSize="small" /> }]

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Obtener las iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (userProfile?.persona?.nombre) {
      return userProfile.persona.nombre.charAt(0).toUpperCase()
    }
    if (session?.nombre) {
      return session.nombre.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <IconButton color="inherit" edge="start" onClick={() => router.push("/")} sx={{ mr: 2 }}>
            <Dashboard />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            DistriSoft
          </Typography>

          {/* Enlaces de navegación para escritorio */}
          {!isMobile && (
            <Box sx={{ display: "flex" }}>
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  color="inherit"
                  startIcon={link.icon}
                  onClick={() => handleNavigate(link.path)}
                  sx={{ mx: 0.5 }}
                >
                  {link.text}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Botón de menú para móviles */}
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={toggleMobileMenu} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <NotificationBell />

          <Tooltip title="Perfil de usuario">
            <IconButton color="inherit" onClick={handleUserMenuOpen}>
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.dark" }}>{getUserInitials()}</Avatar>
              )}
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              elevation: 3,
              sx: { minWidth: 200 },
            }}
          >
            {userProfile && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" noWrap>
                  {`${userProfile.persona.nombre || ""} ${userProfile.persona.apellido || ""}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {userProfile.rol || "Usuario"}
                </Typography>
              </Box>
            )}

            {!userProfile && session && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" noWrap>
                  {`${session.nombre || ""} ${session.apellido || ""}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {session.rol || "Usuario"}
                </Typography>
              </Box>
            )}

            <Divider />

            <MenuItem onClick={() => handleNavigate("/profile")}>
              <ListItemIcon>
                <Dashboard fontSize="small" />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>

            <MenuItem onClick={() => handleNavigate("/profile/change-password")}>
              <ListItemIcon>
                <Security fontSize="small" />
              </ListItemIcon>
              Cambiar Contraseña
            </MenuItem>

            {isAdmin && (
              <>
                <Divider />
                <MenuItem onClick={() => handleNavigate("/admin/auditoria")}>
                  <ListItemIcon>
                    <History fontSize="small" />
                  </ListItemIcon>
                  Auditoría
                </MenuItem>
                <MenuItem onClick={() => handleNavigate("/admin")}>
                  <ListItemIcon>
                    <AdminPanelSettings fontSize="small" />
                  </ListItemIcon>
                  Administración
                </MenuItem>
              </>
            )}

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Menú lateral para móviles */}
      <Drawer anchor="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {navLinks.map((link) => (
              <ListItem button key={link.path} onClick={() => handleNavigate(link.path)}>
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={link.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          {isAdmin && (
            <List>
              <ListItem button onClick={() => handleNavigate("/admin/auditoria")}>
                <ListItemIcon>
                  <History />
                </ListItemIcon>
                <ListItemText primary="Auditoría" />
              </ListItem>
              <ListItem button onClick={() => handleNavigate("/admin")}>
                <ListItemIcon>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText primary="Administración" />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </AppBar>
  )
}

