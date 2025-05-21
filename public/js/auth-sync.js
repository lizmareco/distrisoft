// Script para sincronizar el token de autenticación entre pestañas
;(() => {
  // Solo ejecutar en el navegador
  if (typeof window === "undefined") return

  // Función para sincronizar el token entre pestañas
  function syncAuthState(event) {
    if (event.key === "accessToken") {
      console.log("Token de autenticación actualizado en otra pestaña")

      // Si el token se eliminó en otra pestaña, cerrar sesión en esta
      if (!event.newValue) {
        console.log("Token eliminado, cerrando sesión...")
        // Redirigir al login si no estamos ya en la página de login
        if (!window.location.pathname.includes("/auth/login")) {
          window.location.href = "/auth/login"
        }
      }
      // Si el token se actualizó en otra pestaña, actualizar esta pestaña
      else if (event.oldValue !== event.newValue) {
        console.log("Token actualizado, refrescando datos...")
        // Aquí podríamos recargar la página o actualizar el estado de la aplicación
        // Por ahora, simplemente recargamos si estamos en la página de login
        if (window.location.pathname.includes("/auth/login")) {
          window.location.reload()
        }
      }
    }
  }

  // Escuchar cambios en localStorage
  window.addEventListener("storage", syncAuthState)

  // Verificar token al cargar la página
  document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken")
    console.log("Estado de autenticación al cargar:", token ? "Autenticado" : "No autenticado")

    // Si estamos en la página de login y hay un token válido, redirigir al dashboard
    if (window.location.pathname.includes("/auth/login") && token) {
      // Extraer la URL de redirección de los parámetros de consulta
      const urlParams = new URLSearchParams(window.location.search)
      const redirectPath = urlParams.get("redirect") || "/dashboard"

      console.log(`Redirigiendo desde login a: ${redirectPath}`)
      window.location.href = redirectPath
    }
  })
})()
