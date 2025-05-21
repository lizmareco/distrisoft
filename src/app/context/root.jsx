"use client"

import { createContext, useContext, useState, useEffect } from "react"

const RootContext = createContext(undefined)

// Función segura para decodificar tokens JWT en el cliente
function decodeJWT(token) {
  try {
    // Implementación simple de decodificación de JWT sin verificación de firma
    // (solo para obtener los datos del payload)
    const base64Url = token.split(".")[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Error decodificando token:", error)
    return null
  }
}

export function RootProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Efecto para marcar cuando estamos en el lado del cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Efecto para cargar la sesión desde localStorage al montar el componente
  useEffect(() => {
    if (!isClient) return

    const loadSessionFromStorage = () => {
      try {
        setIsLoading(true)
        const storedUser = localStorage.getItem("user")
        const accessToken = localStorage.getItem("accessToken")

        console.log("Cargando datos de sesión:", {
          storedUser: storedUser ? "Presente" : "No encontrado",
          accessToken: accessToken ? "Presente" : "No encontrado",
        })

        if (accessToken) {
          // Decodificar el token para obtener los datos del usuario
          const decodedToken = decodeJWT(accessToken)

          console.log("Token decodificado:", decodedToken)

          if (decodedToken) {
            // Si tenemos datos almacenados del usuario, los usamos
            const userData = storedUser ? JSON.parse(storedUser) : {}

            // Combinar los datos del token con los datos almacenados
            const sessionData = {
              ...userData,
              idUsuario: decodedToken.idUsuario || userData.idUsuario || userData.id,
              nombre: decodedToken.nombre || userData.nombre,
              apellido: decodedToken.apellido || userData.apellido,
              correo: decodedToken.correo || userData.correo,
              rol: decodedToken.rol || userData.rol,
              usuario: decodedToken.usuario || userData.usuario,
              permisos: decodedToken.permisos || [],
              token: accessToken,
            }

            setSession(sessionData)
            console.log("Sesión cargada correctamente:", sessionData)

            // Actualizar los datos almacenados si es necesario
            if (!storedUser || Object.keys(userData).length === 0) {
              localStorage.setItem(
                "user",
                JSON.stringify({
                  id: sessionData.idUsuario,
                  nombre: sessionData.nombre,
                  apellido: sessionData.apellido,
                  rol: sessionData.rol,
                  usuario: sessionData.usuario,
                  correo: sessionData.correo,
                }),
              )
              console.log("Datos de usuario actualizados en localStorage")
            }
          } else {
            console.warn("No se pudo decodificar el token")
            // Si no podemos decodificar el token pero tenemos datos de usuario, usamos esos
            if (storedUser) {
              const userData = JSON.parse(storedUser)
              setSession({
                ...userData,
                token: accessToken,
              })
              console.log("Usando datos de usuario almacenados:", userData)
            } else {
              console.warn("No hay datos de usuario disponibles")
              // No redirigimos automáticamente, dejamos que la aplicación maneje esto
            }
          }
        } else if (storedUser) {
          // Si no hay token pero hay datos de usuario, podríamos estar en un estado inconsistente
          console.warn("Datos de usuario encontrados pero sin token")
          const userData = JSON.parse(storedUser)
          setSession(userData)
        } else {
          console.log("No se encontró información de sesión")
          // No redirigimos automáticamente, dejamos que la aplicación maneje esto
        }
      } catch (error) {
        console.error("Error cargando sesión desde localStorage:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSessionFromStorage()
  }, [isClient])

  // Función personalizada para establecer la sesión
  const setSessionWithStorage = (userData) => {
    console.log("Estableciendo sesión con datos:", userData)

    // Solo ejecutar operaciones de localStorage en el lado del cliente
    if (typeof window === "undefined") return

    // Si hay datos de usuario, los guardamos en localStorage
    if (userData) {
      setSession(userData)

      const userDataToStore = {
        id: userData.idUsuario || userData.id,
        nombre: userData.nombre,
        apellido: userData.apellido,
        rol: userData.rol,
        usuario: userData.usuario,
        correo: userData.correo,
      }

      localStorage.setItem("user", JSON.stringify(userDataToStore))
      console.log("Datos de usuario guardados en localStorage:", userDataToStore)

      if (userData.token || userData.accessToken) {
        const token = userData.token || userData.accessToken
        localStorage.setItem("accessToken", token)
        console.log("Token guardado en localStorage")
      }
    } else {
      // Si no hay datos (logout), limpiamos localStorage y la sesión
      setSession(null)
      localStorage.removeItem("user")
      localStorage.removeItem("accessToken")
      console.log("Sesión cerrada, datos eliminados de localStorage")
    }
  }

  // Función para actualizar el rol del usuario
  const updateUserRole = (newRole) => {
    if (typeof window === "undefined") return false

    try {
      // Actualizar en localStorage
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        userData.rol = newRole
        localStorage.setItem("user", JSON.stringify(userData))

        // Actualizar la sesión en el estado
        setSession((prevSession) => {
          if (prevSession) {
            return {
              ...prevSession,
              rol: newRole,
            }
          }
          return prevSession
        })

        console.log("Rol actualizado en localStorage y sesión:", newRole)
        return true
      }
      return false
    } catch (error) {
      console.error("Error actualizando rol:", error)
      return false
    }
  }

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    if (!session || !session.permisos) return false

    // Si el usuario tiene el permiso comodín "*", tiene todos los permisos
    if (session.permisos.includes("*")) return true

    // Verificar si el usuario tiene el permiso específico
    return session.permisos.includes(permission)
  }

  // Función para refrescar el token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken")
      if (!refreshToken) {
        console.warn("No hay refresh token disponible")
        return false
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        console.error("Error al refrescar el token:", response.statusText)
        return false
      }

      const data = await response.json()

      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken)

        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken)
        }

        // Actualizar la sesión con el nuevo token
        setSession((prevSession) => {
          if (prevSession) {
            return {
              ...prevSession,
              token: data.accessToken,
            }
          }
          return prevSession
        })

        console.log("Token refrescado correctamente")
        return true
      }

      return false
    } catch (error) {
      console.error("Error en el proceso de refresh token:", error)
      return false
    }
  }

  const value = {
    session,
    isLoading,
    setState: {
      setSession: setSessionWithStorage,
      updateUserRole,
      refreshToken,
    },
    hasPermission,
  }

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>
}

export function useRootContext() {
  const context = useContext(RootContext)
  if (context === undefined) {
    return {
      session: null,
      isLoading: false,
      setState: {
        setSession: () => {},
        updateUserRole: () => false,
        refreshToken: () => Promise.resolve(false),
      },
      hasPermission: () => false,
    }
  }
  return context
}
