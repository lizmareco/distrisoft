"use client"

import { useEffect, useState } from "react"
import { CircularProgress, Box, Typography, Button } from "@mui/material"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Verificar si hay datos de autenticación en localStorage
    const checkAuth = () => {
      const accessToken = localStorage.getItem("accessToken")
      const user = localStorage.getItem("user")

      console.log("Verificando autenticación en HomePage:", {
        accessTokenExists: !!accessToken,
        userExists: !!user,
      })

      if (accessToken && user) {
        setIsAuthenticated(true)
        // Redirigir directamente a dashboard
        window.location.href = "/dashboard"
      } else {
        setIsAuthenticated(false)
        // Redirigir a login
        window.location.href = "/auth/login"
      }
    }

    // Pequeño retraso para asegurar que el componente esté montado
    const timer = setTimeout(() => {
      checkAuth()
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Verificando autenticación...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}
    >
      <Typography variant="h5" gutterBottom>
        {isAuthenticated ? "Redirigiendo al dashboard..." : "No has iniciado sesión"}
      </Typography>
      {!isAuthenticated && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => (window.location.href = "/auth/login")}
          sx={{ mt: 2 }}
        >
          Ir a la página de login
        </Button>
      )}
    </Box>
  )
}

