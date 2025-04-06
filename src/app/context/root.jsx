"use client"

import { createContext, useContext, useState, useEffect } from "react"

const RootContext = createContext(undefined)

// Modify the RootProvider to load data from localStorage at the beginning
export function RootProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isClient, setIsClient] = useState(false)

  // Effect to mark when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Effect to load the session from localStorage when mounting the component
  useEffect(() => {
    if (!isClient) return

    const loadSessionFromStorage = () => {
      try {
        const storedUser = localStorage.getItem("user")
        const accessToken = localStorage.getItem("accessToken")

        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser)
          setSession({
            ...userData,
            token: accessToken,
          })
          console.log("Session loaded from localStorage:", userData)
        }
      } catch (error) {
        console.error("Error loading session from localStorage:", error)
      }
    }

    loadSessionFromStorage()
  }, [isClient])

  // Custom function to set the session
  const setSessionWithStorage = (userData) => {
    setSession(userData)

    // Only run localStorage operations on the client side
    if (typeof window === "undefined") return

    // If there is user data, save it to localStorage
    if (userData) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userData.idUsuario || userData.id,
          nombre: userData.nombre,
          apellido: userData.apellido,
          rol: userData.rol,
        }),
      )

      if (userData.token) {
        localStorage.setItem("accessToken", userData.token)
      }
    } else {
      // If there is no data (logout), clear localStorage
      localStorage.removeItem("user")
      localStorage.removeItem("accessToken")
    }
  }

  // New function to update the user role
  const updateUserRole = (newRole) => {
    if (typeof window === "undefined") return false

    try {
      // Update in localStorage
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        userData.rol = newRole
        localStorage.setItem("user", JSON.stringify(userData))

        // Update the session in the state
        setSession((prevSession) => {
          if (prevSession) {
            return {
              ...prevSession,
              rol: newRole,
            }
          }
          return prevSession
        })

        console.log("Role updated in localStorage and session:", newRole)
        return true
      }
      return false
    } catch (error) {
      console.error("Error updating role:", error)
      return false
    }
  }

  const value = {
    session,
    setState: {
      setSession: setSessionWithStorage,
      updateUserRole,
    },
  }

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

export function useRootContext() {
  const context = useContext(RootContext)
  if (context === undefined) {
    return { session: null, setState: { setSession: () => {} } }
  }
  return context
}

