import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const authController = new AuthController()
const auditoriaService = new AuditoriaService()

// POST - Registrar consumo de materias primas para producción
export async function POST(request) {
  try {
    console.log("API: Registrando consumo de materias primas para producción")

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userData = token ? await authController.getUserFromToken(token) : { idUsuario: 1, usuario: "desarrollo" }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()

    if (!data.idOrdenProduccion || !data.materiales || !data.materiales.length) {
      return NextResponse.json(
        {
          error: "Datos incompletos",
          details: "Se requiere idOrdenProduccion y al menos un material",
        },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que la orden de producción existe
    const ordenProduccion = await prisma.ordenProduccion.findUnique({
      where: { idOrdenProduccion: data.idOrdenProduccion, deletedAt: null },
    })

    if (!ordenProduccion) {
      return NextResponse.json({ error: "Orden de producción no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Iniciar transacción para procesar todos los materiales
    const resultados = await prisma.$transaction(async (tx) => {
      const resultadosMateriales = []

      for (const material of data.materiales) {
        if (!material.idMateriaPrima || !material.cantidad) {
          throw new Error(`Datos incompletos para material: ${JSON.stringify(material)}`)
        }

        // Verificar que la materia prima existe
        const materiaPrima = await tx.materiaPrima.findUnique({
          where: { idMateriaPrima: material.idMateriaPrima, deletedAt: null },
        })

        if (!materiaPrima) {
          throw new Error(`Materia prima no encontrada: ID ${material.idMateriaPrima}`)
        }

        // Verificar stock suficiente
        const stockActual = Number.parseFloat(materiaPrima.stockActual || 0)
        const cantidadConsumo = Number.parseFloat(material.cantidad)

        if (stockActual < cantidadConsumo) {
          throw new Error(
            `Stock insuficiente para materia prima ${materiaPrima.nombreMateriaPrima}. Disponible: ${stockActual}, Requerido: ${cantidadConsumo}`,
          )
        }

        // Actualizar stock de la materia prima (restar)
        const nuevoStock = stockActual - cantidadConsumo
        const materiaPrimaActualizada = await tx.materiaPrima.update({
          where: { idMateriaPrima: material.idMateriaPrima },
          data: {
            stockActual: nuevoStock,
            updatedAt: new Date(),
          },
        })

        // Crear registro de movimiento en inventario (SALIDA)
        const movimiento = await tx.inventario.create({
          data: {
            idMateriaPrima: material.idMateriaPrima,
            cantidad: cantidadConsumo,
            unidadMedida: material.unidadMedida || materiaPrima.unidadMedida || "Unidad",
            tipoMovimiento: "SALIDA",
            fechaMovimiento: new Date(),
            idOrdenCompra: null, // No está asociado a una orden de compra
            motivo: `Consumo para producción: Orden #${data.idOrdenProduccion}`,
            observacion: material.observacion || data.observacion || null,
          },
        })

        resultadosMateriales.push({
          materiaPrima: materiaPrimaActualizada,
          movimiento,
          stockAnterior: stockActual,
          stockNuevo: nuevoStock,
        })
      }

      return resultadosMateriales
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion(
      "ConsumoProduccion",
      data.idOrdenProduccion,
      {
        idOrdenProduccion: data.idOrdenProduccion,
        materiales: resultados.map((r) => ({
          idMateriaPrima: r.materiaPrima.idMateriaPrima,
          nombreMateriaPrima: r.materiaPrima.nombreMateriaPrima,
          cantidad: r.movimiento.cantidad,
          stockAnterior: r.stockAnterior,
          stockNuevo: r.stockNuevo,
        })),
      },
      userData.idUsuario,
      request,
    )

    console.log(`API: Consumo de materias primas registrado para orden de producción: ${data.idOrdenProduccion}`)
    return NextResponse.json(
      {
        mensaje: "Consumo de materias primas registrado correctamente",
        resultados,
      },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al registrar consumo de materias primas:", error)
    return NextResponse.json(
      { message: "Error al registrar consumo de materias primas", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
