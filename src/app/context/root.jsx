"use client"

import { createContext, useContext, useState } from "react"

// Crear el contexto
const RootContext = createContext(undefined)

// Proveedor del contexto
export function RootProvider({ children }) {
  const [session, setSession] = useState(null)

  // Valores y funciones que queremos exponer
  const value = {
    session,
    setState: {
      setSession,
    },
  }

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

// Hook personalizado para usar el contexto
export function useRootContext() {
  const context = useContext(RootContext)
  if (context === undefined) {
    console.warn("useRootContext debe ser usado dentro de un RootProvider")
    // Devolver un objeto vacío en lugar de null para evitar errores
    return { session: null, setState: { setSession: () => {} } }
  }
  return context
}





