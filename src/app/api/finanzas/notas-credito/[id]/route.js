import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

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

    // Datos de empresa fijos
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

    const data = {
      nroNota: nota.nroNota,
      fechaEmision: nota.fechaEmision,
      motivo: nota.motivo,
      nroFacturaOrigen: nota.facturaOrigen?.nroFactura || null,
      cliente: {
        nombre: `${nota.facturaOrigen?.cliente?.persona?.nombre || ""} ${nota.facturaOrigen?.cliente?.persona?.apellido || ""}`.trim(),
        ruc: nota.facturaOrigen?.cliente?.persona?.nroDocumento || "",
      },
      detalles: nota.detallesNota.map((d) => ({
        cantidad: d.cantidad,
        nombreProducto: d.detalleFacturaOrig.producto?.nombreProducto || "Producto",
        descripcion: d.detalleFacturaOrig.producto?.descripcion || "",
        pesoUnidad: d.detalleFacturaOrig.producto?.pesoUnidad || null,
        precioUnitario: d.precioUnitario,
      })),
      montoTotal: nota.montoTotal,
      empresa,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error al obtener nota de crédito:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// Anular una nota de crédito (soft delete: marca como anulada)
export async function PATCH(request, { params }) {
  const { id } = await params; // <-- importante, await aquí

  if (!id) {
    console.warn('PATCH llamado sin ID:', params);
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  try {
    const nota = await prisma.notaCredito.update({
      where: { idNota: Number(id) },
      data: {
        deletedAt: new Date()
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al anular nota:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 