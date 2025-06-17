import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import cookie from "cookie" 
import { ajustarStockProducto } from "@/src/lib/api/ajustarStockProducto";


async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  // Leer la cookie "at" del header (para Next.js App Router y API routes modernas)
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader)
    token = cookies.at
  }

  // Fallback: Authorization header (Bearer)
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }

  if (!token) {
    console.warn("NO TOKEN FOUND, defaulting to 1")
    return 1
  }

  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}

// PUT - Actualizar el estado de una orden de producción
export async function PUT(request, { params }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json(
        { error: "ID de orden de producción no proporcionado" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    console.log(`API: Actualizando estado de orden de producción ID: ${id}`)

    // Verificar autenticación
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()
    if (!data.idEstadoOrdenProd) {
      return NextResponse.json(
        { error: "Datos incompletos", details: "Se requiere idEstadoOrdenProd" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que la orden de producción existe
    const ordenExistente = await prisma.ordenProduccion.findUnique({
      where: { idOrdenProduccion: Number.parseInt(id), deletedAt: null },
      include: {
        estadoOrdenProd: true,
        pedidoCliente: {
          include: {
            pedidoDetalle: {
              include: {
                producto: {
                  include: { unidadMedida: true },
                },
              },
            },
          },
        },
      },
    })

    if (!ordenExistente) {
      return NextResponse.json({ error: "Orden de producción no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si hay un cambio real de estado
    if (ordenExistente.idEstadoOrdenProd === data.idEstadoOrdenProd) {
      return NextResponse.json(
        { message: "La orden ya tiene ese estado", orden: ordenExistente },
        { status: HTTP_STATUS_CODES.ok },
      )
    }

    // Definir los IDs de estado correctos
    const ESTADO_FINALIZADO = 2; // ID para FINALIZADO
    const ESTADO_CANCELADO = 3; // ID para CANCELADO

    // Determinar si el cambio es a FINALIZADO
    const cambioAFinalizado = data.idEstadoOrdenProd === ESTADO_FINALIZADO
    const cambioACancelado = data.idEstadoOrdenProd === ESTADO_CANCELADO

    // Actualizar la orden de producción
    const ordenActualizada = await prisma.ordenProduccion.update({
      where: { idOrdenProduccion: Number.parseInt(id) },
      data: {
        idEstadoOrdenProd: data.idEstadoOrdenProd,
        fechaFinProd: cambioAFinalizado ? new Date() : ordenExistente.fechaFinProd, // Establecer fechaFinProd si se finaliza
        updatedAt: new Date(),
      },
      include: {
        estadoOrdenProd: true,
        pedidoCliente: {
          include: {
            pedidoDetalle: {
              include: {
                producto: {
                  include: { unidadMedida: true },
                },
              },
            },
          },
        },
      },
    })

    const detalles = ordenExistente.pedidoCliente.pedidoDetalle || [];

    // Si se cambió a FINALIZADO, actualizar el inventario con todos los productos
    if (cambioAFinalizado) {
      for (const detalle of detalles) {
        await ajustarStockProducto({
          idProducto: detalle.idProducto,
          cantidad: detalle.cantidad,
          motivo: `Producción finalizada de orden #${id}`,
          observacion: data.observacion || `Producción finalizada según pedido #${ordenExistente.idPedido}`,
          idOrdenProduccion: Number.parseInt(id),
        });
      }
    } else if (cambioACancelado) {
      // Lógica para manejar la cancelación (si es necesario revertir stock, etc.)
      console.log(`API: Orden de producción ${id} cancelada. No se modifica inventario de productos terminados.`)
      // Podrías añadir lógica para reponer stock de materias primas si se habían descontado al crear la orden
      // O para notificar que la producción fue cancelada
    }

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "OrdenProduccion",
      ordenActualizada.idOrdenProduccion,
      ordenExistente,
      ordenActualizada,
      idUsuario,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    console.log(`API: Orden de producción actualizada: ${ordenActualizada.idOrdenProduccion}`)
    return NextResponse.json(ordenActualizada, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al actualizar orden de producción:", error)
    return NextResponse.json(
      { message: "Error al actualizar orden de producción", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
