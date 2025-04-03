"use client"

import { useState } from "react"
import {
  Badge,
  IconButton,
  Menu,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Tooltip,
} from "@mui/material"
import { Notifications, NotificationsActive, AccessTime } from "@mui/icons-material"
import { useRouter } from "next/navigation"

export default function NotificationBell() {
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState(null)

  // Datos estáticos - una sola notificación de vencimiento de contraseña
  const notifications = [
    {
      id: 1,
      message: "Tu contraseña vencerá en 10 días. Por favor, cámbiala para evitar el bloqueo de tu cuenta.",
      date: new Date().toLocaleString(),
      read: false,
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleChangePassword = () => {
    router.push("/profile/change-password")
    handleClose()
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton color="inherit" onClick={handleClick}>
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Notificaciones</Typography>
        </Box>

        <Divider />

        <List sx={{ p: 0 }}>
          {notifications.map((notification) => (
            <ListItem
              key={notification.id}
              sx={{
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            >
              <Box sx={{ mr: 1.5 }}>
                <AccessTime color="warning" />
              </Box>
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {notification.message}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {notification.date}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ p: 2 }}>
          <Button variant="contained" color="primary" fullWidth onClick={handleChangePassword}>
            Cambiar Contraseña
          </Button>
        </Box>
      </Menu>
    </>
  )
}

