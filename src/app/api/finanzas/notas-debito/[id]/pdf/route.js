import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { id } = params
    const notaId = Number(id)

    if (!notaId || isNaN(notaId)) {
      return NextResponse.json({ error: 'ID de nota inválido' }, { status: 400 })
    }

    // Obtener la nota de débito con todos sus detalles
    const nota = await prisma.notaDebito.findUnique({
      where: { id_notadb: notaId },
      include: {
        detalles: {
          include: {
            impuesto: true
          }
        },
        factura: {
          include: {
            cliente: {
              include: {
                persona: true
              }
            }
          }
        }
      }
    })

    if (!nota) {
      return NextResponse.json({ error: 'Nota de débito no encontrada' }, { status: 404 })
    }

    // Generar el PDF (aquí puedes usar la librería que prefieras)
    // Por ahora, vamos a devolver un JSON con los datos para que puedas implementar el PDF
    const pdfData = {
      nota: {
        id: nota.id_notadb,
        numero: nota.nro_nota || `#${nota.id_notadb}`,
        fecha: nota.fecha_emision,
        motivo: nota.motivo,
        montoTotal: nota.monto_total,
        usuarioEmisor: nota.usuario_emisor
      },
      factura: {
        numero: nota.factura.nroFactura,
        cliente: `${nota.factura.cliente.persona.nombre} ${nota.factura.cliente.persona.apellido}`,
        ruc: nota.factura.cliente.persona.nroDocumento
      },
      detalles: nota.detalles.map(det => ({
        concepto: det.concepto,
        cantidad: det.cantidad,
        precioUnitario: det.precio_unitario,
        subtotal: det.subtotal,
        montoImpuesto: det.monto_impuesto,
        totalItem: det.total_item
      }))
    }

    // Por ahora devolvemos JSON, pero aquí deberías generar el PDF
    return NextResponse.json({
      success: true,
      data: pdfData,
      message: 'Datos de nota de débito para generar PDF'
    })

  } catch (error) {
    console.error('Error al obtener nota de débito:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 