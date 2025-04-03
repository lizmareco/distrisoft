import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const personaDataSource = {
  // Obtener todas las personas
  obtenerPersonas: async () => {
    try {
      return await prisma.persona.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          apellido: "asc",
        },
      })
    } catch (error) {
      console.error("Error al obtener personas:", error)
      throw new Error("No se pudieron obtener las personas")
    }
  },

  // Obtener una persona por ID
  obtenerPersonaPorId: async (id) => {
    try {
      return await prisma.persona.findUnique({
        where: {
          idPersona: Number.parseInt(id),
          deletedAt: null,
        },
        include: {
          usuario: true,
        },
      })
    } catch (error) {
      console.error(`Error al obtener persona con ID ${id}:`, error)
      throw new Error(`No se pudo encontrar la persona con ID ${id}`)
    }
  },

  // Buscar personas por nombre, apellido o número de documento
  buscarPersonas: async (termino) => {
    try {
      return await prisma.persona.findMany({
        where: {
          OR: [
            { nombre: { contains: termino, mode: "insensitive" } },
            { apellido: { contains: termino, mode: "insensitive" } },
            { nroDocumento: { contains: termino } },
          ],
          deletedAt: null,
        },
        orderBy: {
          apellido: "asc",
        },
      })
    } catch (error) {
      console.error(`Error al buscar personas con término "${termino}":`, error)
      throw new Error("No se pudieron buscar personas")
    }
  },
}

