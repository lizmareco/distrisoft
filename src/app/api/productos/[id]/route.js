import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"

// GET - Obtener un producto por ID
export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Obteniendo producto con ID: ${id}`)

    if (isNaN(id)) {
      console.log(`API: ID de producto inválido: ${params.id}`)
      return NextResponse.json({ error: "ID de producto inválido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Construir la consulta
    const whereClause = {
      idProducto: id,
      deletedAt: null, // Solo productos no eliminados
    }

    const producto = await prisma.producto.findFirst({
      where: whereClause,
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
      },
    })

    if (!producto) {
      console.log(`API: Producto con ID ${id} no encontrado`)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Mapear el producto para asegurar que tipoProducto tenga nombreTipoProducto
    const productoFormateado = { ...producto }
    if (productoFormateado.tipoProducto) {
      productoFormateado.tipoProducto = {
        ...productoFormateado.tipoProducto,
        nombreTipoProducto: productoFormateado.tipoProducto.descTipoProducto,
      }
    }

    console.log(`API: Producto con ID ${id} encontrado y formateado:`, {
      id: productoFormateado.idProducto,
      nombre: productoFormateado.nombreProducto,
      tipoProducto: productoFormateado.tipoProducto,
    })

    return NextResponse.json(productoFormateado, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener producto:", error)
    return NextResponse.json(
      { error: "Error al obtener producto: " + error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// PUT - Actualizar un producto
export async function PUT(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Actualizando producto con ID: ${id}`)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // En desarrollo, podemos usar un usuario ficticio
    let userData = { idUsuario: 1 }

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userFromToken = await authController.getUserFromToken(accessToken)
      if (userFromToken) {
        userData = userFromToken
      }
    }

    // Obtener datos del producto
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Verificar si el producto existe
    const productoExistente = await prisma.producto.findFirst({
      where: {
        idProducto: id,
        deletedAt: null,
      },
    })

    if (!productoExistente) {
      console.log(`API: Producto con ID ${id} no encontrado`)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si ya existe otro producto con el mismo nombre
    const productoConMismoNombre = await prisma.producto.findFirst({
      where: {
        nombreProducto: {
          equals: data.nombreProducto,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        idProducto: {
          not: id, // Excluir el producto actual
        },
        deletedAt: null,
      },
    })

    if (productoConMismoNombre) {
      console.log(`API: Ya existe otro producto con el nombre "${data.nombreProducto}"`)
      return NextResponse.json(
        { error: "Ya existe otro producto con este nombre" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Guardar el estado anterior para auditoría
    const productoAnterior = { ...productoExistente }

    // Actualizar el producto
    const producto = await prisma.producto.update({
      where: {
        idProducto: id,
      },
      data: {
        nombreProducto: data.nombreProducto,
        descripcion: data.descripcion,
        idTipoProducto: Number.parseInt(data.idTipoProducto),
        pesoUnidad: Number.parseFloat(data.pesoUnidad),
        precioUnitario: Number.parseFloat(data.precioUnitario),
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        idEstadoProducto: Number.parseInt(data.idEstadoProducto),
        updatedAt: new Date(),
        unidadesPorPaquete: datos.unidadesPorPaquete || 1,
        ventaPorPaquete: datos.ventaPorPaquete || false,
        paqueteMinimo: datos.paqueteMinimo,
      },
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Producto",
      idRegistro: id.toString(),
      accion: "ACTUALIZAR",
      valorAnterior: productoAnterior,
      valorNuevo: producto,
      idUsuario: userData.idUsuario,
      request: request,
    })

    console.log(`API: Producto con ID ${id} actualizado correctamente`)
    return NextResponse.json(
      { message: "Producto actualizado correctamente", producto },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al actualizar producto:", error)
    return NextResponse.json(
      { error: "Error al actualizar producto: " + error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// DELETE - Eliminar un producto (soft delete)
export async function DELETE(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Eliminando producto con ID: ${id}`)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // En desarrollo, podemos usar un usuario ficticio
    let userData = { idUsuario: 1 }

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userFromToken = await authController.getUserFromToken(accessToken)
      if (userFromToken) {
        userData = userFromToken
      }
    }

    // Verificar si el producto existe
    const productoExistente = await prisma.producto.findFirst({
      where: {
        idProducto: id,
        deletedAt: null,
      },
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
      },
    })

    if (!productoExistente) {
      console.log(`API: Producto con ID ${id} no encontrado`)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Guardar el estado anterior para auditoría
    const productoAnterior = { ...productoExistente }

    // Eliminar el producto (soft delete)
    const producto = await prisma.producto.update({
      where: {
        idProducto: id,
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Producto",
      idRegistro: id.toString(),
      accion: "ELIMINAR",
      valorAnterior: productoAnterior,
      valorNuevo: null,
      idUsuario: userData.idUsuario,
      request: request,
    })

    console.log(`API: Producto con ID ${id} eliminado correctamente`)
    return NextResponse.json({ message: "Producto eliminado correctamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al eliminar producto:", error)
    return NextResponse.json(
      { error: "Error al eliminar producto: " + error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
