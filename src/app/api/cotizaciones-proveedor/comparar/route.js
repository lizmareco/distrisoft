// src/app/api/cotizaciones-proveedor/comparar/route.js

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get("ids")

    if (!idsParam) {
      return NextResponse.json({ error: "No se proporcionaron IDs" }, { status: 400 })
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id))

    if (ids.length < 2) {
      return NextResponse.json({ error: "Debe seleccionar al menos dos cotizaciones" }, { status: 400 })
    }

    const cotizaciones = await prisma.cotizacionProveedor.findMany({
      where: {
        idCotizacionProveedor: {
          in: ids
        },
        deletedAt: null
      },
      include: {
        detallesCotizacionProv: {
          include: {
            materiaPrima: true
          }
        },
        proveedor: {
          include: {
            empresa: true
          }
        }
      }
    })
    

    // Validar que no haya cotizaciones del mismo proveedor
    const proveedorIds = cotizaciones.map((c) => c.idProveedor)
    const proveedorUnicos = new Set(proveedorIds)
    if (proveedorUnicos.size !== cotizaciones.length) {
      return NextResponse.json(
        { error: "No se pueden comparar cotizaciones del mismo proveedor." },
        { status: 400 }
      )
    }

    const resultado = cotizaciones.map((c) => ({
      idCotizacionProveedor: c.idCotizacionProveedor,
      proveedor: c.proveedor.empresa.razonSocial,
      detalles: c.detallesCotizacionProv.map((d) => ({
        nombre: d.materiaPrima.nombreMateriaPrima,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.subtotal,
      })),
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al obtener comparación de cotizaciones:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
