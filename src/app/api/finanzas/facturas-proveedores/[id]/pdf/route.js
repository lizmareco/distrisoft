import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import puppeteer from "puppeteer"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID de factura inválido" }, { status: 400 })
    }

    // Obtener datos de la factura del proveedor
    const facturaDB = await prisma.facturaProveedor.findUnique({
      where: { idFacturaProveedor: id },
      include: {
        proveedor: {
          include: {
            persona: true,
          },
        },
        estadoFactuProveedor: true,
        metodoPago: true,
        detalleFacturaProveedor: {
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
        ordenCompra: true,
      },
    })

    if (!facturaDB) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    const factura = {
      numero: `FP-${String(facturaDB.idFacturaProveedor).padStart(6, "0")}`,
      numeroProveedor: facturaDB.nroFacturaProveedor || "N/A",
      timbrado: facturaDB.timbrado || "N/A",
      fechaEmision: facturaDB.fechaEmision.toLocaleDateString("es-PY"),
      fechaVencimiento: facturaDB.fechaVencimiento?.toLocaleDateString("es-PY") || "N/A",
      condicion: facturaDB.esContado ? "CONTADO" : "CREDITO",
      proveedor: {
        nombre: facturaDB.proveedor.persona
          ? `${facturaDB.proveedor.persona.nombre} ${facturaDB.proveedor.persona.apellido}`
          : `Proveedor #${facturaDB.proveedor.idProveedor}`,
        ruc: facturaDB.proveedor.persona?.nroDocumento || "N/A",
        direccion: facturaDB.proveedor.persona?.direccion || "N/A",
        telefono: facturaDB.proveedor.persona?.telefono || "N/A",
      },
      productos: (facturaDB.detalleFacturaProveedor || []).map((detalle) => ({
        cantidad: Math.round((detalle.cantidad || 0) / 1000),
        descripcion: detalle.producto?.nombreProducto || "Producto",
        unidad: "kg",
        precioUnitario: Math.round(Number.parseFloat(detalle.precioUnitario || 0) * 1000),
        subtotal: Number.parseFloat(detalle.subtotal || 0),
        iva: Number.parseFloat(detalle.montoImpuesto || 0),
        total: Number.parseFloat(detalle.totalLinea || 0),
      })),
      observaciones: facturaDB.observacion || "",
      ordenCompra: facturaDB.ordenCompra?.nroOrdenCompra || null,
    }

    // Generar HTML de la factura
    const htmlFactura = generarHTMLFacturaProveedor(factura)

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
      landscape: false,
      margin: {
        top: "0.5cm",
        right: "0.5cm",
        bottom: "0.5cm",
        left: "0.5cm",
      },
      printBackground: true,
      preferCSSPageSize: false,
    })

    await browser.close()

    // Retornar PDF
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factura-proveedor-${factura.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ success: false, error: "Error al generar PDF" }, { status: 500 })
  }
}

