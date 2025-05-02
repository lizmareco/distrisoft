import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/productos - Obtener todos los productos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get("busqueda") || ""

    console.log("API productos: Obteniendo productos...", busqueda ? `Búsqueda: ${busqueda}` : "")

    let whereClause = {
      deletedAt: null,
    }

    if (busqueda) {
      whereClause = {
        ...whereClause,
        OR: [
          { nombreProducto: { contains: busqueda, mode: "insensitive" } },
          { codigo: { contains: busqueda, mode: "insensitive" } },
          { descripcion: { contains: busqueda, mode: "insensitive" } },
        ],
      }
    }

    const productos = await prisma.producto.findMany({
      where: whereClause,
      orderBy: {
        nombreProducto: "asc",
      },
    })

    console.log(`API productos: Se encontraron ${productos.length} productos`)

    // Imprimir el primer producto para depuración si existe
    if (productos.length > 0) {
      console.log("API productos: Ejemplo del primer producto:", JSON.stringify(productos[0], null, 2))
    } else {
      console.log("API productos: No se encontraron productos")
    }

    return NextResponse.json({ productos }, { status: 200 })
  } catch (error) {
    console.error("API productos: Error al obtener productos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
