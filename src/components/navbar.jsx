"use client"

import { useState } from "react"
import { useRootContext } from "@/src/app/context/root"
import { useRouter } from "next/navigation"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material"
import { Menu as MenuIcon, AccountCircle, Dashboard, Settings, Logout, Person } from "@mui/icons-material"
import Image from "next/image"
import { apis } from "@/src/apis"

export default function Navbar() {
  const context = useRootContext()
  const session = context?.session
  const setState = context?.setState

  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Verificar si el contexto está disponible
  if (!context || !setState) {
    console.warn("Navbar: useRootContext no está disponible")
    return null // No renderizar nada si no hay contexto
  }

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await fetch(apis.logout.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      setState.setSession(null)
      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return
    }
    setDrawerOpen(open)
  }

  // Lista de elementos del menú lateral según el rol
  const getMenuItems = () => {
    const items = [{ text: "Dashboard", icon: <Dashboard />, path: "/" }]

    // Agregar elementos según el rol del usuario
    if (session?.rol === "ADMINISTRADOR") {
      items.push({ text: "Configuración", icon: <Settings />, path: "/configuracion" })
      items.push({ text: "Usuarios", icon: <Person />, path: "/usuarios" })
    }

    return items
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {session && (
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Image src="/logo.png" alt="DistriSoft Logo" width={40} height={40} style={{ marginRight: "10px" }} />
            <Typography variant="h6" component="div">
              DistriSoft
            </Typography>
          </Box>

          {session ? (
            <div>
              <Button
                onClick={handleMenu}
                color="inherit"
                startIcon={<Avatar sx={{ width: 32, height: 32 }}>{session.nombre?.charAt(0) || "U"}</Avatar>}
              >
                {session.nombre || "Usuario"}
              </Button>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem
                  onClick={() => {
                    handleClose()
                    router.push("/perfil")
                  }}
                >
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  Mi Perfil
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Button color="inherit" onClick={() => router.push("/auth/login")}>
              Iniciar Sesión
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer lateral */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
            <Image src="/logo.png" alt="DistriSoft Logo" width={40} height={40} style={{ marginRight: "10px" }} />
            <Typography variant="h6">DistriSoft</Typography>
          </Box>
          <Divider />
          <List>
            {getMenuItems().map((item) => (
              <ListItem button key={item.text} onClick={() => router.push(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
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

