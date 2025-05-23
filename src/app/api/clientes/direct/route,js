import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/clientes/direct - Obtener clientes con consulta SQL directa
export async function GET() {
  try {
    console.log("API clientes/direct: Obteniendo clientes con consulta SQL directa...")

    // Usar una consulta SQL directa que coincida exactamente con la estructura de la base de datos
    const clientes = await prisma.$queryRaw`
      SELECT 
        c.id_cliente as "idCliente", 
        c.id_persona as "idPersona",
        c.id_sector_cliente as "idSectorCliente",
        c.id_empresa as "idEmpresa",
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

    console.log(`API clientes/direct: Se encontraron ${clientes.length} clientes`)

    // Imprimir el primer cliente para depuración si existe
    if (clientes.length > 0) {
      console.log("API clientes/direct: Ejemplo del primer cliente:", JSON.stringify(clientes[0], null, 2))
    } else {
      console.log("API clientes/direct: No se encontraron clientes")
    }

    // Devolver en formato { clientes: [...] }
    return NextResponse.json({ clientes }, { status: 200 })
  } catch (error) {
    console.error("API clientes/direct: Error al obtener clientes:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
