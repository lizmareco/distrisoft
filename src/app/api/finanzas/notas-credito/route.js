import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import cookie from "cookie"

const prisma = new PrismaClient()

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

export async function POST(request) {
  try {
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request) 
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
      idUsuario,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request)
    )

    return NextResponse.json({ success: true, data: nota })
  } catch (error) {
    console.error("Error al crear nota de crédito:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
