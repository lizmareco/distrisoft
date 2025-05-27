import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") // "contado", "credito", o null para todos
    const estado = searchParams.get("estado")
    const cliente = searchParams.get("cliente")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    // Parámetros de paginación
    const pagina = Number.parseInt(searchParams.get("pagina") || "1")
    const limite = Number.parseInt(searchParams.get("limite") || "10")
    const skip = (pagina - 1) * limite

    const whereClause = {
      deletedAt: null,
    }

    // Filtro por tipo de factura
    if (tipo === "contado") {
      whereClause.esContado = true
    } else if (tipo === "credito") {
      whereClause.esContado = false
    }

    // Filtros adicionales
    if (cliente) {
      whereClause.cliente = {
        persona: {
          OR: [
            { nombre: { contains: cliente, mode: "insensitive" } },
            { apellido: { contains: cliente, mode: "insensitive" } },
          ],
        },
      }
    }

    if (estado) {
      whereClause.estadoFactuCliente = { descEstFactCliente: estado }
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fechaEmision = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      }
    }

    // Contar total de facturas
    const totalFacturas = await prisma.facturaCliente.count({
      where: whereClause,
    })

    // Obtener facturas con paginación
    const facturas = await prisma.facturaCliente.findMany({
      where: whereClause,
      include: {
        cliente: {
          include: {
            persona: true,
          },
        },
        estadoFactuCliente: true,
        metodoPago: true,
        pedidoCliente: true,
        cuentaPorCobrar: {
          include: {
            estadoCuenta: true,
          },
        },
        pagos: true,
      },
      orderBy: {
        fechaEmision: "desc",
      },
      skip,
      take: limite,
    })

    // Formatear respuesta
    const facturasFormateadas = facturas.map((f) => ({
      nroFactura: f.nroFactura,
      tipo: f.esContado ? "contado" : "credito",
      fechaEmision: f.fechaEmision,
      fechaVencimiento: f.fechaVencimiento,
      cliente: `${f.cliente.persona.nombre} ${f.cliente.persona.apellido}`,
      montoTotal: Number.parseFloat(f.montoTotalFactura),
      estado: f.estadoFactuCliente.descEstFactCliente,
      metodoPago: f.metodoPago?.descMetodoPago,
      observacion: f.observacion,
      // Información específica para crédito
      saldoRestante: f.cuentaPorCobrar?.saldoRestante || 0,
      diasVencido: f.cuentaPorCobrar?.diasVencido || 0,
      estadoCuenta: f.cuentaPorCobrar?.estadoCuenta?.descEstadoCuenta,
      totalPagos: f.pagos?.reduce((sum, pago) => sum + pago.montoPago, 0) || 0,
    }))

    const totalPaginas = Math.ceil(totalFacturas / limite)

    return NextResponse.json({
      success: true,
      data: facturasFormateadas,
      meta: {
        page: pagina,
        limit: limite,
        total: totalFacturas,
        totalPages: totalPaginas,
      },
    })
  } catch (error) {
    console.error("Error al obtener facturas:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const {
      tipo, // "contado" o "credito"
      idCliente,
      idPedido,
      observacion = "",
      idMetodoPago, // Solo para contado
      plazoPago, // Solo para crédito (días)
      fechaVencimiento, // Solo para crédito
      operador = 1, // TODO: Obtener del token de autenticación
    } = data

    // Validaciones
    if (!tipo || !idCliente || !idPedido) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (tipo === "contado" && !idMetodoPago) {
      return NextResponse.json(
        { success: false, error: "Método de pago requerido para factura al contado" },
        { status: 400 },
      )
    }

    if (tipo === "credito" && (!plazoPago || !fechaVencimiento)) {
      return NextResponse.json(
        { success: false, error: "Plazo de pago y fecha de vencimiento requeridos para factura a crédito" },
        { status: 400 },
      )
    }

    // Convertir valores a los tipos correctos
    const idClienteInt = Number.parseInt(idCliente)
    const idPedidoInt = Number.parseInt(idPedido)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(idClienteInt) || isNaN(idPedidoInt) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "IDs inválidos" }, { status: 400 })
    }

    // Obtener datos del pedido con sus detalles
    const pedido = await prisma.pedidoCliente.findUnique({
      where: { idPedido: idPedidoInt },
      include: {
        pedidoDetalle: {
          include: {
            producto: {
              include: {
                tipoProducto: true,
                unidadMedida: true,
              },
            },
          },
        },
        cliente: {
          include: {
            persona: true,
          },
        },
      },
    })

    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    // Función para determinar el tipo de impuesto según el producto
    const determinarImpuesto = (producto) => {
      // Todos los productos alimenticios tienen IVA 10%
      return 2 // IVA 10%
    }

    // Función para obtener precio por paquete según el tipo de producto (PRECIOS REALES DE COMERCIALIZACIÓN)
    const obtenerPrecioPorPaquete = (producto) => {
      const tipoProducto = producto.tipoProducto?.descTipoProducto?.toLowerCase() || ""

      // Precios de comercialización por paquete (YA INCLUYEN IVA)
      if (tipoProducto.includes("edulcorante")) {
        return 150000 // ₲150.000 por paquete de 1000 sobres
      } else if (tipoProducto.includes("sal")) {
        return 100000 // ₲100.000 por paquete de 1000 sobres
      } else if (tipoProducto.includes("azúcar") || tipoProducto.includes("azucar")) {
        return 100000 // ₲100.000 por paquete de 500 sobres
      } else if (tipoProducto.includes("cocido")) {
        return 2990 // ₲2.990 por caja (10 unidades)
      }

      // Si no coincide con ningún tipo conocido, usar un precio por defecto
      return 10000 // Precio por defecto
    }

    // Función para calcular línea de factura
    const calcularLineaFactura = (detallePedido, productoBD) => {
      const cantidadUnidades = Number.parseFloat(detallePedido.cantidad || 0)

      // Obtener datos del producto
      const unidadesPorPaquete = productoBD.unidadesPorPaquete || 1
      const costoPorPaquete = Number.parseFloat(productoBD.costoPorPaquete || 0)

      // Convertir unidades a paquetes
      const cantidadPaquetes = Math.ceil(cantidadUnidades / unidadesPorPaquete)

      // Precio por paquete (ya incluye IVA)
      const precioConIVA = costoPorPaquete

      // Total de línea (cantidad de paquetes × precio con IVA)
      const totalLinea = cantidadPaquetes * precioConIVA

      // Calcular IVA (10% del total)
      const montoImpuesto = Math.round(totalLinea * 0.1)

      return {
        cantidad: cantidadPaquetes, // CANTIDAD EN PAQUETES
        precioUnitario: precioConIVA, // PRECIO POR PAQUETE
        idImpuesto: 2, // IVA 10%
        subtotal: 0, // No usar subtotal
        montoImpuesto,
        totalLinea,
      }
    }

    // Crear la factura en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // Usar el monto total ya calculado del pedido
      const montoTotalCalculado = Number.parseFloat(pedido.montoTotal)

      // Calcular detalles basados en los datos del pedido
      const detallesCalculados = []

      for (const detallePedido of pedido.pedidoDetalle) {
        // Obtener información del producto desde la BD
        const productoBD = await prisma.producto.findUnique({
          where: { idProducto: detallePedido.idProducto },
          include: { tipoProducto: true },
        })

        if (!productoBD) continue

        // Calcular línea de factura con conversión correcta
        const lineaFactura = calcularLineaFactura(detallePedido, productoBD)

        detallesCalculados.push({
          detallePedido,
          lineaFactura,
        })
      }

      // Usar el monto total del pedido (ya calculado correctamente)
      const montoTotalFactura = montoTotalCalculado

      // Preparar datos de la factura
      const datosFactura = {
        fechaEmision: new Date(),
        idCliente: idClienteInt,
        idPedido: idPedidoInt,
        operador: operadorInt,
        idImpuesto: 2, // IVA 10% por defecto para la factura
        montoTotalFactura: montoTotalFactura, // Usar el monto del pedido
        observacion,
        esContado: tipo === "contado",
        idEstadoFactuCliente: 1, // Estado "Emitida"
      }

      // Campos específicos según el tipo
      if (tipo === "contado") {
        datosFactura.idMetodoPago = Number.parseInt(idMetodoPago)
      } else {
        datosFactura.plazoPago = Number.parseInt(plazoPago)
        datosFactura.fechaVencimiento = new Date(fechaVencimiento)
      }

      // Crear factura
      const nuevaFactura = await prisma.facturaCliente.create({
        data: datosFactura,
      })

      // Crear detalles de factura
      for (const { detallePedido, lineaFactura } of detallesCalculados) {
        await prisma.detalleFacturaCliente.create({
          data: {
            nroFactura: nuevaFactura.nroFactura,
            idProducto: detallePedido.idProducto,
            cantidad: lineaFactura.cantidad,
            precioUnitario: lineaFactura.precioUnitario,
            idImpuesto: lineaFactura.idImpuesto,
            subtotal: lineaFactura.subtotal,
            montoImpuesto: lineaFactura.montoImpuesto,
            totalLinea: lineaFactura.totalLinea,
          },
        })
      }

      // Si es factura a crédito, crear cuenta por cobrar
      if (tipo === "credito") {
        await prisma.cuentaPorCobrar.create({
          data: {
            nroFactura: nuevaFactura.nroFactura,
            idCliente: idClienteInt,
            montoOriginal: montoTotalFactura,
            saldoRestante: montoTotalFactura,
            fechaVencimiento: new Date(fechaVencimiento),
            diasVencido: 0,
            idEstadoCuenta: 1, // Estado "Vigente"
          },
        })
      }

      return nuevaFactura
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarCreacion(
      "FacturaCliente",
      resultado.nroFactura,
      {
        tipo,
        cliente: `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`,
        pedido: idPedidoInt,
        montoTotal: resultado.montoTotalFactura,
        observacion,
        fechaEmision: new Date().toISOString(),
        esContado: tipo === "contado",
        descripcion: `Factura ${tipo} creada para cliente ${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido} - Pedido #${idPedidoInt}`,
      },
      operadorInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Factura ${tipo} creada exitosamente`,
    })
  } catch (error) {
    console.error("Error al crear factura:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
