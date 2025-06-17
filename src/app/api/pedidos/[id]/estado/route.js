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

// PUT /api/pedidos/[id]/estado - Actualizar estado de un pedido
export async function PUT(request, { params }) {
  let idPedido
  try {
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Extraer y convertir el ID de manera segura
    const paramId = params ? String(params.id || "0") : "0"
    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    console.log(`API: Actualizando estado del pedido con ID ${idPedido}...`)

    const datos = await request.json()
    const { nuevoEstado } = datos

    console.log("API: Datos recibidos:", datos)

    // Validar que se proporcione el nuevo estado
    if (!nuevoEstado) {
      return NextResponse.json({ error: "Se requiere el nuevo estado" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Verificar si el pedido existe y obtener su estado actual CON DETALLES
    const pedidoExistente = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      include: {
        estadoPedido: true,
        cliente: {
          include: {
            persona: true,
          },
        },
        pedidoDetalle: {
          include: {
            producto: {
              include: {
                unidadMedida: true,
              },
            },
          },
        },
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${idPedido} no encontrado`)
      return NextResponse.json(
        { error: `Pedido con ID ${idPedido} no encontrado` },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    const estadoActual = pedidoExistente.idEstadoPedido
    const nuevoEstadoId = Number.parseInt(nuevoEstado)

    console.log(`API: Estado actual: ${estadoActual}, Nuevo estado: ${nuevoEstadoId}`)

    // Validar transiciones de estado permitidas
    const transicionesPermitidas = {
      1: [6], // Pendiente -> Cancelado
      2: [1], // En Proceso -> Pendiente
      3: [4, 5], // Listo para Entrega -> Enviado, Entregado
      4: [5], // Enviado -> Entregado
    }

    if (!transicionesPermitidas[estadoActual] || !transicionesPermitidas[estadoActual].includes(nuevoEstadoId)) {
      const estadosPermitidos = transicionesPermitidas[estadoActual] || []
      return NextResponse.json(
        {
          error: "Transición de estado no permitida",
          mensaje: `No se puede cambiar del estado ${estadoActual} al estado ${nuevoEstadoId}. Estados permitidos: ${estadosPermitidos.join(", ")}`,
        },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Guardar el valor anterior para auditoría
    const valorAnterior = {
      idEstadoPedido: pedidoExistente.idEstadoPedido,
      estadoPedido: pedidoExistente.estadoPedido,
    }

    // INICIAR TRANSACCIÓN para actualizar estado, procesar inventario y facturas
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar el estado del pedido
      const pedidoActualizado = await tx.pedidoCliente.update({
        where: {
          idPedido: idPedido,
        },
        data: {
          idEstadoPedido: nuevoEstadoId,
          updatedAt: new Date(),
        },
        include: {
          estadoPedido: true,
          cliente: {
            include: {
              persona: true,
            },
          },
          usuario: {
            include: {
              persona: true,
            },
          },
        },
      })

      const movimientosInventario = []
      const facturasActualizadas = []

      // ACTUALIZAR ESTADOS DE FACTURAS RELACIONADAS
      if (nuevoEstadoId === 4) {
        // Pedido cambia a "Enviado" → Facturas cambian a "Enviado" (ID 2)
        console.log(`API: Actualizando facturas a estado "Enviado" para pedido ${idPedido}`)

        const facturasContado = await tx.facturaCliente.updateMany({
          where: {
            idPedido,
            esContado: true,
            idEstadoFactuCliente: 1,
            deletedAt: null,
          },
          data: {
            idEstadoFactuCliente: 2,
            updatedAt: new Date(),
          },
        })

        const facturasCredito = await tx.facturaCliente.updateMany({
          where: {
            idPedido,
            esContado: false,
            idEstadoFactuCliente: 1,
            deletedAt: null,
          },
          data: {
            idEstadoFactuCliente: 2,
            updatedAt: new Date(),
          },
        })

        facturasActualizadas.push({
          tipo: "contado",
          cantidad: facturasContado.count,
          estadoAnterior: "Emitida",
          estadoNuevo: "Enviado",
        })

        facturasActualizadas.push({
          tipo: "credito",
          cantidad: facturasCredito.count,
          estadoAnterior: "Emitida",
          estadoNuevo: "Enviado",
        })

        console.log(`API: Facturas actualizadas - Contado: ${facturasContado.count}, Crédito: ${facturasCredito.count}`)
      } else if (nuevoEstadoId === 5) {
        // Pedido cambia a "Entregado" → Facturas cambian a "Cobrado" (ID 3)
        console.log(`API: Actualizando facturas a estado "Cobrado" para pedido ${idPedido}`);
      
        const facturasContado = await tx.facturaCliente.updateMany({
          where: {
            idPedido,
            esContado: true,
            idEstadoFactuCliente: { in: [1, 2] }, // Emitida o Enviada
            deletedAt: null,
          },
          data: {
            idEstadoFactuCliente: 3, // COBRADA
            updatedAt: new Date(),
          },
        });
      
        const facturasCredito = await tx.facturaCliente.updateMany({
          where: {
            idPedido,
            esContado: false,
            idEstadoFactuCliente: { in: [1, 2] }, // Emitida o Enviada
            deletedAt: null,
          },
          data: {
            idEstadoFactuCliente: 3, // COBRADA
            updatedAt: new Date(),
          },
        });
      
        facturasActualizadas.push({
          tipo: "contado",
          cantidad: facturasContado.count,
          estadoAnterior: "Emitida/Enviada",
          estadoNuevo: "Cobrado",
        });
      
        facturasActualizadas.push({
          tipo: "credito",
          cantidad: facturasCredito.count,
          estadoAnterior: "Emitida/Enviada",
          estadoNuevo: "Cobrado",
        });
      
        console.log(`API: Facturas actualizadas - Contado: ${facturasContado.count}, Crédito: ${facturasCredito.count}`);
      }

      // Si el nuevo estado es "Entregado" (ID 5), procesar salidas de inventario
      if (nuevoEstadoId === 5) {
        console.log(`API: Procesando salidas de inventario para pedido ${idPedido}`)

        // Validar stock disponible antes de procesar
        for (const detalle of pedidoExistente.pedidoDetalle) {
          const producto = detalle.producto
          const cantidadRequerida = Number.parseFloat(detalle.cantidad || 0)
          const stockActual = Number.parseFloat(producto.stockActual || 0)

          if (stockActual < cantidadRequerida) {
            throw new Error(
              `Stock insuficiente para el producto "${producto.nombreProducto}". Stock actual: ${stockActual}, Requerido: ${cantidadRequerida}`,
            )
          }
        }

        // Procesar cada producto del pedido
        for (const detalle of pedidoExistente.pedidoDetalle) {
          const producto = detalle.producto
          const cantidadSalida = Number.parseFloat(detalle.cantidad || 0)
          const stockActual = Number.parseFloat(producto.stockActual || 0)
          const nuevoStock = stockActual - cantidadSalida

          console.log(
            `API: Procesando producto ${producto.idProducto}: Stock actual ${stockActual}, Salida ${cantidadSalida}, Nuevo stock ${nuevoStock}`,
          )

          // Actualizar stock del producto
          await tx.producto.update({
            where: { idProducto: producto.idProducto },
            data: {
              stockActual: nuevoStock,
              updatedAt: new Date(),
            },
          })

          // Crear registro de movimiento de inventario
          const movimiento = await tx.inventarioProducto.create({
            data: {
              idProducto: producto.idProducto,
              cantidad: cantidadSalida,
              unidadMedida: producto.unidadMedida?.abreviatura || "Unidad",
              tipoMovimiento: "SALIDA",
              fechaMovimiento: new Date(),
              motivo: `Entrega de pedido #${idPedido}`,
              observacion: `Entrega automática - Cliente: ${pedidoExistente.cliente?.persona?.nombre || "N/A"} ${pedidoExistente.cliente?.persona?.apellido || ""}`,
            },
            include: {
              producto: true,
            },
          })

          movimientosInventario.push({
            producto: producto.nombreProducto,
            cantidad: cantidadSalida,
            stockAnterior: stockActual,
            stockNuevo: nuevoStock,
            movimientoId: movimiento.idInventarioProducto,
          })

          console.log(`API: Movimiento de inventario creado con ID: ${movimiento.idInventarioProducto}`)
        }

        console.log(`API: Se procesaron ${movimientosInventario.length} movimientos de inventario`)
      }

      return {
        pedidoActualizado,
        movimientosInventario,
        facturasActualizadas,
      }
    })

    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar auditoría del pedido
    
      await auditoriaService.registrarActualizacion(
        "PedidoCliente",
        idPedido,
        valorAnterior,
        {
          pedido: resultado.pedido,
          detalles: resultado.detalles,
        },
        idUsuario,
        direccionIP,
        navegador
      )

    // Registrar auditoría específica para facturas actualizadas
    for (const facturaInfo of resultado.facturasActualizadas) {
      if (facturaInfo.cantidad > 0 && idUsuario) {
        await auditoriaService.registrarActualizacion({
          entidad: facturaInfo.tipo === "contado" ? "FacturaClienteContado" : "FacturaClienteCredito",
          idRegistro: `pedido-${idPedido}`,
          accion: "CAMBIO_ESTADO_AUTOMATICO",
          valorAnterior: {
            estadoAnterior: facturaInfo.estadoAnterior,
          },
          valorNuevo: {
            estadoNuevo: facturaInfo.estadoNuevo,
            cantidadFacturas: facturaInfo.cantidad,
            motivoCambio: `Cambio automático por estado de pedido: ${resultado.pedidoActualizado.estadoPedido.descEstadoPedido}`,
          },
          idUsuario,
          direccionIP: auditoriaService.obtenerDireccionIP(request),
          navegador: auditoriaService.obtenerInfoNavegador(request),
        })
      }
    }

    console.log(`API: Estado del pedido ${idPedido} actualizado correctamente`)

    // Preparar respuesta
    const respuesta = {
      mensaje: "Estado del pedido actualizado exitosamente",
      pedido: resultado.pedidoActualizado,
      estadoAnterior: valorAnterior.idEstadoPedido,
      estadoNuevo: resultado.pedidoActualizado.idEstadoPedido,
    }

    // Incluir información de facturas actualizadas
    if (resultado.facturasActualizadas.length > 0) {
      const facturasConCambios = resultado.facturasActualizadas.filter((f) => f.cantidad > 0)
      if (facturasConCambios.length > 0) {
        respuesta.facturasActualizadas = facturasConCambios
        const totalFacturas = facturasConCambios.reduce((sum, f) => sum + f.cantidad, 0)
        respuesta.mensaje += ` y se actualizaron ${totalFacturas} factura(s) relacionada(s)`
      }
    }

    // Incluir información de movimientos si se procesaron
    if (resultado.movimientosInventario.length > 0) {
      respuesta.movimientosInventario = resultado.movimientosInventario
      respuesta.mensaje += ` y se registraron ${resultado.movimientosInventario.length} movimientos de inventario`
    }

    return NextResponse.json(respuesta, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error(`API: Error al actualizar estado del pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}

// GET /api/pedidos/[id]/estado - Obtener estados disponibles para un pedido
export async function GET(request, { params }) {
  let idPedido
  try {
    // Extraer y convertir el ID de manera segura
    const paramId = params ? String(params.id || "0") : "0"
    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    console.log(`API: Obteniendo estados disponibles para pedido con ID ${idPedido}...`)

    // Verificar si el pedido existe
    const pedidoExistente = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      include: {
        estadoPedido: true,
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${idPedido} no encontrado`)
      return NextResponse.json(
        { error: `Pedido con ID ${idPedido} no encontrado` },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    const estadoActual = pedidoExistente.idEstadoPedido

    // Definir transiciones permitidas
    const transicionesPermitidas = {
      1: [6], // Pendiente -> Cancelado
      2: [1], // En Proceso -> Pendiente
      3: [4, 5], // Listo para Entrega -> Enviado, Entregado
      4: [5], // Enviado -> Entregado
    }

    const estadosPermitidos = transicionesPermitidas[estadoActual] || []

    // Obtener información de los estados permitidos
    const estadosDisponibles = await prisma.estadoPedido.findMany({
      where: {
        idEstadoPedido: {
          in: estadosPermitidos,
        },
      },
      orderBy: {
        idEstadoPedido: "asc",
      },
    })

    console.log(`API: Estados disponibles para pedido ${idPedido}:`, estadosDisponibles)
    return NextResponse.json({
      estadoActual: pedidoExistente.estadoPedido,
      estadosDisponibles: estadosDisponibles,
    })
  } catch (error) {
    console.error(`API: Error al obtener estados disponibles para pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}
