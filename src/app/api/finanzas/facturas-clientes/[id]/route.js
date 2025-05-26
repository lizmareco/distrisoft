import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "contado"
    const id = Number.parseInt(params.id)

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID de factura inválido" }, { status: 400 })
    }

    let factura = null

    if (tipo === "contado") {
      const facturaDB = await prisma.facturaClienteContado.findUnique({
        where: { nroFacClienteContado: id },
        include: {
          cliente: {
            include: {
              persona: true,
            },
          },
          estadoFactuCliente: true,
          metodoPago: true,
          pedidoCliente: true,
          detalleFactura: {
            include: {
              producto: {
                include: {
                  tipoProducto: true,
                  unidadMedida: true,
                },
              },
              impuesto: true,
            },
          },
        },
      })

      if (facturaDB) {
        factura = {
          nroFactura: facturaDB.nroFacClienteContado,
          tipo: "contado",
          fechaEmision: facturaDB.fechaEmision,
          cliente: {
            nombre: `${facturaDB.cliente.persona.nombre} ${facturaDB.cliente.persona.apellido}`,
            documento: facturaDB.cliente.persona.nroDocumento,
            direccion: facturaDB.cliente.persona.direccion,
          },
          montoTotal: Number.parseFloat(facturaDB.montoTotalFactura),
          estado: facturaDB.estadoFactuCliente.descEstFactCliente,
          metodoPago: facturaDB.metodoPago?.descMetodoPago,
          observacion: facturaDB.observacion,
          detalles: facturaDB.detalleFactura.map((detalle) => ({
            cantidad: detalle.cantidad,
            descripcion: detalle.producto.nombreProducto,
            precioUnitario: Number.parseFloat(detalle.precioUnitario),
            subtotal: Number.parseFloat(detalle.subtotal),
            montoImpuesto: Number.parseFloat(detalle.montoImpuesto),
            totalLinea: Number.parseFloat(detalle.totalLinea),
            impuesto: detalle.impuesto.descImpuesto,
          })),
        }
      }
    } else if (tipo === "credito") {
      const facturaDB = await prisma.facturaClienteCredito.findUnique({
        where: { nroFacClienteCredito: id },
        include: {
          cliente: {
            include: {
              persona: true,
            },
          },
          estadoFactuCliente: true,
          metodoPago: true,
          pedidoCliente: true,
          detalleFactura: {
            include: {
              producto: {
                include: {
                  tipoProducto: true,
                  unidadMedida: true,
                },
              },
              impuesto: true,
            },
          },
        },
      })

      if (facturaDB) {
        factura = {
          nroFactura: facturaDB.nroFacClienteCredito,
          tipo: "credito",
          fechaEmision: facturaDB.fechaEmision,
          cliente: {
            nombre: `${facturaDB.cliente.persona.nombre} ${facturaDB.cliente.persona.apellido}`,
            documento: facturaDB.cliente.persona.nroDocumento,
            direccion: facturaDB.cliente.persona.direccion,
          },
          montoTotal: Number.parseFloat(facturaDB.montoTotalFactura),
          saldoRestante: facturaDB.saldoRestante,
          estado: facturaDB.estadoFactuCliente.descEstFactCliente,
          metodoPago: facturaDB.metodoPago?.descMetodoPago,
          observacion: facturaDB.observacion,
          detalles: [], // TODO: Implementar detalles para crédito
        }
      }
    }

    if (!factura) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: factura,
    })
  } catch (error) {
    console.error("Error al obtener factura:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()
    const { tipo, observacion, idEstadoFactuCliente, operador = 1 } = data

    // Validaciones
    if (!id || !tipo) {
      return NextResponse.json({ success: false, error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const idFactura = Number.parseInt(id)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(idFactura) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "IDs inválidos" }, { status: 400 })
    }

    let facturaAnterior, facturaActualizada
    const entidad = tipo === "contado" ? "FacturaClienteContado" : "FacturaClienteCredito"

    if (tipo === "contado") {
      // Obtener datos anteriores
      facturaAnterior = await prisma.facturaClienteContado.findUnique({
        where: { nroFacClienteContado: idFactura },
        include: {
          cliente: { include: { persona: true } },
          estadoFactuCliente: true,
        },
      })

      if (!facturaAnterior) {
        return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
      }

      // Actualizar factura
      facturaActualizada = await prisma.facturaClienteContado.update({
        where: { nroFacClienteContado: idFactura },
        data: {
          ...(observacion && { observacion }),
          ...(idEstadoFactuCliente && { idEstadoFactuCliente: Number.parseInt(idEstadoFactuCliente) }),
          updatedAt: new Date(),
        },
        include: {
          cliente: { include: { persona: true } },
          estadoFactuCliente: true,
        },
      })
    } else {
      // Obtener datos anteriores
      facturaAnterior = await prisma.facturaClienteCredito.findUnique({
        where: { nroFacClienteCredito: idFactura },
        include: {
          cliente: { include: { persona: true } },
          estadoFactuCliente: true,
        },
      })

      if (!facturaAnterior) {
        return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
      }

      // Actualizar factura
      facturaActualizada = await prisma.facturaClienteCredito.update({
        where: { nroFacClienteCredito: idFactura },
        data: {
          ...(observacion && { observacion }),
          ...(idEstadoFactuCliente && { idEstadoFactuCliente: Number.parseInt(idEstadoFactuCliente) }),
          updatedAt: new Date(),
        },
        include: {
          cliente: { include: { persona: true } },
          estadoFactuCliente: true,
        },
      })
    }

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarActualizacion(
      entidad,
      idFactura,
      {
        observacion: facturaAnterior.observacion,
        estado: facturaAnterior.estadoFactuCliente.descEstFactCliente,
        fechaActualizacion: facturaAnterior.updatedAt,
      },
      {
        observacion: facturaActualizada.observacion,
        estado: facturaActualizada.estadoFactuCliente.descEstFactCliente,
        fechaActualizacion: new Date().toISOString(),
        descripcion: `Factura ${tipo} actualizada - Cliente: ${facturaActualizada.cliente.persona.nombre} ${facturaActualizada.cliente.persona.apellido}`,
      },
      operadorInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      data: facturaActualizada,
      message: "Factura actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar factura:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const operador = searchParams.get("operador") || "1"

    // Validaciones
    if (!id || !tipo) {
      return NextResponse.json({ success: false, error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const idFactura = Number.parseInt(id)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(idFactura) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "IDs inválidos" }, { status: 400 })
    }

    let facturaAnterior
    const entidad = tipo === "contado" ? "FacturaClienteContado" : "FacturaClienteCredito"

    if (tipo === "contado") {
      // Obtener datos antes de eliminar
      facturaAnterior = await prisma.facturaClienteContado.findUnique({
        where: { nroFacClienteContado: idFactura },
        include: {
          cliente: { include: { persona: true } },
          estadoFactuCliente: true,
          metodoPago: true,
        },
      })

      if (!facturaAnterior) {
        return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
      }

      // Soft delete
      await prisma.facturaClienteContado.update({
        where: { nroFacClienteContado: idFactura },
        data: { deletedAt: new Date() },
      })
    } else {
      // Obtener datos antes de eliminar
      facturaAnterior = await prisma.facturaClienteCredito.findUnique({
        where: { nroFacClienteCredito: idFactura },
        include: {
          cliente: { include: { persona: true } },
          estadoFactuCliente: true,
        },
      })

      if (!facturaAnterior) {
        return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
      }

      // Verificar que no tenga pagos registrados
      const pagos = await prisma.detallePagoFacCliente.findMany({
        where: { nroFacClienteCredito: idFactura },
      })

      if (pagos.length > 0) {
        return NextResponse.json(
          { success: false, error: "No se puede eliminar una factura con pagos registrados" },
          { status: 400 },
        )
      }

      // Soft delete
      await prisma.facturaClienteCredito.update({
        where: { nroFacClienteCredito: idFactura },
        data: { deletedAt: new Date() },
      })
    }

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarEliminacion(
      entidad,
      idFactura,
      {
        cliente: `${facturaAnterior.cliente.persona.nombre} ${facturaAnterior.cliente.persona.apellido}`,
        montoTotal: facturaAnterior.montoTotalFactura,
        fechaEmision: facturaAnterior.fechaEmision,
        estado: facturaAnterior.estadoFactuCliente.descEstFactCliente,
        timbrado: facturaAnterior.timbrado,
        observacion: facturaAnterior.observacion,
        descripcion: `Factura ${tipo} eliminada - Cliente: ${facturaAnterior.cliente.persona.nombre} ${facturaAnterior.cliente.persona.apellido}`,
      },
      operadorInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      message: "Factura eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar factura:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
