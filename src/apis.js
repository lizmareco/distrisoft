// Añadir estas rutas a tu objeto apis existente
export const apis = {
  // Otras rutas existentes...

  login: {
    url: "/api/auth/login",
    method: "POST",
  },

  logout: {
    url: "/api/auth/logout",
    method: "POST",
  },

  refreshToken: {
    url: "/api/auth/refresh-token",
    method: "POST",
  },

  desbloquearCuenta: {
    url: "/api/auth/desbloquear-cuenta",
    method: "POST",
  },
}

