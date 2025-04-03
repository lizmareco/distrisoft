// Funciones para interactuar con la API de roles

export async function fetchRoles() {
  try {
    const response = await fetch("/api/rol")
    if (!response.ok) {
      throw new Error("Error al obtener roles")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en fetchRoles:", error)
    throw error
  }
}

export async function fetchRole(id) {
  try {
    const response = await fetch(`/api/rol/${id}`)
    if (!response.ok) {
      throw new Error("Error al obtener el rol")
    }
    return await response.json()
  } catch (error) {
    console.error("Error en fetchRole:", error)
    throw error
  }
}

// Actualizar la función createRole para que coincida con la estructura esperada por tu API
export async function createRole({ roleData, permissionIds = [] }) {
  try {
    const response = await fetch("/api/rol", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roleData, permissionIds }),
    })

    if (!response.ok) {
      throw new Error("Error al crear el rol")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en createRole:", error)
    throw error
  }
}

// Actualizar la función updateRole para usar PATCH y la estructura correcta
export async function updateRole(id, { roleData, permissionIdsToAdd = [], permissionIdsToRemove = [] }) {
  try {
    const response = await fetch(`/api/rol`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        roleData,
        permissionIdsToAdd,
        permissionIdsToRemove,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al actualizar el rol")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateRole:", error)
    throw error
  }
}

// Actualizar la función deleteRole para enviar el ID en el cuerpo
export async function deleteRole(id) {
  try {
    const response = await fetch(`/api/rol`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      throw new Error("Error al eliminar el rol")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en deleteRole:", error)
    throw error
  }
}

export async function toggleRoleStatus(id) {
  try {
    const response = await fetch(`/api/rol/${id}/toggle-status`, {
      method: "PUT",
    })

    if (!response.ok) {
      throw new Error("Error al cambiar el estado del rol")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en toggleRoleStatus:", error)
    throw error
  }
}

// Actualizar la función updateRolePermissions para usar la estructura correcta
export async function updateRolePermissions(id, { permissionIdsToAdd = [], permissionIdsToRemove = [] }) {
  try {
    const response = await fetch(`/api/rol`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        permissionIdsToAdd,
        permissionIdsToRemove,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al actualizar los permisos del rol")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en updateRolePermissions:", error)
    throw error
  }
}

