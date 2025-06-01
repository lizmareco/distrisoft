import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const authController = new AuthController()
const auditoriaService = new AuditoriaService()

// GET /api/pedidos/[id] - Obtener un pedido por ID
export async function GET(request, { params }) {
  let idPedido
  try {
    // Await params para Next.js 15
    const resolvedParams = await params

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    let userData = null

    if (process.env.NODE_ENV === "development") {
      if (!token) {
        console.log("Modo desarrollo: Usando token especial de desarrollo")
        userData = {
          idUsuario: 1,
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"],
        }
      } else {
        userData = await authController.getUserFromToken(token)
      }
    } else {
      if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
      }
      userData = await authController.getUserFromToken(token)
    }

    // Extraer y convertir el ID de manera segura
    const paramId = resolvedParams ? String(resolvedParams.id || "0") : "0"
    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    console.log(`API: Obteniendo pedido con ID ${idPedido}...`)

    const pedido = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      select: {
        idPedido: true,
        fechaPedido: true,
        fechaEntrega: true,
        montoTotal: true,
        observacion: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        // Seleccionar solo los campos necesarios del cliente
        cliente: {
          select: {
            idCliente: true,
            // Seleccionar solo los campos necesarios de persona
            persona: {
              select: {
                nombre: true,
                apellido: true,
                nroDocumento: true,
              },
            },
          },
        },
        // Seleccionar solo los campos necesarios del usuario
        usuario: {
          select: {
            idUsuario: true,
            nombreUsuario: true,
            persona: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        // Seleccionar solo los campos necesarios del estado de pedido
        estadoPedido: {
          select: {
            idEstadoPedido: true,
            descEstadoPedido: true,
          },
        },
        // Seleccionar los detalles del pedido con información del producto
        pedidoDetalle: {
          select: {
            idPedido: true,
            idProducto: true,
            cantidad: true, // Esta es la cantidad en UNIDADES (sobres)
            subtotal: true,
            producto: {
              select: {
                idProducto: true,
                nombreProducto: true,
                unidadesPorPaquete: true, // Unidades por paquete
                ventaPorPaquete: true,
                costoPorPaquete: true, // Precio por paquete
                precioUnitario: true, // Precio por unidad individual
              },
            },
          },
        },
      },
    })

    if (!pedido) {
      console.log(`API: Pedido con ID ${idPedido} no encontrado`)
      return NextResponse.json(
        { error: `Pedido con ID ${idPedido} no encontrado` },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    // Función para convertir fecha a string en formato YYYY-MM-DD
    const formatearFechaSimple = (fecha) => {
      if (!fecha) return null
      return fecha.toISOString().split("T")[0]
    }

    // Procesar los detalles del pedido para calcular correctamente
    const detallesProcesados = pedido.pedidoDetalle.map((detalle) => {
      const producto = detalle.producto
      const cantidadUnidades = detalle.cantidad // Cantidad en unidades (sobres)
      const unidadesPorPaquete = producto.unidadesPorPaquete || 1
      const costoPorPaquete = Number(producto.costoPorPaquete) || 0

      // Calcular cuántos paquetes completos se necesitan
      const cantidadPaquetes = Math.ceil(cantidadUnidades / unidadesPorPaquete)

      // Calcular el subtotal basado en paquetes completos
      const subtotalCalculado = cantidadPaquetes * costoPorPaquete

      // Calcular precio por unidad para mostrar
      const precioUnitarioCalculado = costoPorPaquete / unidadesPorPaquete

      return {
        ...detalle,
        cantidadUnidades: cantidadUnidades, // Cantidad original en unidades
        cantidadPaquetes: cantidadPaquetes, // Paquetes necesarios
        unidadesPorPaquete: unidadesPorPaquete,
        costoPorPaquete: costoPorPaquete,
        precioUnitarioCalculado: precioUnitarioCalculado,
        subtotalCalculado: subtotalCalculado,
        producto: {
          ...producto,
          costoPorPaquete: costoPorPaquete,
        },
      }
    })

    // Recalcular el monto total basado en los paquetes necesarios
    const montoTotalCalculado = detallesProcesados.reduce((total, detalle) => {
      return total + detalle.subtotalCalculado
    }, 0)

    const pedidoFormateado = {
      ...pedido,
      // Convertir fechas a strings simples
      fechaPedido: formatearFechaSimple(pedido.fechaPedido),
      fechaEntrega: formatearFechaSimple(pedido.fechaEntrega),
      // Otras fechas como ISO strings
      createdAt: pedido.createdAt ? pedido.createdAt.toISOString() : null,
      updatedAt: pedido.updatedAt ? pedido.updatedAt.toISOString() : null,
      deletedAt: pedido.deletedAt ? pedido.deletedAt.toISOString() : null,
      // Usar el monto total calculado correctamente
      montoTotal: montoTotalCalculado,
      montoTotalOriginal: pedido.montoTotal, // Mantener el original para referencia
      // Usar los detalles procesados
      pedidoDetalle: detallesProcesados,
    }

    console.log(`API: Pedido con ID ${idPedido} obtenido y procesado correctamente`)
    console.log(`Monto total original: ${pedido.montoTotal}, Monto total calculado: ${montoTotalCalculado}`)

    return NextResponse.json(pedidoFormateado)
  } catch (error) {
    console.error(`API: Error al obtener pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}

// PUT /api/pedidos/[id] - Actualizar un pedido
export async function PUT(request, { params }) {
  let idPedido
  try {
    // Await params para Next.js 15
    const resolvedParams = await params

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    let userData = null

    if (process.env.NODE_ENV === "development") {
      if (!token) {
        console.log("Modo desarrollo: Usando token especial de desarrollo")
        userData = {
          idUsuario: 1,
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"],
        }
      } else {
        userData = await authController.getUserFromToken(token)
      }
    } else {
      if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
      }
      userData = await authController.getUserFromToken(token)
    }

    // Extraer y convertir el ID de manera segura
    const paramId = resolvedParams ? String(resolvedParams.id || "0") : "0"
    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    console.log(`API: Actualizando pedido con ID ${idPedido}...`)

    const datos = await request.json()
    console.log("API: Datos recibidos:", datos)

    // Validar datos
    if (!datos.pedido) {
      console.error("API: Datos de pedido incompletos")
      return NextResponse.json({ error: "Datos de pedido incompletos" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Verificar si el pedido existe
    const pedidoExistente = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      include: {
        pedidoDetalle: true,
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${idPedido} no encontrado para actualizar`)
      return NextResponse.json(
        { error: `Pedido con ID ${idPedido} no encontrado` },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    // Guardar el valor anterior para auditoría
    const valorAnterior = {
      pedido: { ...pedidoExistente },
      detalles: pedidoExistente.pedidoDetalle,
    }

    // Función para calcular el costo por paquetes necesarios
    const calcularCostoPorPaquetes = async (idProducto, cantidadUnidades) => {
      const producto = await prisma.producto.findUnique({
        where: { idProducto },
        select: { unidadesPorPaquete: true, costoPorPaquete: true },
      })

      if (!producto) return { paquetesNecesarios: 0, costoTotal: 0 }

      const unidadesPorPaquete = producto.unidadesPorPaquete || 1
      const costoPorPaquete = Number(producto.costoPorPaquete) || 0

      // Calcular paquetes necesarios (redondear hacia arriba)
      const paquetesNecesarios = Math.ceil(cantidadUnidades / unidadesPorPaquete)
      const costoTotal = paquetesNecesarios * costoPorPaquete

      return { paquetesNecesarios, costoTotal }
    }

    // Actualizar el pedido y sus detalles en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // Calcular el monto total correcto basado en paquetes necesarios
      let montoTotalCalculado = 0

      if (datos.detalles && datos.detalles.length > 0) {
        for (const detalle of datos.detalles) {
          const { costoTotal } = await calcularCostoPorPaquetes(detalle.idProducto, detalle.cantidad)
          montoTotalCalculado += costoTotal
        }
      }

      // Actualizar el pedido
      const pedidoActualizado = await prisma.pedidoCliente.update({
        where: {
          idPedido: idPedido,
        },
        data: {
          fechaPedido: new Date(datos.pedido.fechaPedido),
          fechaEntrega: new Date(datos.pedido.fechaEntrega),
          idCliente: datos.pedido.idCliente,
          vendedor: datos.pedido.vendedor || datos.pedido.idUsuario || userData.idUsuario,
          idEstadoPedido: datos.pedido.idEstadoPedido,
          observacion: datos.pedido.observacion || "",
          montoTotal: montoTotalCalculado, // Usar el monto calculado correctamente
        },
      })

      // Si hay detalles nuevos, actualizar los detalles
      let detallesCreados = []
      if (datos.detalles && datos.detalles.length > 0) {
        // Eliminar detalles existentes
        await prisma.pedidoDetalle.deleteMany({
          where: {
            idPedido: idPedido,
          },
        })

        // Crear nuevos detalles con cálculos correctos
        const detallesPromises = datos.detalles.map(async (detalle) => {
          const { costoTotal } = await calcularCostoPorPaquetes(detalle.idProducto, detalle.cantidad)
          return prisma.pedidoDetalle.create({
            data: {
              idPedido: idPedido,
              idProducto: detalle.idProducto,
              cantidad: detalle.cantidad, // Cantidad en unidades (sobres)
              subtotal: costoTotal, // Costo total basado en paquetes necesarios
            },
          })
        })

        detallesCreados = await Promise.all(detallesPromises)
      }

      return { pedido: pedidoActualizado, detalles: detallesCreados }
    })

    // Registrar auditoría
    if (userData) {
      const direccionIP = auditoriaService.obtenerDireccionIP(request)
      const navegador = auditoriaService.obtenerInfoNavegador(request)
      await auditoriaService.registrarActualizacion(
        "PedidoCliente",
        idPedido,
        valorAnterior,
        {
          pedido: resultado.pedido,
          detalles: resultado.detalles,
        },
        userData.idUsuario,
        direccionIP,
        navegador
      )
    }

    console.log(`API: Pedido con ID ${idPedido} actualizado correctamente`)
    return NextResponse.json(
      {
        mensaje: "Pedido actualizado exitosamente",
        pedido: resultado.pedido,
        detalles: resultado.detalles,
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error(`API: Error al actualizar pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
  }
}

// DELETE /api/pedidos/[id] - Eliminar un pedido (borrado lógico)
export async function DELETE(request, { params }) {
  let idPedido
  try {
    // Await params para Next.js 15
    const resolvedParams = await params

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    let userData = null

    if (process.env.NODE_ENV === "development") {
      if (!token) {
        console.log("Modo desarrollo: Usando token especial de desarrollo")
        userData = {
          idUsuario: 1,
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"],
        }
      } else {
        userData = await authController.getUserFromToken(token)
      }
    } else {
      if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
      }
      userData = await authController.getUserFromToken(token)
    }

    // Extraer y convertir el ID de manera segura
    const paramId = resolvedParams ? String(resolvedParams.id || "0") : "0"
    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    console.log(`API: Eliminando pedido con ID ${idPedido}...`)

    // Verificar si el pedido existe
    const pedidoExistente = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      include: {
        pedidoDetalle: true,
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${idPedido} no encontrado para eliminar`)
      return NextResponse.json(
        { error: `Pedido con ID ${idPedido} no encontrado` },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    // Guardar el valor anterior para auditoría
    const valorAnterior = {
      pedido: { ...pedidoExistente },
      detalles: pedidoExistente.pedidoDetalle,
    }

    // Realizar borrado lógico
    const pedidoEliminado = await prisma.pedidoCliente.update({
      where: {
        idPedido: idPedido,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar auditoría
    if (userData) {
      await auditoriaService.registrarAuditoria({
        entidad: "PedidoCliente",
        idRegistro: idPedido,
        accion: "ELIMINAR",
        valorAnterior: valorAnterior,
        valorNuevo: { deletedAt: pedidoEliminado.deletedAt },
        idUsuario: userData.idUsuario,
        request,
      })
    }

    console.log(`API: Pedido con ID ${idPedido} eliminado correctamente`)
    return NextResponse.json(
      {
        mensaje: "Pedido eliminado exitosamente",
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error(`API: Error al eliminar pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
  }
}
