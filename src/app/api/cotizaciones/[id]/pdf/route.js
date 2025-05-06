import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import autoTable from "jspdf-autotable"

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Generando PDF para cotización con ID: ${id}`)

    // Obtener la cotización con todos sus detalles
    const cotizacion = await prisma.cotizacionCliente.findUnique({
      where: {
        idCotizacionCliente: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        cliente: {
          include: {
            persona: {
              include: {
                tipoDocumento: true,
              },
            },
            empresa: true,
            sectorCliente: true,
          },
        },
        usuario: {
          include: {
            persona: true,
          },
        },
        estadoCotizacionCliente: true,
        detalleCotizacionCliente: {
          include: {
            producto: {
              include: {
                unidadMedida: true,
              },
            },
          },
        },
      },
    })

    if (!cotizacion) {
      console.error(`API: Cotización con ID ${id} no encontrada`)
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    console.log(`API: Cotización encontrada, generando PDF...`)

    // Función para formatear moneda
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(amount)
    }

    // Crear un nuevo documento PDF
    const doc = new jsPDF()

    // Configurar el documento
    doc.setFont("helvetica")
    doc.setFontSize(20)
    doc.text("COTIZACIÓN", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" })

    // Información de la cotización
    doc.setFontSize(12)
    doc.text(`Cotización #: ${cotizacion.idCotizacionCliente}`, doc.internal.pageSize.getWidth() - 20, 40, {
      align: "right",
    })
    doc.text(
      `Fecha: ${format(new Date(cotizacion.fechaCotizacion), "dd/MM/yyyy", { locale: es })}`,
      doc.internal.pageSize.getWidth() - 20,
      47,
      { align: "right" },
    )
    doc.text(
      `Estado: ${cotizacion.estadoCotizacionCliente.descEstadoCotizacionCliente}`,
      doc.internal.pageSize.getWidth() - 20,
      54,
      { align: "right" },
    )
    doc.text(`Validez: ${cotizacion.validez} días`, doc.internal.pageSize.getWidth() - 20, 61, { align: "right" })

    // Información del cliente
    doc.setFontSize(14)
    doc.text("Información del Cliente", 20, 75)
    doc.line(20, 77, 100, 77) // Subrayado

    doc.setFontSize(12)
    doc.text(`Cliente: ${cotizacion.cliente.persona.nombre} ${cotizacion.cliente.persona.apellido}`, 20, 85)
    doc.text(
      `Documento: ${cotizacion.cliente.persona.tipoDocumento.descTipoDocumento}: ${cotizacion.cliente.persona.nroDocumento}`,
      20,
      92,
    )
    doc.text(`Sector: ${cotizacion.cliente.sectorCliente.descSectorCliente}`, 20, 99)

    if (cotizacion.cliente.empresa) {
      doc.text(`Empresa: ${cotizacion.cliente.empresa.razonSocial}`, 20, 106)
    }

    // Información del vendedor
    doc.setFontSize(14)
    doc.text("Información del Vendedor", 20, 120)
    doc.line(20, 122, 120, 122) // Subrayado

    doc.setFontSize(12)
    doc.text(`Vendedor: ${cotizacion.usuario.persona.nombre} ${cotizacion.usuario.persona.apellido}`, 20, 130)

    // Tabla de productos
    doc.setFontSize(14)
    doc.text("Detalle de Productos", 20, 145)
    doc.line(20, 147, 110, 147) // Subrayado

    // Preparar datos para la tabla
    const tableHeaders = [["Producto", "Precio Unitario", "Cantidad", "Subtotal"]]
    const tableData = cotizacion.detalleCotizacionCliente.map((detalle) => {
      const precioUnitario = detalle.subtotal / detalle.cantidad
      return [
        detalle.producto.nombreProducto,
        formatCurrency(precioUnitario),
        detalle.cantidad.toString(),
        formatCurrency(detalle.subtotal),
      ]
    })

    // Añadir fila de total
    tableData.push([
      { content: "", colSpan: 2 },
      { content: "TOTAL:", styles: { fontStyle: "bold", halign: "right" } },
      { content: formatCurrency(cotizacion.montoTotal), styles: { fontStyle: "bold", halign: "right" } },
    ])

    // Generar la tabla
    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 155,
      theme: "grid",
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 40, halign: "right" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 40, halign: "right" },
      },
    })

    // Pie de página
    const finalY = doc.lastAutoTable.finalY + 20
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(
      "Esta cotización es válida por el período especificado y está sujeta a nuestros términos y condiciones.",
      doc.internal.pageSize.getWidth() / 2,
      finalY,
      { align: "center" },
    )

    // Convertir el PDF a un array buffer
    const pdfBuffer = doc.output("arraybuffer")

    console.log(`API: PDF generado exitosamente, enviando respuesta...`)

    // Crear la respuesta con el PDF
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cotizacion-${id}.pdf"`,
        "Cache-Control": "no-cache",
      },
    })

    return response
  } catch (error) {
    console.error(`API: Error al generar PDF para cotización:`, error)
    return NextResponse.json(
      { message: "Error al generar PDF", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
