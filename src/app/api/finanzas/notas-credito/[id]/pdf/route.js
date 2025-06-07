import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import puppeteer from "puppeteer"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const nota = await prisma.notaCredito.findUnique({
      where: { idNota: id },
      include: {
        facturaOrigen: {
          include: {
            cliente: { include: { persona: true } },
          },
        },
        detallesNota: {
          include: {
            detalleFacturaOrig: {
              include: { producto: true },
            },
          },
        },
      },
    })

    if (!nota) {
      return NextResponse.json({ success: false, error: "Nota de crédito no encontrada" }, { status: 404 })
    }

    const numeroFormateado = nota.nroNota

    // Obtener datos de empresa y nroFacturaOrigen formateado
    const empresa = {
      nombre: "DISTRIBUIDORA 'LAS NIÑAS'",
      propietario: "de Victor Manuel Barreto Barrios",
      actividad1: "ELABORACIÓN DE COMIDAS Y PLATOS PREPARADOS",
      actividad2: "COMERCIO AL POR MAYOR DE COMESTIBLES, EXCEPTO CARNES",
      actividad3: "OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P",
      direccion: "NATALICIO TALAVERA C/ TTE ROJAS NRO 277 - LUQUE",
      telefono: "(0993) 540-258",
      timbrado: "17184746",
      ruc: "4006624-0",
    }
    const nroFacturaOrigen = nota.facturaOrigen?.nroFactura
      ? `001-001-${String(nota.facturaOrigen.nroFactura).padStart(7, "0")}`
      : "-"

    const data = {
      numero: numeroFormateado,
      fecha: nota.fechaEmision.toLocaleDateString("es-PY"),
      motivo: nota.motivo,
      comprobante: nroFacturaOrigen,
      cliente: {
        nombre: `${nota.facturaOrigen.cliente.persona.nombre} ${nota.facturaOrigen.cliente.persona.apellido}`,
        ruc: nota.facturaOrigen.cliente.persona.nroDocumento,
      },
      productos: nota.detallesNota.map((d) => ({
        descripcion: d.detalleFacturaOrig.producto.nombreProducto,
        cantidad: d.cantidad,
        precio: d.precioUnitario,
        total: d.cantidad * d.precioUnitario,
      })),
      empresa,
    }

    const html = generarHTMLNota(data)

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    await page.evaluateHandle("document.fonts.ready")

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
    })

    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=nota-credito-${data.numero}.pdf`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF de nota de crédito:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

function generarHTMLNota(nota) {
  const total = nota.productos.reduce((sum, p) => sum + p.total, 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nota de Crédito ${nota.numero}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 15px; width: 100%; box-sizing: border-box; }
        .header { border: 2px solid #000; margin-bottom: 15px; display: flex; min-height: 120px; }
        .left-section { flex: 1; padding: 15px; border-right: 2px solid #000; display: flex; flex-direction: column; }
        .right-section { width: 280px; padding: 15px; background: #f5f5f5; display: flex; flex-direction: column; justify-content: space-between; }
        .company-header { display: flex; align-items: flex-start; margin-bottom: 20px; }
        .company-info { flex: 1; text-align: center; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
        .company-subtitle { font-size: 11px; margin-bottom: 3px; }
        .company-activity { font-size: 9px; margin-bottom: 2px; }
        .company-address { font-size: 9px; margin-top: 5px; }
        .invoice-box { }
        .main-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .main-table th, .main-table td { border: 1px solid #000; padding: 6px; text-align: center; }
        .main-table th { background-color: #f0f0f0; }
        .main-table .left { text-align: left; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="left-section">
          <div class="company-info">
            <div class="company-name">${nota.empresa.nombre}</div>
            <div class="company-subtitle">${nota.empresa.propietario}</div>
            <div class="company-activity">${nota.empresa.actividad1}</div>
            <div class="company-activity">${nota.empresa.actividad2}</div>
            <div class="company-activity">${nota.empresa.actividad3}</div>
            <div class="company-address">${nota.empresa.direccion}</div>
            <div class="company-address">${nota.empresa.telefono}</div>
          </div>
        </div>
        <div class="right-section">
          <div style="border:2px solid #000; padding:8px; background:#fff; text-align:center; margin-bottom:8px;">
            <div style="font-weight:bold;">TIMBRADO Nº</div>
            <div style="font-weight:bold;">${nota.empresa.timbrado}</div>
            <div style="font-weight:bold; margin-top:6px;">R.U.C.</div>
            <div style="font-weight:bold;">${nota.empresa.ruc}</div>
            <div style="font-weight:bold; margin-top:6px;">NOTA DE CRÉDITO</div>
            <div style="font-size:16px; font-weight:bold;">Nº ${nota.numero}</div>
          </div>
          <div style="border:2px solid #000; padding:8px; background:#fff; text-align:center;">
            <div style="font-weight:bold;">Fecha de Emisión</div>
            <div style="font-weight:bold;">${nota.fecha}</div>
          </div>
        </div>
      </div>
      <table style="width:100%; margin-bottom:10px;">
        <tr>
          <td style="border:1px solid #000; padding:6px; width:60%;">
            <strong>Cliente o Razón Social:</strong> ${nota.cliente.nombre}<br/>
            <strong>R.U.C.:</strong> ${nota.cliente.ruc}
          </td>
          <td style="border:1px solid #000; padding:6px; width:40%; text-align:center;">
            <strong>Comprobante de Venta:</strong><br/>${nota.comprobante}<br/>
            <strong>Motivo:</strong><br/>${nota.motivo}
          </td>
        </tr>
      </table>
      <table class="main-table">
        <thead>
          <tr>
            <th style="width:8%">Cant.</th>
            <th style="width:60%">Descripción</th>
            <th style="width:16%">Precio Unitario</th>
            <th style="width:16%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${nota.productos
            .map(
              (p) => `
                <tr>
                  <td>${p.cantidad}</td>
                  <td class="left">${p.descripcion}</td>
                  <td>₲ ${p.precio.toLocaleString("es-PY")}</td>
                  <td>₲ ${p.total.toLocaleString("es-PY")}</td>
                </tr>`
            )
            .join("")}
          ${Array.from({ length: Math.max(0, 6 - nota.productos.length) })
            .map(
              () => `
                <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>`
            )
            .join("")}
          <tr style="background-color:#e0e0e0;">
            <td colspan="3" style="text-align:center; font-weight:bold;">TOTAL A ACREDITAR:</td>
            <td style="text-align:center; font-weight:bold; font-size:1rem;">₲ ${total.toLocaleString("es-PY")}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `
}
