import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
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

    // Filtros
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

    if (fechaDesde && fechaHasta) {
      whereClause.fechaEmision = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      }
    }

    // Consultar facturas de contado y crédito por separado
    let facturasContado = []
    let facturasCredito = []
    let totalContado = 0
    let totalCredito = 0

    if (!tipo || tipo === "contado") {
      const whereContado = {
        ...whereClause,
        ...(estado && { estadoFactuCliente: { descEstFactCliente: estado } }),
      }

      // Contar total de facturas contado
      totalContado = await prisma.facturaClienteContado.count({
        where: whereContado,
      })

      facturasContado = await prisma.facturaClienteContado.findMany({
        where: whereContado,
        include: {
          cliente: {
            include: {
              persona: true,
            },
          },
          estadoFactuCliente: true,
          metodoPago: true,
          pedidoCliente: true,
        },
        orderBy: {
          fechaEmision: "desc",
        },
        skip: tipo === "contado" ? skip : 0,
        take: tipo === "contado" ? limite : undefined,
      })
    }

    if (!tipo || tipo === "credito") {
      const whereCredito = {
        ...whereClause,
        ...(estado && { estadoFactuCliente: { descEstFactCliente: estado } }),
      }

      // Contar total de facturas crédito
      totalCredito = await prisma.facturaClienteCredito.count({
        where: whereCredito,
      })

      facturasCredito = await prisma.facturaClienteCredito.findMany({
        where: whereCredito,
        include: {
          cliente: {
            include: {
              persona: true,
            },
          },
          estadoFactuCliente: true,
          pedidoCliente: true,
          detallePagoFacCliente: true,
        },
        orderBy: {
          fechaEmision: "desc",
        },
        skip: tipo === "credito" ? skip : 0,
        take: tipo === "credito" ? limite : undefined,
      })
    }

    // Formatear respuesta
    let facturas = [
      ...facturasContado.map((f) => ({
        nroFactura: f.nroFacClienteContado,
        tipo: "contado",
        fechaEmision: f.fechaEmision,
        cliente: `${f.cliente.persona.nombre} ${f.cliente.persona.apellido}`,
        montoTotal: Number.parseFloat(f.montoTotalFactura),
        estado: f.estadoFactuCliente.descEstFactCliente,
        metodoPago: f.metodoPago?.descMetodoPago,
        observacion: f.observacion,
        detalles: [], // Temporalmente vacío
      })),
      ...facturasCredito.map((f) => ({
        nroFactura: f.nroFacClienteCredito,
        tipo: "credito",
        fechaEmision: f.fechaEmision,
        fechaVencimiento: f.fechaVencimiento,
        cliente: `${f.cliente.persona.nombre} ${f.cliente.persona.apellido}`,
        montoTotal: Number.parseFloat(f.montoTotalFactura),
        saldoRestante: f.saldoRestante,
        plazoPago: f.plazoPago,
        estado: f.estadoFactuCliente.descEstFactCliente,
        observacion: f.observacion,
        pagos: f.detallePagoFacCliente,
      })),
    ]

    // Si no hay filtro de tipo, necesitamos paginar el resultado combinado
    if (!tipo) {
      // Ordenar por fecha de emisión descendente
      facturas.sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision))

      const totalFacturas = totalContado + totalCredito
      const totalPaginas = Math.ceil(totalFacturas / limite)

      // Aplicar paginación al resultado combinado
      facturas = facturas.slice(skip, skip + limite)

      return NextResponse.json({
        success: true,
        data: facturas,
        meta: {
          page: pagina,
          limit: limite,
          total: totalFacturas,
          totalPages: totalPaginas,
          totalContado,
          totalCredito,
        },
      })
    }

    // Para filtros específicos de tipo
    const total = tipo === "contado" ? totalContado : totalCredito
    const totalPaginas = Math.ceil(total / limite)

    return NextResponse.json({
      success: true,
      data: facturas,
      meta: {
        page: pagina,
        limit: limite,
        total: total,
        totalPages: totalPaginas,
        totalContado,
        totalCredito,
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
      tipo,
      idCliente,
      idPedido,
      observacion = "",
      idMetodoPago, // Solo para contado
      plazoPago, // Solo para crédito
      fechaVencimiento, // Solo para crédito
      operador = 1, // TODO: Obtener del token de autenticación
    } = data

    // Validaciones
    if (!tipo || !idCliente || !idPedido) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Convertir valores a los tipos correctos
    const idClienteInt = Number.parseInt(idCliente)
    const idPedidoInt = Number.parseInt(idPedido)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(idClienteInt) || isNaN(idPedidoInt) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "IDs inválidos" }, { status: 400 })
    }

    // Obtener datos del pedido con sus detalles
    const pedido = await prisma.PedidoCliente.findUnique({
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

    // Función para obtener precio por paquete según el tipo de producto
    const obtenerPrecioPorPaquete = (producto) => {
      const tipoProducto = producto.tipoProducto?.descTipoProducto?.toLowerCase() || ""

      // Precios según las reglas de negocio
      if (tipoProducto.includes("edulcorante")) {
        return 150000 // 150.000 Gs por paquete de 1000 sobres
      } else if (tipoProducto.includes("sal")) {
        return 100000 // 100.000 Gs por paquete de 1000 sobres
      } else if (tipoProducto.includes("azúcar") || tipoProducto.includes("azucar")) {
        return 100000 // 100.000 Gs por paquete de 500 sobres
      } else if (tipoProducto.includes("cocido")) {
        return 2990 // 2.990 Gs por caja (10 unidades)
      }

      // Si no coincide con ningún tipo conocido, usar el costoPorPaquete del producto
      return Number.parseFloat(producto.costoPorPaquete || 0)
    }

    // Función para calcular línea de factura
    const calcularLineaFactura = (detallePedido, idImpuesto) => {
      const producto = detallePedido.producto
      const cantidadPaquetes = Number.parseFloat(detallePedido.cantidad || 0)

      // Obtener precio por paquete según el tipo de producto
      const precioUnitarioPaquete = obtenerPrecioPorPaquete(producto)

      // Calcular subtotal (cantidad de paquetes × precio por paquete)
      const subtotal = cantidadPaquetes * precioUnitarioPaquete

      // Obtener porcentaje de impuesto
      let porcentajeImpuesto = 0
      if (idImpuesto === 1)
        porcentajeImpuesto = 0.05 // 5%
      else if (idImpuesto === 2) porcentajeImpuesto = 0.1 // 10%

      const montoImpuesto = subtotal * porcentajeImpuesto
      const totalLinea = subtotal + montoImpuesto

      console.log(`Calculando línea para producto ${producto.nombreProducto}:`, {
        cantidadPaquetes,
        precioUnitarioPaquete,
        subtotal,
        montoImpuesto,
        totalLinea,
      })

      return {
        cantidad: cantidadPaquetes,
        precioUnitario: precioUnitarioPaquete,
        idImpuesto: idImpuesto || 2, // Default IVA 10%
        subtotal,
        montoImpuesto,
        totalLinea,
      }
    }

    // Crear la factura en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      let nuevaFactura

      if (tipo === "contado") {
        if (!idMetodoPago) {
          throw new Error("Método de pago requerido para factura al contado")
        }

        // Obtener el próximo número de factura
        const ultimaFactura = await prisma.FacturaClienteContado.findFirst({
          orderBy: { nroFacClienteContado: "desc" },
        })

        const proximoNumero = ultimaFactura ? ultimaFactura.nroFacClienteContado + 1 : 1

        // Calcular el monto total real basado en precios por paquete
        let montoTotalCalculado = 0
        const detallesCalculados = []

        for (const detallePedido of pedido.pedidoDetalle) {
          const idImpuesto = determinarImpuesto(detallePedido.producto)
          const lineaFactura = calcularLineaFactura(detallePedido, idImpuesto)
          montoTotalCalculado += lineaFactura.totalLinea
          detallesCalculados.push({
            detallePedido,
            lineaFactura,
          })
        }

        console.log(`Monto total calculado: ${montoTotalCalculado}`)

        // Crear factura de contado
        nuevaFactura = await prisma.FacturaClienteContado.create({
          data: {
            nroFacClienteContado: proximoNumero,
            fechaEmision: new Date(),
            idCliente: idClienteInt,
            idPedido: idPedidoInt,
            operador: operadorInt,
            idImpuesto: 2, // IVA 10% por defecto para la factura
            montoTotalFactura: montoTotalCalculado,
            observacion,
            idMetodoPago: Number.parseInt(idMetodoPago),
            idEstadoFactuCliente: 1, // Estado "Emitida"
          },
        })

        // Crear detalles de factura
        for (const { detallePedido, lineaFactura } of detallesCalculados) {
          await prisma.DetalleFacturaClienteContado.create({
            data: {
              nroFacClienteContado: nuevaFactura.nroFacClienteContado,
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

        // Actualizar el monto total del pedido si es diferente
        if (Math.abs(pedido.montoTotal - montoTotalCalculado) > 0.01) {
          await prisma.PedidoCliente.update({
            where: { idPedido: idPedidoInt },
            data: {
              montoTotal: montoTotalCalculado,
              updatedAt: new Date(),
            },
          })
          console.log(`Monto del pedido actualizado de ${pedido.montoTotal} a ${montoTotalCalculado}`)
        }

        // NO cambiar el estado del pedido - mantener el estado actual
        // El pedido se cambiará manualmente después de la entrega física
      } else {
        // Lógica para crédito (implementar después)
        throw new Error("Facturación a crédito no implementada aún")
      }

      return nuevaFactura
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarCreacion(
      "FacturaClienteContado",
      resultado.nroFacClienteContado,
      {
        tipo,
        cliente: `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`,
        pedido: idPedidoInt,
        montoTotal: resultado.montoTotalFactura,
        observacion,
        fechaEmision: new Date().toISOString(),
        idMetodoPago,
        descripcion: `Factura al contado creada para cliente ${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido} - Pedido #${idPedidoInt}`,
      },
      operadorInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      data: resultado,
      message: "Factura al contado creada exitosamente",
    })
  } catch (error) {
    console.error("Error al crear factura:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
