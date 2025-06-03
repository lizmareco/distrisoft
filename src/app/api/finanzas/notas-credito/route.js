import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()
const authController = new AuthController()
const auditoriaService = new AuditoriaService()

export async function POST(request) {
  try {
    const token = await authController.hasAccessToken(request)
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const usuario = await authController.getUserFromToken(token)
    const datos = await request.json()

    const { nroFactura, motivo, detalles } = datos
    if (!nroFactura || !motivo || !detalles || detalles.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Obtener la factura original
    const factura = await prisma.facturaCliente.findUnique({
        where: { nroFactura: Number(nroFactura) },
        include: {
          detalleFactura: true,
          cliente: true, // opcional si necesitás más info del cliente
        },
      })
    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Generar número de nota de crédito (incremental)
    
    const cantidadNotas = await prisma.NotaCredito.count()
    const nroNotaFormateado = `001-001-${String(cantidadNotas + 1).padStart(5, "0")}`
    const montoTotal = detalles.reduce((total, d) => {
        return total + d.precioUnitario * d.cantidad
      }, 0)

    const nota = await prisma.$transaction(async (tx) => {
        const notaCreada = await tx.notaCredito.create({
          data: {    // visible
            nroNota: nroNotaFormateado,    // interno
            fechaEmision: new Date(),
            motivo,
            montoTotal,
            cliente: {
                connect: { idCliente: factura.idCliente }
              },
              facturaOrigen: {
                connect: {
                  nroFactura: Number(nroFactura), 
                }
              },
            estadoNotaCredito: {
              connect: { idEstadoNota: 1 },
            },
          },
        })

      // Crear los detalles
      for (const detalle of detalles) {
        const subtotal = detalle.precioUnitario * detalle.cantidad
        const montoImpuesto = subtotal * 0.1 // IVA 10%

        await tx.detalleNotaCredito.create({
          data: {
            idNota: notaCreada.idNota,
            idDetalleFactura: detalle.idDetalleFactura,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            idImpuesto: detalle.idImpuesto,
            subtotal,
            montoImpuesto,
          },
        })
      }

      // Calcular el monto total de notas de crédito para la factura
      const notasCredito = await tx.notaCredito.findMany({
        where: { idFacturaOrigen: factura.nroFactura },
        select: { montoTotal: true },
      })
      const totalNotasCredito = notasCredito.reduce((sum, n) => sum + Number(n.montoTotal), 0) + montoTotal;
      // Sumar la nota recién creada (montoTotal)

      // Determinar el nuevo estado de la factura
      let nuevoEstado = 5; // Parcial por defecto
      if (totalNotasCredito >= Number(factura.montoTotalFactura)) {
        nuevoEstado = 4; // Anulada
      }
      await tx.facturaCliente.update({
        where: { nroFactura: factura.nroFactura },
        data: { idEstadoFactuCliente: nuevoEstado },
      })

      return notaCreada
    })

    // Auditoría y respuesta fuera de la transacción
    await auditoriaService.registrarCreacion(
      "NotaCredito",
      nota.idNota,
      {
        numero: nota.nroNota,
        motivo,
        montoTotal: nota.montoTotal,
        detalles,
      },
      usuario.idUsuario,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request)
    )

    return NextResponse.json({ success: true, data: nota })
  } catch (error) {
    console.error("Error al crear nota de crédito:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
