import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/clientes - Obtener todos los clientes
export async function GET(request) {
  try {
    console.log("Obteniendo clientes...")

    // Verificar si el modelo Cliente (con C mayúscula) existe
    if (prisma.Cliente) {
      const clientes = await prisma.Cliente.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          persona: true,
        },
        orderBy: {
          // Ordenar por la relación persona.apellido
          persona: {
            apellido: "asc",
          },
        },
      })

      console.log(`Se encontraron ${clientes.length} clientes usando el modelo Cliente`)

      // Transformar los datos para tener una estructura más plana
      const clientesTransformados = clientes.map((cliente) => ({
        idCliente: cliente.idCliente,
        idPersona: cliente.idPersona,
        idSectorCliente: cliente.idSectorCliente,
        idEmpresa: cliente.idEmpresa,
        nombre: cliente.persona?.nombre || "",
        apellido: cliente.persona?.apellido || "",
        nroDocumento: cliente.persona?.nroDocumento || "",
      }))

      return NextResponse.json({ clientes: clientesTransformados }, { status: 200 })
    } else {
      // Si el modelo Cliente no existe, intentar con una consulta SQL directa
      console.log("El modelo Cliente no existe, intentando con SQL directo...")

      // Obtener parámetros de búsqueda
      const { searchParams } = new URL(request.url)
      const tipoDocumento = searchParams.get("tipoDocumento")
      const numeroDocumento = searchParams.get("numeroDocumento")

      console.log("Buscando clientes con parámetros:", { tipoDocumento, numeroDocumento })

      // Si se proporcionan parámetros de búsqueda específicos
      if (tipoDocumento && numeroDocumento) {
        // Implementar lógica de búsqueda específica
        // ...
      } else {
        console.log("No se proporcionaron parámetros de búsqueda completos")

        // Usar una consulta SQL directa con el nombre correcto de la tabla
        const clientes = await prisma.$queryRaw`
          SELECT 
            c."idCliente" as "idCliente", 
            c."idPersona" as "idPersona",
            c."idSectorCliente" as "idSectorCliente",
            c."idEmpresa" as "idEmpresa",
            p.nombre, 
            p.apellido, 
            p."nroDocumento" as "nroDocumento"
          FROM 
            "Cliente" c
          JOIN 
            persona p ON c."idPersona" = p."idPersona"
          WHERE 
            c."deletedAt" IS NULL
          ORDER BY 
            p.apellido ASC
        `

        console.log(`Se encontraron ${clientes.length} clientes usando SQL directo`)
        return NextResponse.json({ clientes }, { status: 200 })
      }
    }
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
