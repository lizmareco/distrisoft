import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import cookie from "cookie"

// Importar jsPDF
import jsPDF from "jspdf"

async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  // Leer la cookie "at" del header
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

export async function GET(request, { params }) {
  try {
    // Await params en Next.js 15
    const { id } = await params
    console.log(`API: Generando PDF para orden de compra con ID: ${id}`)

    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json({ message: "ID de orden de compra inválido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Obtener la orden de compra con todos los datos necesarios
    const ordenCompra = await prisma.ordenCompra.findUnique({
      where: {
        idOrdenCompra: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            detallesCotizacionProv: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
        estadoOrdenCompra: true,
        inventario: {
          include: {
            materiaPrima: true,
          },
        },
      },
    })

    if (!ordenCompra) {
      return NextResponse.json({ message: "Orden de compra no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Crear el documento PDF con jsPDF
    const doc = new jsPDF()
    
    // Generar contenido del PDF
    generatePDFContent(doc, ordenCompra)

    // Obtener el PDF como array de bytes
    const pdfBytes = doc.output('arraybuffer')

    // Configurar headers para descarga
    const headers = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="orden-compra-${ordenCompra.idOrdenCompra}.pdf"`
    }

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)
    await auditoriaService.registrarAuditoria({
      idUsuario,
      accion: "GENERAR_PDF",
      tabla: "ordenCompra",
      idRegistro: ordenCompra.idOrdenCompra,
      detalles: `PDF generado para orden de compra #${ordenCompra.idOrdenCompra}`,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "IP no disponible",
      userAgent: request.headers.get("user-agent") || "User-Agent no disponible"
    })

    return new NextResponse(pdfBytes, { headers })

  } catch (error) {
    console.error("API: Error al generar PDF:", error)
    return NextResponse.json(
      { message: "Error al generar PDF", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError }
    )
  }
}

function generatePDFContent(doc, ordenCompra) {
  try {
    // Configurar página
    doc.setFontSize(20)
    doc.text('ORDEN DE COMPRA', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Número: ${ordenCompra.idOrdenCompra}`, 105, 30, { align: 'center' })

    // Información de la empresa
    doc.setFontSize(14)
    doc.text('DISTRISOFT', 105, 45, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Sistema de Gestión Empresarial', 105, 55, { align: 'center' })

    // Línea separadora
    doc.line(20, 65, 190, 65)

    // Información general
    doc.setFontSize(12)
    doc.text('INFORMACIÓN GENERAL', 20, 80)
    doc.setFontSize(10)
    doc.text(`Fecha: ${new Date(ordenCompra.fechaOrden).toLocaleDateString('es-ES')}`, 20, 90)
    doc.text(`Estado: ${ordenCompra.estadoOrdenCompra?.descEstadoOrdenCompra || 'N/A'}`, 20, 100)

    // Información del proveedor
    doc.setFontSize(12)
    doc.text('INFORMACIÓN DEL PROVEEDOR', 20, 120)
    doc.setFontSize(10)
    const proveedor = ordenCompra.cotizacionProveedor?.proveedor?.empresa
    if (proveedor) {
      doc.text(`Razón Social: ${proveedor.razonSocial || 'N/A'}`, 20, 130)
      doc.text(`RUC: ${proveedor.ruc || 'N/A'}`, 20, 140)
      doc.text(`Contacto: ${proveedor.contacto || 'N/A'}`, 20, 150)
      doc.text(`Teléfono: ${proveedor.telefono || 'N/A'}`, 20, 160)
    }

    // Detalles de materias primas
    doc.setFontSize(12)
    doc.text('DETALLE DE MATERIAS PRIMAS', 20, 180)
    doc.setFontSize(10)

    // Tabla de detalles
    const detalles = ordenCompra.cotizacionProveedor?.detallesCotizacionProv || []
    if (detalles.length > 0) {
      // Headers de la tabla
      doc.setFontSize(9)
      doc.text('Materia Prima', 20, 195)
      doc.text('Precio Unit.', 100, 195)
      doc.text('Cantidad', 140, 195)
      doc.text('Subtotal', 170, 195)

      // Línea bajo headers
      doc.line(20, 200, 190, 200)

      let yPosition = 210
      let totalGeneral = 0

      detalles.forEach((detalle) => {
        const subtotal = (detalle.precioUnitario || 0) * (detalle.cantidad || 0)
        totalGeneral += subtotal
        
        doc.text(detalle.materiaPrima?.nombreMateriaPrima || 'N/A', 20, yPosition)
        doc.text(new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(detalle.precioUnitario || 0), 100, yPosition)
        doc.text(detalle.cantidad?.toString() || '0', 140, yPosition)
        doc.text(new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(subtotal), 170, yPosition)
        
        yPosition += 10
      })

      // Total
      doc.setFontSize(12)
      doc.text(`TOTAL: ${new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(totalGeneral)}`, 140, yPosition + 10)
    }

    // Observaciones
    if (ordenCompra.observacion) {
      doc.setFontSize(12)
      doc.text('OBSERVACIONES', 20, 250)
      doc.setFontSize(10)
      
      // Dividir texto en líneas si es muy largo
      const maxWidth = 170
      const lines = doc.splitTextToSize(ordenCompra.observacion, maxWidth)
      doc.text(lines, 20, 260)
    }

    // Pie de página
    doc.setFontSize(8)
    doc.text('Documento generado automáticamente por el sistema Distrisoft', 105, 280, { align: 'center' })
    doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 105, 285, { align: 'center' })

  } catch (error) {
    console.error("Error generando contenido PDF:", error)
    // Si hay error, generar un PDF simple
    doc.setFontSize(16)
    doc.text('Error al generar PDF', 105, 50, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Orden de Compra #${ordenCompra.idOrdenCompra}`, 20, 70)
    doc.text(`Error: ${error.message}`, 20, 80)
  }
}