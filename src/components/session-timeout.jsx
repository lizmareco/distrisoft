"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogActions, DialogTitle } from "@mui/material"
import { Button, Typography, LinearProgress } from "@mui/material"

// Constantes para los tiempos (en milisegundos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000 // 5 minutos
const CHECK_INTERVAL = 1000 // Verificar cada segundo

// URLs de API
const REFRESH_TOKEN_URL = "/api/auth/refresh-token"
const LOGOUT_URL = "/api/auth/logout"

export default function SessionTimeout() {
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(WARNING_BEFORE_TIMEOUT)
  const router = useRouter()

  // Función para renovar la sesión
  const renewSession = useCallback(async () => {
    try {
      const response = await fetch(REFRESH_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Sesión renovada exitosamente
        setLastActivity(Date.now())
        setShowWarning(false)
      } else {
        // Error al renovar la sesión, redirigir al login
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Error al renovar la sesión:", error)
      router.push("/auth/login")
    }
  }, [router])

  // Función para cerrar sesión
  const logout = useCallback(async () => {
    try {
      await fetch(LOGOUT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      router.push("/auth/login")
    }
  }, [router])

  // Actualizar el tiempo de última actividad cuando el usuario interactúa
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
    if (showWarning) {
      renewSession()
    }
  }, [showWarning, renewSession])

  // Verificar inactividad periódicamente
  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    // Registrar eventos para detectar actividad del usuario
    events.forEach((event) => {
      window.addEventListener(event, updateActivity)
    })

    // Verificar inactividad periódicamente
    const intervalId = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity

      // Si ha pasado el tiempo de inactividad, cerrar sesión
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        clearInterval(intervalId)
        logout()
      }
      // Si estamos en el período de advertencia, mostrar el diálogo
      else if (timeSinceLastActivity >= INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT) {
        setShowWarning(true)
        setRemainingTime(INACTIVITY_TIMEOUT - timeSinceLastActivity)
      }
    }, CHECK_INTERVAL)

    // Limpiar eventos y intervalo al desmontar
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
      clearInterval(intervalId)
    }
  }, [lastActivity, updateActivity, logout])

  // Actualizar la cuenta regresiva en el diálogo de advertencia
  useEffect(() => {
    let countdownInterval

    if (showWarning) {
      countdownInterval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            clearInterval(countdownInterval)
            logout()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  }, [showWarning, logout])

  // Formatear el tiempo restante en minutos y segundos
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Calcular el porcentaje de tiempo restante para la barra de progreso
  const progressPercentage = (remainingTime / WARNING_BEFORE_TIMEOUT) * 100

  return (
    <>
      <Dialog open={showWarning} onClose={() => renewSession()} aria-labelledby="session-timeout-dialog">
        <DialogTitle id="session-timeout-dialog">Su sesión está por expirar</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Debido a inactividad, su sesión expirará en {formatTime(remainingTime)}.
          </Typography>
          <LinearProgress variant="determinate" value={progressPercentage} color="warning" sx={{ mt: 2, mb: 2 }} />
          <Typography variant="body2">Haga clic en "Continuar" para mantener su sesión activa.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={logout} color="error">
            Cerrar sesión
          </Button>
          <Button onClick={renewSession} color="primary" variant="contained" autoFocus>
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

