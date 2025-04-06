"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material"
import { People, Inventory, Home, Menu as MenuIcon } from "@mui/icons-material"

export default function GestionNavbar() {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [menuAnchor, setMenuAnchor] = useState(null)

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const navigateTo = (path) => {
    handleMenuClose()
    router.push(path)
  }

  return (
    <AppBar position="static" color="primary" sx={{ mb: 3 }}>
      <Container maxWidth="xl">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DistriSoft - Gestión
          </Typography>

          {isMobile ? (
            <>
              <IconButton color="inherit" edge="end" onClick={handleMenuOpen}>
                <MenuIcon />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                <MenuItem onClick={() => navigateTo("/")}>
                  <Home sx={{ mr: 1 }} /> Inicio
                </MenuItem>
                <MenuItem onClick={() => navigateTo("/gestion")}>
                  <People sx={{ mr: 1 }} /> Personas y Empresas
                </MenuItem>
                <MenuItem onClick={() => navigateTo("/gestion-productos")}>
                  <Inventory sx={{ mr: 1 }} /> Productos
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button color="inherit" startIcon={<Home />} onClick={() => navigateTo("/")}>
                Inicio
              </Button>
              <Button color="inherit" startIcon={<People />} onClick={() => navigateTo("/gestion")}>
                Personas y Empresas
              </Button>
              <Button color="inherit" startIcon={<Inventory />} onClick={() => navigateTo("/gestion-productos")}>
                Productos
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  )
}

