import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import puppeteer from "puppeteer"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "contado"
    const id = Number.parseInt(params.id)

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID de factura inválido" }, { status: 400 })
    }

    // Obtener datos de la factura
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
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal,
            montoImpuesto: detalle.montoImpuesto,
            totalLinea: detalle.totalLinea,
            impuesto: detalle.impuesto.descImpuesto,
          })),
        }
      }
    }

    if (!factura) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // Generar HTML de la factura
    const htmlFactura = generarHTMLFactura(factura)

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(htmlFactura, { waitUntil: "networkidle0" })
    await page.evaluateHandle("document.fonts.ready")

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      margin: {
        top: "0.3cm",
        right: "0.3cm",
        bottom: "0.3cm",
        left: "0.3cm",
      },
      printBackground: true,
      preferCSSPageSize: false,
    })

    await browser.close()

    // Retornar PDF
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factura-${factura.nroFactura}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ success: false, error: "Error al generar PDF" }, { status: 500 })
  }
}

function generarHTMLFactura(factura) {
  // Solo calcular IVA 10%
  const subtotalIva10 = factura.detalles.reduce((sum, d) => sum + d.subtotal, 0)
  const ivaCalculado10 = subtotalIva10 * 0.1
  const totalIva = ivaCalculado10

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura ${factura.nroFactura}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 9px; 
          margin: 0; 
          padding: 10px;
          width: 100%;
          box-sizing: border-box;
        }
        .header {
          border: 2px solid #000;
          padding: 0;
          margin-bottom: 10px;
          display: flex;
          min-height: 120px;
        }
        .left-section {
          flex: 1;
          padding: 12px;
          border-right: 2px solid #000;
          display: flex;
          flex-direction: column;
        }
        .right-section {
          width: 300px;
          padding: 12px;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .company-header {
          display: flex;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        .logo {
          width: 60px;
          height: 60px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .logo img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          filter: grayscale(100%) contrast(1.2);
        }
        .company-info {
          flex: 1;
          text-align: center;
        }
        .company-subtitle {
          font-size: 9px;
          margin-bottom: 2px;
        }
        .company-activity {
          font-size: 10px;
          margin-bottom: 1px;
        }
        .company-address {
          font-size: 10px;
          margin-top: 4px;
        }
        .client-info {
          margin-top: auto;
        }
        .client-info div {
          margin-bottom: 6px;
        }
        .invoice-box {
          border: 2px solid #000;
          padding: 15px;
          background: white;
          text-align: center;
        }
        .invoice-section {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #000;
        }
        .invoice-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .invoice-section-title {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 5px;
        }
        .invoice-section-value {
          font-size: 14px;
          font-weight: bold;
        }
        .condition-checkboxes {
          display: flex;
          justify-content: space-around;
          margin-top: 8px;
        }
        .condition-checkboxes label {
          font-size: 10px;
          display: flex;
          align-items: center;
        }
        .condition-checkboxes input {
          margin-right: 5px;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .products-table th,
        .products-table td {
          border: 1px solid #000;
          padding: 6px;
          text-align: center;
          font-size: 9px;
        }
        .products-table th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .totals-section {
          display: flex;
          gap: 15px;
        }
        .iva-section {
          flex: 1;
          border: 1px solid #000;
          padding: 12px;
        }
        .total-section {
          flex: 1;
          border: 1px solid #000;
          padding: 12px;
          display: flex;
          align-items: flex-end;
        }
        .total-amount {
          border: 2px solid #000;
          padding: 8px;
          text-align: center;
          background: #f5f5f5;
          font-size: 14px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 9px;
        }
      </style>
    </head>
    <body>
      <!-- Encabezado con dos secciones -->
      <div class="header">
        <!-- Sección izquierda: Empresa y Cliente -->
        <div class="left-section">
          <!-- Información de la empresa -->
          <div class="company-header">
            <div class="logo">
              <img src="/logo.png" alt="Logo Las Niñas">
            </div>
            <div class="company-info">
              <div class="company-name">DISTRIBUIDORA 'LAS NIÑAS'</div>
              <div class="company-subtitle">de Victor Manuel Barreto Barrios</div>
              <div class="company-activity">ELABORACIÓN DE COMIDAS Y PLATOS PREPARADOS</div>
              <div class="company-activity">COMERCIO AL POR MAYOR DE COMESTIBLES, EXCEPTO CARNES</div>
              <div class="company-activity">COMERCIO AL POR MENOR DE OTROS ARTICULOS N.C.P</div>
              <div class="company-activity">OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P</div>
              <div class="company-address">NATALICIO TALAVERA C/ TTE ROJAS NRO 277 - LUQUE</div>
              <div class="company-address">TELÉFONO: (0993) 540-258</div>
            </div>
          </div>
          
          <!-- Información del cliente -->
          <div class="client-info">
            <div><strong>FECHA DE EMISIÓN:</strong> ${new Date(factura.fechaEmision).toLocaleDateString("es-PY")}</div>
            <div><strong>NOMBRE O RAZÓN SOCIAL:</strong> ${factura.cliente.nombre}</div>
            <div><strong>R.U.C.:</strong> ${factura.cliente.documento || "N/A"}</div>
            <div><strong>DIRECCIÓN:</strong> ${factura.cliente.direccion || "N/A"}</div>
          </div>
        </div>
        
        <!-- Sección derecha: Datos de factura -->
        <div class="right-section">
          <div class="invoice-box">
            <div class="invoice-section">
              <div class="invoice-section-title">R.U.C.</div>
              <div class="invoice-section-value">4006624-0</div>
            </div>
            
            <div class="invoice-section">
              <div class="invoice-section-title">TIMBRADO Nº</div>
              <div class="invoice-section-value">17184746</div>
            </div>
            
            <div class="invoice-section">
              <div class="invoice-section-title">FACTURA</div>
              <div class="invoice-section-value">Nº 001-001-${String(factura.nroFactura).padStart(7, "0")}</div>
            </div>
            
            <div class="invoice-section">
              <div class="invoice-section-title">CONDICIÓN DE VENTA</div>
              <div class="condition-checkboxes">
                <label>
                  <input type="checkbox" ${factura.tipo === "contado" ? "checked" : ""}> CONTADO
                </label>
                <label>
                  <input type="checkbox" ${factura.tipo === "credito" ? "checked" : ""}> CRÉDITO
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de productos -->
      <table class="products-table">
        <thead>
          <tr>
            <th>CANT.</th>
            <th>DESCRIPCIÓN</th>
            <th>PRECIO<br>UNITARIO</th>
            <th>EXENTAS</th>
            <th>5%</th>
            <th>10%</th>
          </tr>
        </thead>
        <tbody>
          ${factura.detalles
            .map(
              (detalle) => `
            <tr>
              <td>${detalle.cantidad}</td>
              <td style="text-align: left;">${detalle.descripcion}</td>
              <td>₲ ${detalle.precioUnitario.toLocaleString("es-PY")}</td>
              <td></td>
              <td></td>
              <td>₲ ${detalle.subtotal.toLocaleString("es-PY")}</td>
            </tr>
          `,
            )
            .join("")}
          ${Array.from({ length: Math.max(0, 6 - factura.detalles.length) })
            .map(
              () => `
            <tr>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <!-- Totales -->
      <div class="totals-section">
        <div class="iva-section">
          <div><strong>LIQUIDACIÓN DEL I.V.A.</strong></div>
          <div style="margin-top: 8px;">
            <div>Sub Total Exentas: ₲ 0</div>
            <div>Sub Total 5%: ₲ 0</div>
            <div>Sub Total 10%: ₲ ${subtotalIva10.toLocaleString("es-PY")}</div>
            <hr>
            <div>I.V.A. 5%: ₲ 0</div>
            <div>I.V.A. 10%: ₲ ${ivaCalculado10.toLocaleString("es-PY")}</div>
            <div><strong>TOTAL I.V.A.: ₲ ${totalIva.toLocaleString("es-PY")}</strong></div>
          </div>
        </div>
        
        <div class="total-section">
          <div style="width: 100%;">
            <div style="margin-bottom: 15px;"><strong>TOTAL GENERAL Gs.</strong></div>
            <div class="total-amount">₲ ${factura.montoTotal.toLocaleString("es-PY")}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        Original: Blanco - Comprador | Duplicado: Amarillo - Vendedor | Triplicado: Rosado - Archivo
      </div>
    </body>
    </html>
  `
}
