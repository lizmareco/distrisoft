// app/api/formulas/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import AuthController from "@/src/backend/controllers/auth-controller";
import AuditoriaService from "@/src/backend/services/auditoria-service";
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

// GET /api/formulas - Obtener todas las fórmulas
export async function GET(request) {
  try {
    // Verificar autenticación
    const authController = new AuthController();
    const token = await authController.hasAccessToken(request);
    
    // En desarrollo permitimos acceso sin token
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const all = searchParams.get("all") === "true"

    // Si no hay parámetros, no devolver nada
    if (!query && !all) {
      return NextResponse.json([])
    }

    // Construir condiciones de búsqueda
    const where = { deletedAt: null }
    if (query) {
      where.OR = [
        { nombre: { contains: query, mode: "insensitive" } },
        { descripcion: { contains: query, mode: "insensitive" } },
        { producto: { nombreProducto: { contains: query, mode: "insensitive" } } },
      ]
    }

    const formulas = await prisma.formula.findMany({
      where,
      include: {
        producto: true,
        FormulaDetalle: {
          include: {
            materiaPrima: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(formulas);
  } catch (error) {
    console.error("Error al obtener fórmulas:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/formulas - Crear una nueva fórmula
export async function POST(request) {
  try {
    // Verificar autenticación
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)
    
    const datos = await request.json();
    
    if (!datos.idProducto || !datos.nombre || !datos.rendimiento || !datos.detalles || datos.detalles.length === 0) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Crear la fórmula y sus detalles en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // 1. Crear la fórmula
      const formula = await prisma.formula.create({
        data: {
          idProducto: parseInt(datos.idProducto, 10),
          nombre: datos.nombre,
          descripcion: datos.descripcion || "",
          rendimiento: parseInt(datos.rendimiento, 10)
        }
      });
      
      // 2. Crear los detalles de la fórmula
      const detalles = [];
      
      for (const detalle of datos.detalles) {
        const detalleCreado = await prisma.formulaDetalle.create({
          data: {
            idFormula: formula.idFormula,
            idMateriaPrima: parseInt(detalle.idMateriaPrima, 10),
            cantidad: parseFloat(detalle.cantidad),
            unidadMedida: detalle.unidadMedida
          }
        });
        
        detalles.push(detalleCreado);
      }
      
      return { formula, detalles };
    });


    
    // Construir el objeto valorNuevo
    const valorNuevo = {
      idProducto: resultado.formula.idProducto,
      nombre: resultado.formula.nombre,
      descripcion: resultado.formula.descripcion,
      rendimiento: resultado.formula.rendimiento,
      detalles: resultado.detalles.map(d => ({
        idMateriaPrima: d.idMateriaPrima,
        cantidad: d.cantidad,
        unidadMedida: d.unidadMedida
      }))
    };
    

    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    await auditoriaService.registrarAuditoria({
      entidad: "Formula",
      idRegistro: resultado.formula.idFormula,
      accion: "CREAR",
      valorAnterior: null,
      valorNuevo,
      idUsuario, 
      direccionIP,
      navegador
    });

    return NextResponse.json({
      mensaje: "Fórmula creada exitosamente",
      formula: resultado.formula,
      detalles: resultado.detalles
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear fórmula:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}