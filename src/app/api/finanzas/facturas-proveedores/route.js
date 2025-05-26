import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const proveedor = searchParams.get("proveedor")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    const whereClause = {
      deletedAt: null,
    }

    // Filtros
    if (proveedor) {
      whereClause.proveedor = {
        empresa: {
          razonSocial: { contains: proveedor, mode: "insensitive" },
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

    if (!tipo || tipo === "contado") {
      facturasContado = await prisma.facturaContadoProv.findMany({
        where: {
          ...whereClause,
          ...(estado && { estadoFacturaProv: { descFacturaProv: estado } }),
        },
        include: {
          proveedor: {
            include: {
              empresa: true,
            },
          },
          estadoFacturaProv: true,
          metodoPago: true,
          ordenCompra: true,
        },
        orderBy: {
          fechaEmision: "desc",
        },
      })
    }

    if (!tipo || tipo === "credito") {
      facturasCredito = await prisma.facturaCreditoProv.findMany({
        where: {
          ...whereClause,
          ...(estado && { estadoFacturaProv: { descFacturaProv: estado } }),
        },
        include: {
          proveedor: {
            include: {
              empresa: true,
            },
          },
          estadoFacturaProv: true,
          ordenCompra: true,
          detallePagoFacProv: true,
        },
        orderBy: {
          fechaEmision: "desc",
        },
      })
    }

    // Formatear respuesta
    const facturas = [
      ...facturasContado.map((f) => ({
        idFactura: f.idFacturaContadoProv,
        tipo: "contado",
        nroFactura: f.nroFacProvContado,
        fechaEmision: f.fechaEmision,
        proveedor: f.proveedor.empresa.razonSocial,
        montoTotal: f.montoTotal,
        estado: f.estadoFacturaProv.descFacturaProv,
        metodoPago: f.metodoPago?.descMetodoPago,
        comprobantePago: f.comprobantePago,
        ordenCompra: f.ordenCompra?.idOrdenCompra,
      })),
      ...facturasCredito.map((f) => ({
        idFactura: f.idFacturaCreditoProv,
        tipo: "credito",
        nroFactura: f.nroFacProvCredito,
        fechaEmision: f.fechaEmision,
        fechaVencimiento: f.fechaVencimiento,
        proveedor: f.proveedor.empresa.razonSocial,
        montoTotal: f.montoTotal,
        montoPagado: f.montoPagado,
        saldoRestante: f.saldoRestante,
        plazoPago: f.plazoPago,
        estado: f.estadoFacturaProv.descFacturaProv,
        ordenCompra: f.ordenCompra?.idOrdenCompra,
        pagos: f.detallePagoFacProv,
      })),
    ]

    return NextResponse.json({
      success: true,
      data: facturas,
    })
  } catch (error) {
    console.error("Error al obtener facturas de proveedores:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const {
      tipo,
      idProveedor,
      nroFactura,
      montoTotal,
      fechaEmision,
      idOrdenCompra = null,
      idMetodoPago = null, // Solo para contado
      comprobantePago = "", // Solo para contado
      plazoPago = null, // Solo para crédito
      fechaVencimiento = null, // Solo para crédito
      operador = 1,
    } = data

    // Validaciones
    if (!tipo || !idProveedor || !nroFactura || !montoTotal || !fechaEmision) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Convertir valores a los tipos correctos
    const idProveedorInt = Number.parseInt(idProveedor)
    const montoTotalFloat = Number.parseFloat(montoTotal)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(idProveedorInt) || isNaN(montoTotalFloat) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "Valores inválidos" }, { status: 400 })
    }

    if (montoTotalFloat <= 0) {
      return NextResponse.json({ success: false, error: "El monto debe ser mayor a 0" }, { status: 400 })
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { idProveedor: idProveedorInt },
      include: {
        empresa: true,
      },
    })

    if (!proveedor) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 })
    }

    // Crear la factura
    let nuevaFactura

    if (tipo === "contado") {
      if (!idMetodoPago) {
        return NextResponse.json(
          { success: false, error: "Método de pago requerido para factura al contado" },
          { status: 400 },
        )
      }

      nuevaFactura = await prisma.facturaContadoProv.create({
        data: {
          idProveedor: idProveedorInt,
          fechaEmision: new Date(fechaEmision),
          nroFacProvContado: nroFactura,
          montoTotal: montoTotalFloat,
          idEstadoFacturaProv: 1, // Estado "Registrada"
          idOrdenCompra: idOrdenCompra ? Number.parseInt(idOrdenCompra) : null,
          idMetodoPago: Number.parseInt(idMetodoPago),
          comprobantePago,
        },
      })
    } else {
      if (!plazoPago || !fechaVencimiento) {
        return NextResponse.json(
          { success: false, error: "Plazo de pago y fecha de vencimiento requeridos para factura a crédito" },
          { status: 400 },
        )
      }

      nuevaFactura = await prisma.facturaCreditoProv.create({
        data: {
          idProveedor: idProveedorInt,
          fechaEmision: new Date(fechaEmision),
          nroFacProvCredito: nroFactura,
          montoTotal: montoTotalFloat,
          montoPagado: 0,
          saldoRestante: montoTotalFloat,
          plazoPago: Number.parseInt(plazoPago),
          fechaVencimiento: new Date(fechaVencimiento),
          idEstadoFacturaProv: 1, // Estado "Registrada"
          idOrdenCompra: idOrdenCompra ? Number.parseInt(idOrdenCompra) : null,
        },
      })
    }

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    const entidad = tipo === "contado" ? "FacturaContadoProv" : "FacturaCreditoProv"
    const idFactura = tipo === "contado" ? nuevaFactura.idFacturaContadoProv : nuevaFactura.idFacturaCreditoProv

    await auditoriaService.registrarCreacion(
      entidad,
      idFactura,
      {
        tipo,
        proveedor: proveedor.empresa.razonSocial,
        nroFactura,
        montoTotal: montoTotalFloat,
        fechaEmision,
        ...(tipo === "contado" && { idMetodoPago, comprobantePago }),
        ...(tipo === "credito" && { plazoPago, fechaVencimiento }),
        ...(idOrdenCompra && { ordenCompra: idOrdenCompra }),
        descripcion: `Factura ${tipo} de proveedor registrada - ${proveedor.empresa.razonSocial} - Nro: ${nroFactura}`,
      },
      operadorInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      data: nuevaFactura,
      message: "Factura de proveedor registrada exitosamente",
    })
  } catch (error) {
    console.error("Error al registrar factura de proveedor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
