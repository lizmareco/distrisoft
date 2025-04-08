import { NextResponse } from "next/server"

export function middleware(request) {
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/auth/login", "/auth/forgot-password", "/auth/reset-password"]

  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Si es una ruta pública, permitir el acceso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verificar si hay un token en las cookies
  const accessToken = request.cookies.get("at")?.value

  // Si no hay token en las cookies, verificar en los encabezados
  const authHeader = request.headers.get("authorization")
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

  // IMPORTANTE: No podemos verificar localStorage directamente en el middleware
  // ya que el middleware se ejecuta en el servidor y localStorage solo existe en el cliente

  // Si no hay token ni en cookies ni en encabezados, permitir el acceso de todas formas
  // y dejar que el componente cliente maneje la verificación de localStorage
  if (!accessToken && !headerToken) {
    // No redirigir automáticamente a login, permitir que el componente cliente lo maneje
    return NextResponse.next()
  }

  // Si hay token, permitir el acceso
  return NextResponse.next()
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos y API routes
     * - '/((?!api|_next/static|_next/image|favicon.ico).*)'
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

