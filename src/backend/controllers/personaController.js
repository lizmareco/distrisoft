import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const personaController = {
  // Obtener todas las personas
  obtenerPersonas: async () => {
    try {
      const personas = await prisma.persona.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          apellido: "asc",
        },
      })
      return { personas }
    } catch (error) {
      console.error("Error en el controlador al obtener personas:", error)
      throw new Error("Error al obtener personas")
    }
  },

  // Buscar personas
  buscarPersonas: async (termino) => {
    try {
      if (!termino || termino.trim() === "") {
        return await personaController.obtenerPersonas()
      }

      const personas = await prisma.persona.findMany({
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
      return { personas }
    } catch (error) {
      console.error(`Error en el controlador al buscar personas con término "${termino}":`, error)
      throw new Error("Error al buscar personas")
    }
  },

  // Obtener una persona por ID
  obtenerPersonaPorId: async (id) => {
    try {
      const persona = await prisma.persona.findUnique({
        where: {
          idPersona: Number.parseInt(id),
          deletedAt: null,
        },
        include: {
          usuario: true,
        },
      })

      if (!persona) {
        throw new Error(`Persona con ID ${id} no encontrada`)
      }

      return { persona }
    } catch (error) {
      console.error(`Error en el controlador al obtener persona con ID ${id}:`, error)
      throw new Error(`Error al obtener persona con ID ${id}`)
    }
  },
}

