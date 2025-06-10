import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const rucParam = searchParams.get("ruc")
    const estadosParam = searchParams.get("estados") // Ej.: "RECIBIDO,ANULADO,PENDIENTE,PARCIAL"

    let whereCondition = {}

    // Si se busca por RUC (coincidencia parcial) en la empresa del proveedor:
    if (rucParam) {
      whereCondition = {
        ...whereCondition,
        cotizacionProveedor: {
          proveedor: {
            empresa: {
              ruc: {
                contains: rucParam,
                mode: "insensitive"
              }
            }
          }
        }
      }
    }

    // Si se busca por uno o varios estados:
    if (estadosParam) {
      const estadosArray = estadosParam.split(",").map(e => e.trim().toUpperCase())
      whereCondition = {
        ...whereCondition,
        estadoOrdenCompra: {
          descEstadoOrdenCompra: {
            in: estadosArray
          }
        }
      }
    }

    // Consultamos las órdenes de compra con sus relaciones
    const ordenes = await prisma.ordenCompra.findMany({
      where: whereCondition,
      include: {
        estadoOrdenCompra: true,
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true
              }
            }
          }
        },
        // Se mantiene facturaProveedor para otras consultas en caso necesario
        facturaProveedor: true,
      },
      orderBy: {
        fechaOrden: "asc",
      },
    })

    // Transformamos el resultado para devolver solo los campos necesarios:
    const resultado = ordenes.map(orden => {
      // Ahora, para el monto de compra se utiliza el monto total de la cotización, sin tener en cuenta las facturas.
      const montoCompra = Number(orden.cotizacionProveedor?.montoTotal || 0)

      const proveedor = orden.cotizacionProveedor?.proveedor?.empresa
      return {
        idOrdenCompra: orden.idOrdenCompra,
        fechaOrden: orden.fechaOrden,
        estado: orden.estadoOrdenCompra?.descEstadoOrdenCompra,
        montoCompra,
        proveedor: proveedor
          ? {
              nombre: proveedor.razonSocial,
              ruc: proveedor.ruc
            }
          : null
      }
    })

    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    console.error("Error al obtener las órdenes de compra:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}