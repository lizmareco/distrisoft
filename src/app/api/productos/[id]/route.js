import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import cookie from "cookie" 

async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  // Leer la cookie "at" del header (para Next.js App Router y API routes modernas)
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader)
    token = cookies.at
  }

  // Fallback: Authorization header (Bearer)
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }

  if (!token) {
    console.warn("NO TOKEN FOUND, defaulting to 1")
    return 1
  }

  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}

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

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

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

    // Calcular precio unitario automáticamente
    let precioUnitarioCalculado = data.precioUnitario
    if (data.costoPorPaquete && data.unidadesPorPaquete && data.unidadesPorPaquete > 0) {
      precioUnitarioCalculado = Number.parseFloat(data.costoPorPaquete) / Number.parseInt(data.unidadesPorPaquete)
    }

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
        precioUnitario: Number.parseFloat(precioUnitarioCalculado),
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        idEstadoProducto: Number.parseInt(data.idEstadoProducto),
        updatedAt: new Date(),
        // Nuevos campos
        unidadesPorPaquete: data.unidadesPorPaquete ? Number.parseInt(data.unidadesPorPaquete) : 1,
        ventaPorPaquete: Boolean(data.ventaPorPaquete),
        paqueteMinimo: data.paqueteMinimo ? Number.parseInt(data.paqueteMinimo) : 1,
        costoPorPaquete: data.costoPorPaquete ? Number.parseFloat(data.costoPorPaquete) : 0,
      },
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
      },
    })

    // Registrar la acción en auditoría
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Llamar con método correcto
    await auditoriaService.registrarActualizacion(
      "Producto",
      id,
      productoAnterior,
      producto,
      idUsuario,
      direccionIP,
      navegador,
    )

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

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


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
    // Extraer información del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Llamar con método correcto
    await auditoriaService.registrarEliminacion(
      "Producto",
      id,
      productoAnterior,
      idUsuario,
      direccionIP,
      navegador,
    )
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
