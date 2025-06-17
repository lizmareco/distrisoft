// src/lib/api/ajustarStockProducto.js
import { prisma } from "@/prisma/client";

export async function ajustarStockProducto({ idProducto, cantidad, motivo, observacion, idOrdenProduccion }) {
  // Obtener el producto y su unidad de medida
  const producto = await prisma.producto.findUnique({
    where: { idProducto, deletedAt: null },
    include: { unidadMedida: true }
  });
  if (!producto) throw new Error("Producto no encontrado");

  const stockAnterior = Number.parseFloat(producto.stockActual || 0);
  const nuevoStock = stockAnterior + Number.parseFloat(cantidad);

  if (nuevoStock < 0) throw new Error("El stock no puede ser negativo");

  // Actualizar el stock
  await prisma.producto.update({
    where: { idProducto },
    data: {
      stockActual: nuevoStock,
      updatedAt: new Date(),
    },
  });

  // Registrar el movimiento
  await prisma.inventarioProducto.create({
    data: {
      idProducto,
      cantidad: Math.abs(cantidad),
      tipoMovimiento: cantidad > 0 ? "ENTRADA" : "SALIDA",
      fechaMovimiento: new Date(),
      motivo: motivo || "Ajuste de stock",
      observacion: observacion || "",
      stockAntes: stockAnterior,
      stockDespues: nuevoStock,
      unidadMedida: producto.unidadMedida.descUnidadMedida,
      idOrdenProduccion: idOrdenProduccion || null,
    },
  });
}