function generarHTMLFacturaProveedor(factura) {
  // Calcular totales
  const subtotalExentas = 0
  const subtotalIva5 = 0
  const subtotalIva10 = factura.productos.reduce((sum, p) => sum + p.subtotal, 0)
  const ivaCalculado5 = 0
  const ivaCalculado10 = factura.productos.reduce((sum, p) => sum + p.iva, 0)
  const totalIva = ivaCalculado5 + ivaCalculado10
  const totalGeneral = factura.productos.reduce((sum, p) => sum + p.total, 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura Proveedor ${factura.numero}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 10px; 
          margin: 0; 
          padding: 15px;
          width: 100%;
          box-sizing: border-box;
        }
        .header {
          border: 2px solid #000;
          margin-bottom: 15px;
          display: flex;
          min-height: 140px;
        }
        .left-section {
          flex: 1;
          padding: 15px;
          border-right: 2px solid #000;
          display: flex;
          flex-direction: column;
        }
        .right-section {
          width: 280px;
          padding: 15px;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .company-header {
          display: flex;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .logo {
          width: 70px;
          height: 70px;
          margin-right: 15px;
          flex-shrink: 0;
          border: 2px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          border-radius: 50%;
        }
        .company-info {
          flex: 1;
          text-align: center;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .company-subtitle {
          font-size: 11px;
          margin-bottom: 3px;
        }
        .company-activity {
          font-size: 9px;
          margin-bottom: 2px;
        }
        .company-address {
          font-size: 9px;
          margin-top: 5px;
        }
        .invoice-box {
          text-align: center;
        }
        .invoice-section {
          border: 2px solid #000;
          padding: 8px;
          margin-bottom: 8px;
          background: white;
        }
        .invoice-section-title {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 3px;
        }
        .invoice-section-value {
          font-size: 13px;
          font-weight: bold;
        }
        .condition-checkboxes {
          display: flex;
          justify-content: space-around;
          margin-top: 5px;
        }
        .condition-checkboxes label {
          font-size: 9px;
          display: flex;
          align-items: center;
        }
        .condition-checkboxes input {
          margin-right: 3px;
        }
        .supplier-info {
          border: 1px solid #000;
          padding: 15px;
          margin-bottom: 15px;
          background: #f9f9f9;
        }
        .supplier-info div {
          margin-bottom: 8px;
          font-size: 10px;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .products-table th,
        .products-table td {
          border: 1px solid #000;
          padding: 5px;
          text-align: center;
          font-size: 9px;
        }
        .products-table th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .products-table .desc-col {
          text-align: left;
        }
        .products-table .num-col {
          text-align: right;
        }
        .total-row {
          background: #f0f0f0;
          font-weight: bold;
        }
        .iva-section {
          border: 1px solid #000;
          padding: 10px;
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 9px;
        }
        .document-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #333;
        }
      </style>
    </head>
    <body>
      <!-- Título del documento -->
      <div class="document-title">FACTURA DE PROVEEDOR</div>

      <!-- Encabezado -->
      <div class="header">
        <div class="left-section">
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
        </div>
        
        <div class="right-section">
          <div class="invoice-box">
            <div class="invoice-section">
              <div class="invoice-section-title">R.U.C.</div>
              <div class="invoice-section-value">4006624-0</div>
            </div>
            
            <div class="invoice-section">
              <div class="invoice-section-title">FACTURA PROVEEDOR</div>
              <div class="invoice-section-value">${factura.numero}</div>
            </div>
            
            <div class="invoice-section">
              <div class="invoice-section-title">FACTURA ORIGINAL</div>
              <div class="invoice-section-value">${factura.numeroProveedor}</div>
            </div>
            
            <div class="invoice-section">
              <div class="invoice-section-title">TIMBRADO</div>
              <div class="invoice-section-value">${factura.timbrado}</div>
            </div>
            
            <div class="invoice-section">
              <div class="invoice-section-title">CONDICIÓN</div>
              <div class="condition-checkboxes">
                <label>
                  <input type="checkbox" ${factura.condicion === "CONTADO" ? "checked" : ""}> CONTADO
                </label>
                <label>
                  <input type="checkbox" ${factura.condicion === "CREDITO" ? "checked" : ""}> CRÉDITO
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Información del proveedor -->
      <div class="supplier-info">
        <div><strong>Fecha de Emisión:</strong> ${factura.fechaEmision}</div>
        <div><strong>Fecha de Vencimiento:</strong> ${factura.fechaVencimiento}</div>
        <div><strong>Proveedor:</strong> ${factura.proveedor.nombre}</div>
        <div><strong>R.U.C.:</strong> ${factura.proveedor.ruc}</div>
        <div><strong>Dirección:</strong> ${factura.proveedor.direccion}</div>
        <div><strong>Teléfono:</strong> ${factura.proveedor.telefono}</div>
        ${factura.ordenCompra ? `<div><strong>Orden de Compra:</strong> #${factura.ordenCompra}</div>` : ""}
      </div>

      <!-- Tabla de productos -->
      <table class="products-table">
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Descripción</th>
            <th>Unidad</th>
            <th>Precio<br>Unitario</th>
            <th>Exentas</th>
            <th>5%</th>
            <th>10%</th>
          </tr>
        </thead>
        <tbody>
          ${factura.productos
            .map(
              (producto) => `
            <tr>
              <td>${producto.cantidad}</td>
              <td class="desc-col">${producto.descripcion}</td>
              <td>${producto.unidad}</td>
              <td class="num-col">₲ ${producto.precioUnitario.toLocaleString("es-PY")}</td>
              <td></td>
              <td></td>
              <td class="num-col">₲ ${producto.total.toLocaleString("es-PY")}</td>
            </tr>
          `,
            )
            .join("")}
          ${Array.from({ length: Math.max(0, 8 - factura.productos.length) })
            .map(
              () => `
            <tr>
              <td>&nbsp;</td>
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
          <tr class="total-row">
            <td colspan="4"><strong>Sub Total:</strong></td>
            <td class="num-col">₲ ${subtotalExentas.toLocaleString("es-PY")}</td>
            <td class="num-col">₲ ${subtotalIva5.toLocaleString("es-PY")}</td>
            <td class="num-col">₲ ${subtotalIva10.toLocaleString("es-PY")}</td>
          </tr>
          <tr class="total-row">
            <td colspan="4"><strong>Total a Pagar Gs.:</strong></td>
            <td colspan="3" style="font-size: 14px; background: #f0f0f0;">
              <strong>₲ ${totalGeneral.toLocaleString("es-PY")}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Liquidación del IVA -->
      <div class="iva-section">
        <div><strong>Liquidación del I.V.A.:</strong></div>
        <div style="margin-top: 8px;">
          <span>(5%): ₲ ${ivaCalculado5.toLocaleString("es-PY")}</span> &nbsp;&nbsp;&nbsp;
          <span>(10%): ₲ ${ivaCalculado10.toLocaleString("es-PY")}</span> &nbsp;&nbsp;&nbsp;
          <span><strong>Total I.V.A.: ₲ ${totalIva.toLocaleString("es-PY")}</strong></span>
        </div>
      </div>

      ${
        factura.observaciones
          ? `
      <div style="border: 1px solid #000; padding: 10px; margin-bottom: 15px;">
        <div><strong>Observaciones:</strong></div>
        <div style="margin-top: 5px;">${factura.observaciones}</div>
      </div>
      `
          : ""
      }

      <div class="footer">
        Documento generado por Sistema de Gestión - Distribuidora Las Niñas
      </div>
    </body>
    </html>
  `
}
