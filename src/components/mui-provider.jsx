"use client"

import { createTheme, ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { useState, useEffect } from "react"

// Crear un tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
})

export default function MUIProvider({ children }) {
  // Estado para controlar si estamos en el cliente
  const [mounted, setMounted] = useState(false)

  // Efecto para actualizar el estado después del montaje
  useEffect(() => {
    setMounted(true)
  }, [])

  // Si no estamos en el cliente, devolvemos un div vacío
  // Esto evita problemas de hidratación con Material UI
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

