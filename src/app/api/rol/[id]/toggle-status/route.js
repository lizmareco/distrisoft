import RolController from "@/src/backend/controllers/rol-controller"
import { PrismaClient } from "@prisma/client"

const rolController = new RolController()
const prisma = new PrismaClient()

export async function PUT(request, { params }) {
  try {
    const { id } = params

    // Obtener el rol actual para verificar su estado
    const role = await prisma.rol.findUnique({
      where: {
        idRol: Number.parseInt(id),
      },
    })

    if (!role) {
      return new Response(JSON.stringify({ message: "Rol no encontrado" }), { status: 404 })
    }

    // Cambiar el estado: si está eliminado (inhabilitado), lo habilitamos y viceversa
    const updatedRole = await prisma.rol.update({
      where: {
        idRol: Number.parseInt(id),
      },
      data: {
        deletedAt: role.deletedAt ? null : new Date(),
      },
    })

    return new Response(JSON.stringify(updatedRole), { status: 200 })
  } catch (error) {
    console.error(`Error en PUT /api/rol/${params.id}/toggle-status:`, error)
    return new Response(JSON.stringify({ message: "Error al cambiar el estado del rol" }), { status: 500 })
  }
}

