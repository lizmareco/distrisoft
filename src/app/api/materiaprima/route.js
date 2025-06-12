import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import { getUserData } from "src/lib/http/get-userdata"
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

// GET - Obtener todas las materias primas
export async function GET(request) {
  try {
    console.log("API: Obteniendo materias primas...")

    const userData = await getUserData(request, "VIEW_MATERIAPRIMA")

    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: {
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

    console.log(`API: Se encontraron ${materiasPrimas.length} materias primas`)
    return NextResponse.json(materiasPrimas)
  } catch (error) {
    console.error("API: Error al obtener materias primas:", error)
    return NextResponse.json({ error: "Error al obtener materias primas" }, { status: 500 })
  }
}

// POST - Crear una nueva materia prima
export async function POST(request) {
  try {
    console.log("API: Creando nueva materia prima...")
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request, "CREATE_MATERIAPRIMA")
    

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Verificar si ya existe una materia prima con el mismo nombre
    const materiaPrimaExistente = await prisma.materiaPrima.findFirst({
      where: {
        nombreMateriaPrima: {
          equals: data.nombreMateriaPrima,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        deletedAt: null,
      },
    })

    if (materiaPrimaExistente) {
      console.log(`API: Ya existe una materia prima con el nombre "${data.nombreMateriaPrima}"`)
      return NextResponse.json({ error: "Ya existe una materia prima con este nombre" }, { status: 400 })
    }

    const nuevaMateriaPrima = await prisma.materiaPrima.create({
      data: {
        nombreMateriaPrima: data.nombreMateriaPrima,
        descMateriaPrima: data.descMateriaPrima,
        idEstadoMateriaPrima: Number.parseInt(data.idEstadoMateriaPrima),
        stockActual: 0, // Inicializar el stock en 0 (aunque ya es el valor predeterminado)
        createdAt: new Date(),
      },
      include: {
        estadoMateriaPrima: true,
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría con los parámetros correctos
    await auditoriaService.registrarCreacion(
      "MateriaPrima",
      nuevaMateriaPrima.idMateriaPrima,
      nuevaMateriaPrima,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Materia prima creada con ID: ${nuevaMateriaPrima.idMateriaPrima}`)
    return NextResponse.json(nuevaMateriaPrima, { status: 201 })
  } catch (error) {
    console.error("API: Error al crear materia prima:", error)
    return NextResponse.json({ error: "Error al crear materia prima" }, { status: 500 })
  }
}
