"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material"
import { Menu as MenuIcon, Dashboard, Person, LockReset, Logout } from "@mui/icons-material"
import Link from "next/link"

// Importar el componente de notificaciones
import NotificationBell from "./notification-bell"

export default function Navbar() {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)

  // Datos estáticos del usuario
  const userData = {
    nombre: "Usuario",
    apellido: "Prueba",
    rol: "Administrador",
  }

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return
    }
    setDrawerOpen(open)
  }

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  // Función para cerrar sesión
  const handleLogout = () => {
    handleUserMenuClose()
    // Simular cierre de sesión
    alert("Sesión cerrada")
    router.push("/auth/login")
  }

  // Lista de elementos del menú lateral
  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/" },
    { text: "Perfil", icon: <Person />, path: "/profile" },
    { text: "Cambiar Contraseña", icon: <LockReset />, path: "/profile/change-password" },
  ]

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DistriSoft
          </Typography>

          {/* Área de notificaciones y perfil */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <NotificationBell />

            <Tooltip title="Perfil de usuario">
              <IconButton color="inherit" onClick={handleUserMenuOpen}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.dark" }}>{userData.nombre.charAt(0)}</Avatar>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={handleUserMenuClose}>
              <MenuItem disabled>
                <Typography variant="subtitle1">
                  {userData.nombre} {userData.apellido}
                </Typography>
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={() => {
                  handleUserMenuClose()
                  router.push("/profile/change-password")
                }}
              >
                <ListItemIcon>
                  <LockReset fontSize="small" />
                </ListItemIcon>
                Cambiar Contraseña
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer lateral */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          <List>
            <ListItem>
              <Typography variant="h6">DistriSoft</Typography>
            </ListItem>
            <Divider />

            {menuItems.map((item) => (
              <ListItem button key={item.text} component={Link} href={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}

            <Divider />

            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  )
}

