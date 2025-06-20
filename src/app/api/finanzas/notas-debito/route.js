import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Buscar todas las notas de débito (con filtros básicos)
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const id_factura = searchParams.get('id_factura_origen')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 10
  const anuladas = searchParams.get('anuladas') === '1'

  const where = {
    ...(id_factura ? { id_factura_origen: Number(id_factura) } : {}),
    ...(anuladas
      ? { deleted_at: { not: null } }
      : { deleted_at: null })
  }

  try {
    const [total, notas] = await Promise.all([
      prisma.notaDebito.count({ where }),
      prisma.notaDebito.findMany({
        where,
        orderBy: { fecha_emision: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { detalles: true, estado: true }
      })
    ])
    return Response.json({ notas, total, page, pageSize })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    console.log("Datos recibidos:", data)

    // Generar número de nota de débito (incremental)
    const cantidadNotas = await prisma.notaDebito.count()
    const nroNotaFormateado = `001-001-${String(cantidadNotas + 1).padStart(5, "0")}`

    const nota = await prisma.notaDebito.create({
      data: {
        nro_nota: nroNotaFormateado,
        id_factura_origen: Number(data.id_factura_origen),
        motivo: data.motivo,
        monto_total: data.monto_total,
        usuario_emisor: data.usuario_emisor,
        id_estado: 1,
        detalles: {
          create: data.detalles.map(det => ({
            concepto: det.concepto,
            cantidad: det.cantidad,
            precio_unitario: det.precio_unitario,
            subtotal: det.subtotal,
            id_impuesto: det.id_impuesto,
            monto_impuesto: det.monto_impuesto,
            total_item: det.total_item
          }))
        }
      },
      include: { detalles: true }
    })
    return Response.json(nota)
  } catch (error) {
    console.error(error)
    return Response.json({ error: error.message }, { status: 400 })
  }
}