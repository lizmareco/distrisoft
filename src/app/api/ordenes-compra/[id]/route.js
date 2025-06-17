import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import cookie from "cookie" 

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

// Función para extraer IP del request
function extraerIP(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  let ip = null
  if (cfConnectingIP) ip = cfConnectingIP
  else if (forwarded) ip = forwarded.split(",")[0].trim()
  else if (realIP) ip = realIP
  else ip = "IP no disponible"

  // Convertir IPv6 localhost a IPv4
  if (ip === "::1") ip = "127.0.0.1"
  // Convertir IPv4-mapeado en IPv6 (ejemplo ::ffff:192.168.0.1)
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "")

  return ip
}

// Función para detectar navegador del User-Agent
function detectarNavegador(userAgent) {
  if (!userAgent) return "Navegador no disponible"

  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    const match = userAgent.match(/Chrome\/([0-9.]+)/)
    return `Google Chrome ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Edg")) {
    const match = userAgent.match(/Edg\/([0-9.]+)/)
    return `Microsoft Edge ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/([0-9.]+)/)
    return `Mozilla Firefox ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/([0-9.]+)/)
    return `Safari ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    const match = userAgent.match(/(?:OPR|Opera)\/([0-9.]+)/)
    return `Opera ${match ? match[1] : "versión desconocida"}`
  }

  return "Navegador no identificado"
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo orden de compra con ID: ${id}`)

    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "ID de orden de compra inválido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    const ordenCompra = await prisma.ordenCompra.findUnique({
      where: {
        idOrdenCompra: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            detallesCotizacionProv: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
        estadoOrdenCompra: true,
        inventario: {
          include: {
            materiaPrima: true,
          },
        },
      },
    })

    if (!ordenCompra) {
      return NextResponse.json({ message: "Orden de compra no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    console.log(`API: Orden de compra encontrada: ${ordenCompra.idOrdenCompra}`)
    return NextResponse.json(ordenCompra, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener orden de compra:", error)
    return NextResponse.json(
      { message: "Error al obtener orden de compra", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Actualizando orden de compra con ID: ${id}`)

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "ID de orden de compra inválido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Verificar que la orden de compra existe
    const ordenExistente = await prisma.ordenCompra.findUnique({
      where: {
        idOrdenCompra: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        cotizacionProveedor: {
          include: {
            detallesCotizacionProv: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
        estadoOrdenCompra: true,
      },
    })

    if (!ordenExistente) {
      return NextResponse.json({ message: "Orden de compra no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Obtener datos de la actualización
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idEstadoOrdenCompra) {
      return NextResponse.json(
        { message: "Se requiere el ID del estado de la orden de compra" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar si el estado existe
    const estadoOrdenCompra = await prisma.estadoOrdenCompra.findUnique({
      where: {
        idEstadoOrdenCompra: Number.parseInt(data.idEstadoOrdenCompra),
      },
    })

    if (!estadoOrdenCompra) {
      return NextResponse.json(
        { message: "Estado de orden de compra no encontrado" },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    // Verificar si se está cambiando a estado RECIBIDO
    const cambioARecibido = estadoOrdenCompra.descEstadoOrdenCompra === "RECIBIDO"
    const cambioAParcialmenteRecibido = estadoOrdenCompra.descEstadoOrdenCompra === "PARCIALMENTE RECIBIDO"

    // Añadir log para verificar la detección del cambio de estado
    console.log(
      `API: Cambio de estado detectado - A RECIBIDO: ${cambioARecibido}, A PARCIALMENTE RECIBIDO: ${cambioAParcialmenteRecibido}`,
    )
    console.log(
      `API: Estado actual: ${ordenExistente.estadoOrdenCompra?.descEstadoOrdenCompra}, Nuevo estado: ${estadoOrdenCompra.descEstadoOrdenCompra}`,
    )

    // Preparar datos para actualizar
    const updateData = {
      idEstadoOrdenCompra: Number.parseInt(data.idEstadoOrdenCompra),
      observacion: data.observacion || ordenExistente.observacion,
      updatedAt: new Date(),
    }

    // Actualizar la orden de compra
    const ordenCompraActualizada = await prisma.ordenCompra.update({
      where: {
        idOrdenCompra: Number.parseInt(id),
      },
      data: updateData,
      include: {
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            detallesCotizacionProv: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
        estadoOrdenCompra: true,
        inventario: true,
      },
    })

    // Modificar la condición para verificar si se está cambiando a RECIBIDO
    if (
      cambioARecibido ||
      (data.recepcionItems &&
        data.recepcionItems.length === 0 &&
        estadoOrdenCompra.descEstadoOrdenCompra === "RECIBIDO")
    ) {
      console.log("API: Procesando recepción COMPLETA de orden de compra")

      try {
        // Obtener los detalles de la cotización
        const detalles = ordenExistente.cotizacionProveedor?.detallesCotizacionProv || []
        console.log(`API: Procesando ${detalles.length} detalles de materias primas`)

        if (detalles.length === 0) {
          console.log("API: ADVERTENCIA - No se encontraron detalles de materias primas en la cotización")
        }

        // Obtener los registros de inventario previos para esta orden
        const inventarioPrevio = await prisma.inventario.findMany({
          where: {
            idOrdenCompra: Number.parseInt(id),
          },
        })
        console.log(`API: Inventario previo: ${inventarioPrevio.length} registros`)

        // Para cada detalle, calcular la cantidad pendiente
        for (const detalle of detalles) {
          try {
            if (!detalle.idMateriaPrima) continue
        
            const cantidadRecibida = inventarioPrevio
              .filter((item) => item.idMateriaPrima === detalle.idMateriaPrima)
              .reduce((total, item) => total + Number(item.cantidad || 0), 0)
        
            const cantidadPendiente = Number(detalle.cantidad || 0) - cantidadRecibida
        
            if (cantidadPendiente > 0) {
              const materiaPrima = await prisma.materiaPrima.findUnique({
                where: { idMateriaPrima: detalle.idMateriaPrima },
              })
              const stockAntes = Number(materiaPrima?.stockActual || 0)
              const stockDespues = stockAntes + cantidadPendiente
        
              const nuevoInventario = await prisma.inventario.create({
                data: {
                  idMateriaPrima: detalle.idMateriaPrima,
                  cantidad: cantidadPendiente,
                  unidadMedida: detalle.unidadMedida || "Unidad",
                  fechaMovimiento: new Date(),
                  idOrdenCompra: Number(id),
                  observacion: `Recepción final de orden de compra #${id} (pendiente: ${cantidadPendiente})`,
                  tipoMovimiento: "ENTRADA",
                  stockAntes,
                  stockDespues,
                },
              })
        
              await prisma.materiaPrima.update({
                where: { idMateriaPrima: detalle.idMateriaPrima },
                data: {
                  stockActual: {
                    increment: cantidadPendiente,
                  },
                  updatedAt: new Date(),
                },
              })
            }
          } catch (error) {
            console.error(`Error al procesar materia prima ID ${detalle.idMateriaPrima}:`, error)
          }
        }
      } catch (error) {
        console.error("API: Error al procesar recepción completa:", error)
        throw error // Re-lanzar el error para que se maneje en el bloque catch principal
      }
    }
    // Si se cambió a PARCIALMENTE RECIBIDO y se proporcionaron items, actualizar el inventario con esos items
    else if (cambioAParcialmenteRecibido && data.recepcionItems && data.recepcionItems.length > 0) {
      console.log("API: Actualizando inventario con items parcialmente recibidos")

      // Crear registros de inventario y actualizar stock para cada item recibido
for (const item of data.recepcionItems) {
  try {
    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: { idMateriaPrima: item.idMateriaPrima },
    })
    const stockAntes = Number(materiaPrima?.stockActual || 0)
    const stockDespues = stockAntes + item.cantidad

    // Crear registro en inventario con stockAntes y stockDespues
    const nuevoInventario = await prisma.inventario.create({
      data: {
        idMateriaPrima: item.idMateriaPrima,
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida || "Unidad",
        fechaMovimiento: new Date(),
        idOrdenCompra: Number(id),
        observacion: `Recepción parcial de orden de compra #${id}`,
        tipoMovimiento: "ENTRADA",
        stockAntes,
        stockDespues,
      },
    })

    // Actualizar el stock de la materia prima
    await prisma.materiaPrima.update({
      where: { idMateriaPrima: item.idMateriaPrima },
      data: {
        stockActual: {
          increment: item.cantidad,
        },
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error(`Error al procesar recepción parcial de materia prima ID ${item.idMateriaPrima}:`, error)
  }
}
    }

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)


    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "OrdenCompra",
      Number.parseInt(id),
      ordenExistente,
      ordenCompraActualizada,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Orden de compra actualizada: ${ordenCompraActualizada.idOrdenCompra}`)
    return NextResponse.json(ordenCompraActualizada, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al actualizar orden de compra:", error)
    return NextResponse.json(
      { message: "Error al actualizar orden de compra", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando orden de compra con ID: ${id}`)

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "ID de orden de compra inválido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Verificar que la orden de compra existe
    const ordenExistente = await prisma.ordenCompra.findUnique({
      where: {
        idOrdenCompra: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!ordenExistente) {
      return NextResponse.json({ message: "Orden de compra no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar que la orden de compra está en estado PENDIENTE
    if (ordenExistente.idEstadoOrdenCompra !== 1) {
      return NextResponse.json(
        { message: "Solo se pueden eliminar órdenes de compra en estado PENDIENTE" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Realizar eliminación lógica
    const ordenCompraEliminada = await prisma.ordenCompra.update({
      where: {
        idOrdenCompra: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)


    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion(
      "OrdenCompra",
      Number.parseInt(id),
      ordenExistente,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Orden de compra eliminada: ${ordenCompraEliminada.idOrdenCompra}`)
    return NextResponse.json({ message: "Orden de compra eliminada exitosamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al eliminar orden de compra:", error)
    return NextResponse.json(
      { message: "Error al eliminar orden de compra", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
