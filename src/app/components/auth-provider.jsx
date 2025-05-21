"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useRootContext } from "@/src/app/context/root"
import { CircularProgress, Box, Typography } from "@mui/material"

// Rutas que no requieren autenticación
const publicRoutes = ["/auth/login", "/auth/forgot-password", "/auth/reset-password", "/auth/register"]

export default function AuthProvider({ children }) {
  const { session, isLoading, setState } = useRootContext()
  const router = useRouter()
  const pathname = usePathname()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Si estamos en una ruta pública, no verificamos la autenticación
    if (publicRoutes.includes(pathname)) {
      setIsCheckingAuth(false)
      return
    }

    // Función para verificar la autenticación
    const checkAuth = async () => {
      try {
        // Si ya tenemos una sesión, no necesitamos verificar
        if (session) {
          setIsCheckingAuth(false)
          return
        }

        // Si no hay token, redirigir al login
        const token = localStorage.getItem("accessToken")
        if (!token) {
          console.log("No hay token, redirigiendo al login...")
          router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        // Verificar el token con el servidor
        const response = await fetch("/api/auth/check", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok || !data.authenticated) {
          console.log("Token inválido, intentando refresh token...")

          // Intentar refrescar el token
          const refreshSuccess = await setState.refreshToken()

          if (!refreshSuccess) {
            console.log("No se pudo refrescar el token, redirigiendo al login...")
            router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
            return
          }
        }

        setIsCheckingAuth(false)
      } catch (error) {
        console.error("Error verificando autenticación:", error)
        setIsCheckingAuth(false)

        // En caso de error, redirigir al login
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }

    // Verificar autenticación solo si no estamos cargando la sesión
    if (!isLoading) {
      checkAuth()
    } else {
      // Si aún estamos cargando la sesión, esperamos
      const timer = setTimeout(() => {
        if (isLoading) {
          setIsCheckingAuth(false)
        }
      }, 3000) // Timeout de 3 segundos para evitar esperas infinitas

      return () => clearTimeout(timer)
    }
  }, [pathname, session, isLoading, router, setState])

  // Si estamos en una ruta pública, mostramos el contenido sin verificar
  if (publicRoutes.includes(pathname)) {
    return children
  }

  // Mostrar indicador de carga mientras verificamos la autenticación
  if (isCheckingAuth || isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verificando autenticación...
        </Typography>
      </Box>
    )
  }

  // Si no estamos verificando y no hay sesión, el useEffect se encargará de redirigir
  if (!session) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6">Redirigiendo al login...</Typography>
      </Box>
    )
  }

  // Si hay sesión, mostramos el contenido
  return children
}
