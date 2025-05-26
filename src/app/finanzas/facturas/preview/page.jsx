"use client"

import { useState } from "react"
import { Container, Button, Box } from "@mui/material"
import { Print, PictureAsPdf } from "@mui/icons-material"
import FacturaOficial from "@/components/facturas/FacturaOficial"

export default function PreviewFacturaPage() {
  const [openPreview, setOpenPreview] = useState(false)

  // Datos de ejemplo para la factura
  const datosFacturaEjemplo = {
    numero: "001-001-0000896",
    timbrado: "17184746",
    fechaEmision: "26/01/2025",
    condicion: "CONTADO",
    cliente: {
      nombre: "JUAN CARLOS PÉREZ GONZÁLEZ",
      ruc: "12345678-9",
      direccion: "BARRIO SAN VICENTE, CALLE PRINCIPAL 123",
      telefono: "(021) 555-0456",
    },
    productos: [
      {
        cantidad: 2,
        descripcion: "PAN FRANCÉS x 50 UNIDADES",
        precioUnitario: 25000,
        exentas: 0,
        iva5: 0,
        iva10: 50000,
      },
      {
        cantidad: 1,
        descripcion: "TORTA DE CHOCOLATE MEDIANA",
        precioUnitario: 85000,
        exentas: 0,
        iva5: 0,
        iva10: 85000,
      },
      {
        cantidad: 3,
        descripcion: "EMPANADAS DE CARNE x 6 UNIDADES",
        precioUnitario: 18000,
        exentas: 0,
        iva5: 54000,
        iva10: 0,
      },
    ],
    observaciones: "Entrega a domicilio incluida. Gracias por su preferencia.",
  }

  const handlePrint = () => {
    window.print()
  }

  const handleGeneratePDF = () => {
    // Aquí se implementaría la generación de PDF
    console.log("Generando PDF...")
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <h1>Vista Previa de Factura</h1>
        <Box>
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} sx={{ mr: 2 }}>
            Imprimir
          </Button>
          <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleGeneratePDF}>
            Generar PDF
          </Button>
        </Box>
      </Box>

      <FacturaOficial datosFactura={datosFacturaEjemplo} />

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </Container>
  )
}
