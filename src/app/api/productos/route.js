import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
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

// GET - Obtener todos los productos (activos e inactivos)
export async function GET(request) {
  try {
    console.log("API: Obteniendo productos...")

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"
    const id = searchParams.get("id")
    const nombre = searchParams.get("nombre")
    const descripcion = searchParams.get("descripcion")
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const all = searchParams.get("all") === "true"

    console.log(`API: Incluir inactivos: ${includeInactive}`)

    // Si recibe all=true, traer todos los productos (sin filtros, solo deletedAt: null)
    if (all) {
      const productos = await prisma.producto.findMany({
        where: { deletedAt: null },
        include: {
          unidadMedida: true,
          tipoProducto: true,
          estadoProducto: true,
        },
        orderBy: { nombreProducto: "asc" },
      })
      const productosFormateados = productos.map((producto) => {
        const productoFormateado = { ...producto }
        if (productoFormateado.tipoProducto) {
          productoFormateado.tipoProducto = {
            ...productoFormateado.tipoProducto,
            nombreTipoProducto: productoFormateado.tipoProducto.descTipoProducto,
          }
        }
        return productoFormateado
      })
      return NextResponse.json(productosFormateados)
    }
    // Si no hay filtros, devolver array vacío
    if (!id && !nombre && !descripcion && !tipo && !estado) {
      return NextResponse.json([])
    }

    // Construir la consulta
    const whereClause = { deletedAt: null }
    if (id) whereClause.idProducto = Number(id)
    if (nombre) whereClause.nombreProducto = { contains: nombre, mode: "insensitive" }
    if (descripcion) whereClause.descripcion = { contains: descripcion, mode: "insensitive" }
    if (tipo) whereClause.idTipoProducto = Number(tipo)
    if (estado) whereClause.idEstadoProducto = Number(estado)
    if (!includeInactive && !estado) {
      whereClause.idEstadoProducto = 1
    }

    const productos = await prisma.producto.findMany({
      where: whereClause,
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
      },
      orderBy: {
        nombreProducto: "asc",
      },
    })

    // Mapear los productos para asegurar que tipoProducto tenga nombreTipoProducto
    const productosFormateados = productos.map((producto) => {
      // Crear una copia del producto
      const productoFormateado = { ...producto }

      // Si tiene tipoProducto, asegurarse de que tenga nombreTipoProducto
      if (productoFormateado.tipoProducto) {
        productoFormateado.tipoProducto = {
          ...productoFormateado.tipoProducto,
          nombreTipoProducto: productoFormateado.tipoProducto.descTipoProducto,
        }
      }

      return productoFormateado
    })

    console.log(`API: Se encontraron ${productosFormateados.length} productos`)
    // Agregar log para depuración
    if (productosFormateados.length > 0) {
      console.log("API: Ejemplo de producto formateado:", {
        id: productosFormateados[0].idProducto,
        nombre: productosFormateados[0].nombreProducto,
        tipoProducto: productosFormateados[0].tipoProducto,
      })
    }

    return NextResponse.json(productosFormateados)
  } catch (error) {
    console.error("API: Error al obtener productos:", error)
    return NextResponse.json(
      { message: "Error al obtener productos", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear un nuevo producto
export async function POST(request) {
  try {
    console.log("API: Creando nuevo producto...")
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    // Obtener datos del producto
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Verificar si ya existe un producto con el mismo nombre
    const productoExistente = await prisma.producto.findFirst({
      where: {
        nombreProducto: {
          equals: data.nombreProducto,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        deletedAt: null,
      },
    })

    if (productoExistente) {
      console.log(`API: Ya existe un producto con el nombre "${data.nombreProducto}"`)
      return NextResponse.json(
        { message: "Ya existe un producto con este nombre" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Crear el producto
    const producto = await prisma.producto.create({
      data: {
        nombreProducto: data.nombreProducto,
        descripcion: data.descripcion,
        idTipoProducto: Number.parseInt(data.idTipoProducto),
        pesoUnidad: Number.parseFloat(data.pesoUnidad),
        precioUnitario: Number.parseFloat(data.precioUnitario),
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        idEstadoProducto: Number.parseInt(data.idEstadoProducto) || 1, // Por defecto, estado activo (1)
        createdAt: new Date(),
      },
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
      },
    })

    // Registrar la acción en auditoría
    // Extraer información del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Llamar con parámetros correctos
    await auditoriaService.registrarCreacion(
  "Producto", 
  producto.idProducto, 
  producto, 
  idUsuario, 
  direccionIP, 
  navegador
  )
    console.log(`API: Producto creado con ID: ${producto.idProducto}`)
    return NextResponse.json(
      { message: "Producto creado exitosamente", producto },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear producto:", error)
    return NextResponse.json(
      { message: "Error al crear producto", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
