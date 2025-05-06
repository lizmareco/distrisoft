// Rutas públicas que no requieren autenticación
export const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"]

// Rutas protegidas que siempre requieren autenticación
export const protectedRoutes = [
  "/clientes",
  "/personas",
  "/proveedores",
  "/empresas",
  "/cotizaciones-proveedor",
  "/cotizaciones",
  "/dashboard",
  "/admin",
  "/materiaprima",
  "/producto",
  "/roles",
  "/usuarios",
]

// Función auxiliar para verificar si una ruta está protegida
export function isProtectedPath(path) {
  return protectedRoutes.some((route) => path.startsWith(route))
}

// Función auxiliar para verificar si una ruta es pública
export function isPublicPath(path) {
  return publicRoutes.some((route) => path.startsWith(route))
}
