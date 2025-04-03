// Funciones para interactuar con la API de permisos

export async function fetchPermissions() {
  try {
    const response = await fetch("/api/permiso")
    if (!response.ok) {
      throw new Error("Error al obtener permisos")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en fetchPermissions:", error)
    throw error
  }
}

