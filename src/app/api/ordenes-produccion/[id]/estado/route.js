import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { idEstadoOrdenProd } = await request.json()

    if (!idEstadoOrdenProd) {
      return NextResponse.json({ error: "Se requiere el ID del estado" }, { status: 400 })
    }

    const idOrdenInt = Number.parseInt(id)
    const idEstadoInt = Number.parseInt(idEstadoOrdenProd)

    // Obtener la orden actual
    const ordenActual = await prisma.ordenProduccion.findUnique({
      where: { idOrdenProduccion: idOrdenInt },
    })

    if (!ordenActual) {
      return NextResponse.json({ error: "Orden de producción no encontrada" }, { status: 404 })
    }

    // Preparar datos de actualización
    const datosActualizacion = {
      idEstadoOrdenProd: idEstadoInt,
      updatedAt: new Date(),
    }

    // Si cambia a FINALIZADO (estado 2), establecer fecha de fin
    if (idEstadoInt === 2) {
      datosActualizacion.fechaFinProd = new Date()
    }

    // Actualizar la orden
    const ordenActualizada = await prisma.ordenProduccion.update({
      where: { idOrdenProduccion: idOrdenInt },
      data: datosActualizacion,
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarActualizacion(
      "OrdenProduccion",
      idOrdenInt,
      { idEstadoOrdenProd: ordenActual.idEstadoOrdenProd },
      { idEstadoOrdenProd: idEstadoInt, fechaFinProd: datosActualizacion.fechaFinProd },
      1, // TODO: Obtener usuario actual
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      ordenProduccion: ordenActualizada,
      message: "Estado actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
