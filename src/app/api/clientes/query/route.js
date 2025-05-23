import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/clientes/query - Obtener clientes con consulta SQL directa
export async function GET() {
  try {
    console.log("API clientes/query: Obteniendo clientes con consulta SQL directa...")

    // Usar una consulta SQL directa para evitar problemas con el modelo Prisma
    const clientes = await prisma.$queryRaw`
      SELECT 
        c.id_cliente as "idCliente", 
        p.nombre, 
        p.apellido, 
        p.nro_documento as "nroDocumento"
      FROM 
        cliente c
      JOIN 
        persona p ON c.id_persona = p.id_persona
      WHERE 
        c.deleted_at IS NULL
      ORDER BY 
        p.apellido ASC
    `

    console.log(`API clientes/query: Se encontraron ${clientes.length} clientes`)

    // Imprimir el primer cliente para depuración si existe
    if (clientes.length > 0) {
      console.log("API clientes/query: Ejemplo del primer cliente:", JSON.stringify(clientes[0], null, 2))
    } else {
      console.log("API clientes/query: No se encontraron clientes")
    }

    // Devolver en formato { clientes: [...] }
    return NextResponse.json({ clientes }, { status: 200 })
  } catch (error) {
    console.error("API clientes/query: Error al obtener clientes:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
