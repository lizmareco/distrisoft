import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
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


// GET - Obtener una materia prima por ID
export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Obteniendo materia prima con ID: ${id}`)

    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: {
        idMateriaPrima: id,
        deletedAt: null,
      },
      include: {
        estadoMateriaPrima: {
          select: {
            idEstadoMateriaPrima: true,
            descEstadoMateriaPrima: true,
          },
        },
      },
    })

    if (!materiaPrima) {
      console.log(`API: Materia prima con ID ${id} no encontrada`)
      return NextResponse.json({ error: "Materia prima no encontrada" }, { status: 404 })
    }

    console.log(`API: Materia prima con ID ${id} encontrada`)
    return NextResponse.json(materiaPrima)
  } catch (error) {
    console.error("API: Error al obtener materia prima:", error)
    return NextResponse.json({ error: "Error al obtener materia prima" }, { status: 500 })
  }
}

// PUT - Actualizar una materia prima
export async function PUT(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Actualizando materia prima con ID: ${id}`)
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Obtener la materia prima actual para auditoría
    const materiaPrimaAnterior = await prisma.materiaPrima.findUnique({
      where: { idMateriaPrima: id },
      include: {
        estadoMateriaPrima: true,
      },
    })

    if (!materiaPrimaAnterior) {
      console.log(`API: Materia prima con ID ${id} no encontrada para actualizar`)
      return NextResponse.json({ error: "Materia prima no encontrada" }, { status: 404 })
    }

    // Verificar si ya existe otra materia prima con el mismo nombre
    const materiaPrimaExistente = await prisma.materiaPrima.findFirst({
      where: {
        nombreMateriaPrima: {
          equals: data.nombreMateriaPrima,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        idMateriaPrima: {
          not: id,
        },
        deletedAt: null,
      },
    })

    if (materiaPrimaExistente) {
      console.log(`API: Ya existe otra materia prima con el nombre "${data.nombreMateriaPrima}"`)
      return NextResponse.json({ error: "Ya existe otra materia prima con este nombre" }, { status: 400 })
    }

    const materiaPrimaActualizada = await prisma.materiaPrima.update({
      where: {
        idMateriaPrima: id,
      },
      data: {
        nombreMateriaPrima: data.nombreMateriaPrima,
        descMateriaPrima: data.descMateriaPrima,
        idEstadoMateriaPrima: Number.parseInt(data.idEstadoMateriaPrima),
        updatedAt: new Date(),
      },
      include: {
        estadoMateriaPrima: true,
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría con los parámetros correctos
    await auditoriaService.registrarActualizacion(
      "MateriaPrima",
      id,
      materiaPrimaAnterior,
      materiaPrimaActualizada,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Materia prima con ID ${id} actualizada correctamente`)
    return NextResponse.json(materiaPrimaActualizada)
  } catch (error) {
    console.error("API: Error al actualizar materia prima:", error)
    return NextResponse.json({ error: "Error al actualizar materia prima" }, { status: 500 })
  }
}

// DELETE - Eliminar una materia prima (soft delete)
export async function DELETE(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Eliminando materia prima con ID: ${id}`)
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Obtener la materia prima actual para auditoría
    const materiaPrimaAnterior = await prisma.materiaPrima.findUnique({
      where: { idMateriaPrima: id },
      include: {
        estadoMateriaPrima: true,
      },
    })

    if (!materiaPrimaAnterior) {
      console.log(`API: Materia prima con ID ${id} no encontrada para eliminar`)
      return NextResponse.json({ error: "Materia prima no encontrada" }, { status: 404 })
    }

    await prisma.materiaPrima.update({
      where: {
        idMateriaPrima: id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría con los parámetros correctos
    await auditoriaService.registrarEliminacion(
      "MateriaPrima",
      id,
      materiaPrimaAnterior,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Materia prima con ID ${id} eliminada correctamente`)
    return NextResponse.json({ message: "Materia prima eliminada correctamente" })
  } catch (error) {
    console.error("API: Error al eliminar materia prima:", error)
    return NextResponse.json({ error: "Error al eliminar materia prima" }, { status: 500 })
  }
}
