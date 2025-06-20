import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { id } = params
    const notaId = Number(id)

    if (!notaId || isNaN(notaId)) {
      return NextResponse.json({ error: 'ID de nota inválido' }, { status: 400 })
    }

    const nota = await prisma.notaDebito.findUnique({
      where: { id_notadb: notaId },
      include: {
        detalles: { include: { impuesto: true } },
        factura: {
          include: {
            cliente: {
              include: { persona: true }
            }
          }
        }
      }
    })

    if (!nota) {
      return NextResponse.json({ error: 'Nota de débito no encontrada' }, { status: 404 })
    }


    const html = generarHTMLNotaDebito({
      numero: nota.nro_nota || `#${nota.id_notadb}`,
      fecha: nota.fecha_emision.toLocaleDateString("es-PY"),
      motivo: nota.motivo,
      factura: nota.factura?.nroFactura ? `001-001-${String(nota.factura.nroFactura).padStart(7, "0")}` : "-",
      cliente: {
        nombre: `${nota.factura.cliente.persona.nombre} ${nota.factura.cliente.persona.apellido}`,
        ruc: nota.factura.cliente.persona.nroDocumento,
      },
      detalles: nota.detalles.map((d) => ({
        concepto: d.concepto,
        cantidad: d.cantidad,
        precioUnitario: d.precio_unitario,
        montoImpuesto: d.monto_impuesto,
        totalItem: d.total_item,
      })),
    })
    
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
        "Content-Disposition": `attachment; filename=nota-debito-${nota.id_notadb}.pdf`,
      },
    })
  } catch (error) {
    console.error('Error al generar PDF de nota de débito:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

function generarHTMLNotaDebito(nota) {
  const total = nota.detalles.reduce((sum, p) => sum + p.totalItem, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nota de Débito ${nota.numero}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 15px; width: 100%; box-sizing: border-box; }
        .header { border: 2px solid #000; margin-bottom: 15px; display: flex; min-height: 120px; }
        .left-section { flex: 1; padding: 15px; border-right: 2px solid #000; display: flex; flex-direction: column; }
        .right-section { width: 280px; padding: 15px; background: #f5f5f5; display: flex; flex-direction: column; justify-content: space-between; }
        .company-info { flex: 1; text-align: center; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
        .company-subtitle { font-size: 11px; margin-bottom: 3px; }
        .company-activity { font-size: 9px; margin-bottom: 2px; }
        .company-address { font-size: 9px; margin-top: 5px; }
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
            <div class="company-name">DISTRIBUIDORA "LAS NIÑAS"</div>
            <div class="company-subtitle">de Victor Manuel Barreto Barrios</div>
            <div class="company-activity">ELABORACIÓN DE COMIDAS Y PLATOS PREPARADOS</div>
            <div class="company-activity">COMERCIO AL POR MAYOR DE COMESTIBLES, EXCEPTO CARNES</div>
            <div class="company-activity">OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P</div>
            <div class="company-address">NATALICIO TALAVERA C/ TTE ROJAS NRO 277 - LUQUE</div>
            <div class="company-address">(0993) 540-258</div>
          </div>
        </div>
        <div class="right-section">
          <div style="border:2px solid #000; padding:8px; background:#fff; text-align:center; margin-bottom:8px;">
            <div style="font-weight:bold;">TIMBRADO Nº</div>
            <div style="font-weight:bold;">17184746</div>
            <div style="font-weight:bold; margin-top:6px;">R.U.C.</div>
            <div style="font-weight:bold;">4006624-0</div>
            <div style="font-weight:bold; margin-top:6px;">NOTA DE DÉBITO</div>
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
            <strong>Comprobante de Venta:</strong><br/>${nota.factura}<br/>
            <strong>Motivo:</strong><br/>${nota.motivo}
          </td>
        </tr>
      </table>
      <table class="main-table">
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Descripción</th>
            <th>Precio Unitario</th>
            <th>Impuesto</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${nota.detalles
            .map(
              (item) => `
                <tr>
                  <td>${item.cantidad}</td>
                  <td class="left">${item.concepto}</td>
                  <td>₲ ${item.precioUnitario.toLocaleString("es-PY")}</td>
                  <td>₲ ${item.montoImpuesto.toLocaleString("es-PY")}</td>
                  <td>₲ ${item.totalItem.toLocaleString("es-PY")}</td>
                </tr>`
            )
            .join("")}
          ${Array.from({ length: Math.max(0, 6 - nota.detalles.length) })
            .map(
              () => `
                <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>`
            )
            .join("")}
          <tr style="background-color:#e0e0e0;">
            <td colspan="4" style="text-align:center; font-weight:bold;">TOTAL A DEBITAR:</td>
            <td style="text-align:center; font-weight:bold;">₲ ${total.toLocaleString("es-PY")}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `
}
