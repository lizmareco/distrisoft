import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@/settings"

const prisma = new PrismaClient()

// Función para verificar JWT basada en tu implementación actual
async function verifyJWT(token) {
  if (!token) {
    throw new Error("Token no proporcionado")
  }

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado en las variables de entorno")
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET)

    // Verificar si el token existe en la base de datos y es válido
    const tokenRecord = await prisma.accessToken.findFirst({
      where: {
        accessToken: token,
        deletedAt: null,
      },
    })

    if (!tokenRecord && process.env.NODE_ENV !== "development") {
      throw new Error("Token no encontrado en base de datos")
    }

    return decoded
  } catch (error) {
    console.error("Error al verificar JWT:", error.message)
    throw new Error("Token inválido o expirado")
  }
}

// GET: Obtener reporte de inventario agrupado por materia prima
export async function GET(request) {
  try {
    // Verificar autenticación
    const token = request.headers.get("authorization")?.split(" ")[1] || ""
    try {
      await verifyJWT(token)
    } catch (error) {
      console.error("Error de autenticación:", error)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("API Inventario - Generando reporte de inventario")

    // Verificar si la tabla inventario existe
    try {
      // Intentar consultar directamente con SQL raw para verificar si la tabla existe
      const tablesResult = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Inventario'
        );
      `

      const tableExists = tablesResult[0].exists

      if (!tableExists) {
        console.error("La tabla 'Inventario' no existe en la base de datos")
        return NextResponse.json(
          {
            error:
              "La tabla de inventario no existe en la base de datos. Por favor, ejecuta las migraciones necesarias.",
            tableCheck: tablesResult,
          },
          { status: 500 },
        )
      }

      console.log("Verificación de tabla Inventario:", tableExists ? "EXISTE" : "NO EXISTE")
    } catch (tableCheckError) {
      console.error("Error al verificar la existencia de la tabla:", tableCheckError)
    }

    // Intentar obtener los datos usando SQL raw con los nombres correctos de las tablas
    let inventarioRegistros = []
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          i.id_inventario, i.id_materia_prima, i.cantidad, i.unidad_medida, 
          i.fecha_ingreso, i.id_orden_compra, i.observacion, i.created_at, i.updated_at,
          mp.nombre_materia_prima, mp.desc_materia_prima,
          oc.numero_orden_compra
        FROM "Inventario" i
        LEFT JOIN "MateriaPrima" mp ON i.id_materia_prima = mp.id_materia_prima
        LEFT JOIN orden_compra oc ON i.id_orden_compra = oc.id_orden_compra
        WHERE i.deleted_at IS NULL
        ORDER BY i.fecha_ingreso DESC
      `

      // Transformar el resultado
      inventarioRegistros = result.map((row) => ({
        idInventario: row.id_inventario,
        idMateriaPrima: row.id_materia_prima,
        cantidad: row.cantidad,
        unidadMedida: row.unidad_medida,
        fechaIngreso: row.fecha_ingreso,
        idOrdenCompra: row.id_orden_compra,
        observacion: row.observacion,
        materiaPrima: {
          idMateriaPrima: row.id_materia_prima,
          nombreMateriaPrima: row.nombre_materia_prima,
          descMateriaPrima: row.desc_materia_prima,
        },
        ordenCompra: row.id_orden_compra
          ? {
              idOrdenCompra: row.id_orden_compra,
            }
          : null,
      }))
    } catch (sqlError) {
      console.error("Error al ejecutar SQL para reporte:", sqlError)

      // Intentar con Prisma como fallback
      try {
        console.log("Intentando consulta con Prisma como fallback...")
        inventarioRegistros = await prisma.inventario.findMany({
          where: {
            deletedAt: null,
          },
          include: {
            materiaPrima: true,
            ordenCompra: true,
          },
          orderBy: {
            fechaIngreso: "desc",
          },
        })
      } catch (prismaError) {
        console.error("Error en consulta fallback de Prisma:", prismaError)
        throw sqlError // Lanzar el error original
      }
    }

    // Agrupar por materia prima
    const inventarioPorMateriaPrima = {}

    for (const registro of inventarioRegistros) {
      const idMateriaPrima = registro.idMateriaPrima

      if (!inventarioPorMateriaPrima[idMateriaPrima]) {
        inventarioPorMateriaPrima[idMateriaPrima] = {
          materiaPrima: registro.materiaPrima,
          cantidadTotal: 0,
          unidadMedida: registro.unidadMedida,
          registros: [],
        }
      }

      // Sumar a la cantidad total
      inventarioPorMateriaPrima[idMateriaPrima].cantidadTotal += Number.parseFloat(registro.cantidad)

      // Añadir el registro
      inventarioPorMateriaPrima[idMateriaPrima].registros.push(registro)
    }

    // Convertir a array para la respuesta
    const reporte = Object.values(inventarioPorMateriaPrima)

    console.log(`API Inventario - Reporte generado con ${reporte.length} materias primas`)
    return NextResponse.json(reporte)
  } catch (error) {
    console.error("Error al generar reporte de inventario:", error)
    return NextResponse.json(
      { error: "Error al generar reporte de inventario", details: error.message },
      { status: 500 },
    )
  }
}
