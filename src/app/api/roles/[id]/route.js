import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()
const auditoriaService = new AuditoriaService()

// GET /api/roles/[id] - Obtener un rol específico
export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo rol con ID: ${id}`)

    const rol = await prisma.rol.findUnique({
      where: {
        idRol: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        rolPermiso: {
          where: {
            deletedAt: null,
          },
          include: {
            permiso: true,
          },
        },
      },
    })

    if (!rol) {
      return NextResponse.json({ message: "Rol no encontrado" }, { status: 404 })
    }

    // Transformar los datos para asegurar que tengan la estructura esperada
    const rolFormateado = {
      idRol: rol.idRol,
      nombreRol: rol.nombreRol,
      permisos: rol.rolPermiso.map((rp) => ({
        idPermiso: rp.permiso.idPermiso,
        nombrePermiso: rp.permiso.nombrePermiso,
      })),
    }

    console.log(`API: Rol con ID ${id} obtenido correctamente:`, rolFormateado)
    console.log("Permisos del rol:", rolFormateado.permisos)

    return NextResponse.json({ rol: rolFormateado }, { status: 200 })
  } catch (error) {
    console.error(`API: Error al obtener rol:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/roles/[id] - Actualizar un rol
export async function PUT(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Recibida solicitud para actualizar rol con ID: ${id}`)
    const authController = new AuthController()

    // Obtener el usuario autenticado para la auditoría
    let idUsuario = 1 // Valor por defecto para desarrollo
    let userData = null

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userDataResponse = await authController.getUserFromToken(accessToken)
      if (userDataResponse) {
        userData = userDataResponse
        idUsuario = userData.idUsuario
      }
    }

    // Verificar que el usuario tenga rol de administrador
    if (
      process.env.NODE_ENV !== "development" &&
      userData &&
      userData.rol !== "ADMINISTRADOR" &&
      userData.rol !== "ADMINISTRADOR_SISTEMA"
    ) {
      return NextResponse.json({ message: "No tienes permisos para actualizar roles" }, { status: 403 })
    }

    const datos = await request.json()
    console.log("API: Datos recibidos para actualizar rol:", datos)

    // Validar datos
    if (!datos.nombreRol) {
      return NextResponse.json({ error: "El nombre del rol es obligatorio" }, { status: 400 })
    }

    // Verificar si el rol existe
    const rolExistente = await prisma.rol.findUnique({
      where: {
        idRol: Number(id),
        deletedAt: null,
      },
      include: {
        rolPermiso: {
          include: {
            permiso: true,
          },
        },
      },
    })

    if (!rolExistente) {
      return NextResponse.json({ message: "Rol no encontrado" }, { status: 404 })
    }

    // Verificar si ya existe otro rol con el mismo nombre
    const rolConMismoNombre = await prisma.rol.findFirst({
      where: {
        nombreRol: datos.nombreRol,
        idRol: { not: Number(id) },
        deletedAt: null,
      },
    })

    if (rolConMismoNombre) {
      return NextResponse.json({ error: "Ya existe otro rol con este nombre" }, { status: 400 })
    }

    // Actualizar el rol
    const rolActualizado = await prisma.rol.update({
      where: {
        idRol: Number(id),
      },
      data: {
        nombreRol: datos.nombreRol,
        updatedAt: new Date(),
      },
    })

    // Actualizar permisos
    if (datos.permisos && Array.isArray(datos.permisos)) {
      // Obtener los permisos actuales del rol
      const permisosActuales = rolExistente.rolPermiso.map((rp) => rp.idPermiso)

      // Calcular los permisos a agregar y a eliminar
      const permisosAAgregar = datos.permisos.filter((idPermiso) => !permisosActuales.includes(idPermiso))
      const permisosAEliminar = permisosActuales.filter((idPermiso) => !datos.permisos.includes(idPermiso))

      // Eliminar permisos
      if (permisosAEliminar.length > 0) {
        await prisma.rolPermiso.updateMany({
          where: {
            idRol: Number(id),
            idPermiso: { in: permisosAEliminar },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        })
      }

      // Crear nuevos permisos
      if (permisosAAgregar.length > 0) {
        for (const idPermiso of permisosAAgregar) {
          try {
            await prisma.rolPermiso.create({
              data: {
                idRol: Number(id),
                idPermiso: Number(idPermiso),
              },
            })
          } catch (permisoError) {
            console.error("Error al crear permiso:", permisoError)
            // Manejar el error de manera más específica, por ejemplo, registrando el error
            // o continuando con la siguiente iteración si es posible.
          }
        }
      }
    }

    // Obtener el rol actualizado con sus permisos para la auditoría
    const rolCompletoActualizado = await prisma.rol.findUnique({
      where: {
        idRol: Number(id),
      },
      include: {
        rolPermiso: {
          where: {
            deletedAt: null,
          },
          include: {
            permiso: true,
          },
        },
      },
    })

    // Registrar la acción en auditoría
    try {
      await auditoriaService.registrarActualizacion("Rol", id, rolExistente, rolCompletoActualizado, idUsuario, request)
    } catch (auditoriaError) {
      console.error("Error al registrar auditoría:", auditoriaError)
      // No interrumpimos el flujo por un error de auditoría
    }

    console.log(`API: Rol con ID ${id} actualizado correctamente`)
    return NextResponse.json(
      {
        mensaje: "Rol actualizado exitosamente",
        rol: rolActualizado,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`API: Error al actualizar rol:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/roles/[id] - Eliminar un rol
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando rol con ID: ${id}`)
    const authController = new AuthController()

    // Obtener el usuario autenticado para la auditoría
    let idUsuario = 1 // Valor por defecto para desarrollo
    let userData = null

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userDataResponse = await authController.getUserFromToken(accessToken)
      if (userDataResponse) {
        userData = userDataResponse
        idUsuario = userData.idUsuario
      }
    }

    // Verificar que el usuario tenga rol de administrador
    if (
      process.env.NODE_ENV !== "development" &&
      userData &&
      userData.rol !== "ADMINISTRADOR" &&
      userData.rol !== "ADMINISTRADOR_SISTEMA"
    ) {
      return NextResponse.json({ message: "No tienes permisos para eliminar roles" }, { status: 403 })
    }

    // Obtener el rol actual para auditoría
    const rolAnterior = await prisma.rol.findUnique({
      where: {
        idRol: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!rolAnterior) {
      return NextResponse.json({ message: "Rol no encontrado" }, { status: 404 })
    }

    // Eliminar el rol (soft delete)
    await prisma.rol.update({
      where: {
        idRol: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion("Rol", id, rolAnterior, idUsuario, request)

    console.log(`API: Rol con ID ${id} eliminado correctamente`)
    return NextResponse.json({ message: "Rol eliminado correctamente" }, { status: 200 })
  } catch (error) {
    console.error("API: Error al eliminar rol:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

