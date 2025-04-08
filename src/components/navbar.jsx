"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import { Logout, AdminPanelSettings, History, Security, Dashboard, Menu as MenuIcon, Person } from "@mui/icons-material"


import { useRootContext } from "@/src/app/context/root"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { session, setState } = useRootContext()
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const isAuthPage = pathname.includes("/auth/") || pathname === "/auth"

  // Si estamos en una página de autenticación, no renderizar el Navbar
  if (isAuthPage) {
    return null
  }

  // Load user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      // First check if there's a session in the context
      if (session) {
        try {
          setLoading(true)
          console.log("Navbar: Intentando cargar perfil de usuario desde API")
          const response = await fetch("/api/usuarios/profile", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            console.log("Navbar: Perfil cargado correctamente", data)
            setUserProfile(data)
          } else {
            console.warn("Navbar: Error al cargar perfil:", response.status)
            // Si falla, usar los datos básicos del contexto
            setUserProfile({
              nombreUsuario: session.usuario || session.nombre,
              persona: {
                nombre: session.nombre || "",
                apellido: session.apellido || "",
              },
              rol: session.rol || "",
            })
          }
        } catch (error) {
          console.error("Navbar: Error al cargar perfil:", error)
          // Si hay error, usar los datos básicos del contexto
          setUserProfile({
            nombreUsuario: session.usuario || session.nombre,
            persona: {
              nombre: session.nombre || "",
              apellido: session.apellido || "",
            },
            rol: session.rol || "",
          })
        } finally {
          setLoading(false)
        }
      } else {
        // Si no hay sesión en el contexto, check localStorage
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            console.log("Navbar: Usando datos de usuario desde localStorage", userData)

            // Try to get complete profile data
            const accessToken = localStorage.getItem("accessToken")
            if (accessToken) {
              try {
                const response = await fetch("/api/usuarios/profile", {
                  method: "GET",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                })

                if (response.ok) {
                  const data = await response.json()
                  console.log("Navbar: Perfil actualizado cargado desde API", data)
                  setUserProfile(data)
                } else {
                  console.warn("Navbar: No se pudo cargar perfil completo:", response.status)
                  // Si falla, usar los datos básicos de localStorage
                  setUserProfile({
                    nombreUsuario: userData.nombre,
                    persona: {
                      nombre: userData.nombre,
                      apellido: userData.apellido,
                    },
                    rol: userData.rol,
                  })
                }
              } catch (error) {
                console.error("Navbar: Error al cargar perfil completo:", error)
                // Si hay error, usar los datos básicos de localStorage
                setUserProfile({
                  nombreUsuario: userData.nombre,
                  persona: {
                    nombre: userData.nombre,
                    apellido: userData.apellido,
                  },
                  rol: userData.rol,
                })
              }
            } else {
              // Si no hay token, usar los datos básicos de localStorage
              setUserProfile({
                nombreUsuario: userData.nombre,
                persona: {
                  nombre: userData.nombre,
                  apellido: userData.apellido,
                },
                rol: userData.rol,
              })
            }
          } catch (error) {
            console.error("Navbar: Error al procesar datos de usuario:", error)
          }
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

  const handleLogoutClick = () => {
    handleUserMenuClose()
    setLogoutDialogOpen(true)
  }

  const handleLogoutConfirm = async () => {
    setLogoutDialogOpen(false)

    try {
      // Call the logout API
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Clear localStorage
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")

      // Clear session in context
      if (setState && setState.setSession) {
        setState.setSession(null)
      }

      // Redirect to login
      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out:", error)
      alert("Error al cerrar sesión")
    }
  }

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false)
  }

  const handleNavigate = (path) => {
    handleUserMenuClose()
    setMobileMenuOpen(false)
    router.push(path)
  }

  // Check if user is admin
  const isAdmin = userProfile?.rol === "ADMINISTRADOR_SISTEMA" || session?.rol === "ADMINISTRADOR_SISTEMA"

  // Navigation links (only Dashboard)
  const navLinks = [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard fontSize="small" /> }]

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userProfile?.persona?.nombre) {
      return userProfile.persona.nombre.charAt(0).toUpperCase()
    }
    if (session?.nombre) {
      return session.nombre.charAt(0).toUpperCase()
    }
    return "U"
  }

  const handleLogout = async () => {
    handleUserMenuClose()

    // Mostrar confirmación antes de cerrar sesión
    const confirmar = window.confirm("¿Estás seguro que deseas cerrar sesión?")
    if (!confirmar) {
      return
    }

    try {
      // Mostrar mensaje de carga
      console.log("Cerrando sesión...")

      // Llamar a la API de logout
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      // Limpiar localStorage
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")

      // Limpiar el contexto si está disponible
      if (setState && setState.setSession) {
        setState.setSession(null)
      }

      // Mostrar alerta de éxito
      alert("Sesión cerrada exitosamente")

      // Redirigir al login usando window.location para forzar recarga completa
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      alert("Error al cerrar sesión: " + error.message)
    }
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <IconButton color="inherit" edge="start" onClick={() => router.push("/dashboard")} sx={{ mr: 2 }}>
            <Dashboard />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            DistriSoft
          </Typography>

          {/* Desktop navigation links */}
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

        {/* Mobile menu button */}
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={toggleMobileMenu} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ display: "flex", alignItems: "center" }}>
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
                <Person fontSize="small" />
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
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Cerrar Sesión</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Mobile side menu */}
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
              <ListItem button key="/admin/auditoria" onClick={() => handleNavigate("/admin/auditoria")}>
                <ListItemIcon>
                  <History />
                </ListItemIcon>
                <ListItemText primary="Auditoría" />
              </ListItem>
              <ListItem button key="/admin" onClick={() => handleNavigate("/admin")}>
                <ListItemIcon>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText primary="Administración" />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>

      {/* Logout confirmation dialog */}
      <Dialog open={logoutDialogOpen} onClose={handleLogoutCancel}>
        <DialogTitle>Confirmar cierre de sesión</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro que deseas cerrar sesión?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained">
            Cerrar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  )
}

