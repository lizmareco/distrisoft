"use client"

import { useState } from "react"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    { text: "Inicio", href: "/" },
    { text: "Empresas", href: "/empresas" },
    { text: "Personas", href: "/personas" },
    { text: "Clientes", href: "/clientes" },
  ]

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return
    }
    setDrawerOpen(open)
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { sm: "none" } }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Gestión
          </Typography>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                color="inherit"
                component={Link}
                href={item.href}
                sx={{
                  mx: 1,
                  fontWeight: pathname === item.href ? "bold" : "normal",
                  borderBottom: pathname === item.href ? "2px solid white" : "none",
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} component={Link} href={item.href} selected={pathname === item.href}>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  )
}

