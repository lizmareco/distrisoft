"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from "@mui/material"
import {
  Person,
  People,
  Business,
  LocalShipping,
  Inventory,
  Category,
  AdminPanelSettings,
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  ReceiptLong as ReceiptLongIcon, // Nuevo icono para cotizaciones de proveedores
} from "@mui/icons-material"
import { useRootContext } from "@/src/app/context/root"

export default function DashboardPage() {
  const router = useRouter()
  const { session } = useRootContext()
  console.log("DashboardPage session:", session)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  // Estado para controlar la visibilidad de las secciones según el rol
  const [visibleSections, setVisibleSections] = useState({
    entidades: true,
    inventario: true,
    usuarios: true,
    ventas: true, // Nueva sección para ventas/cotizaciones
    compras: true, // Nueva sección para compras/cotizaciones de proveedores
  })

  // Estado para controlar la visibilidad de los elementos dentro de cada sección
  const [visibleItems, setVisibleItems] = useState({
    // Sección de Entidades
    personas: true,
    clientes: true,
    empresas: true,
    proveedores: true,

    // Sección de Inventario
    materiaprima: true,
    productos: true,

    // Sección de Usuarios
    administracionUsuarios: true,

    // Sección de Ventas
    cotizaciones: true,

    // Sección de Compras
    cotizacionesProveedor: true, // Nuevo ítem para cotizaciones de proveedores
    ordenesCompra: true, // Nuevo ítem para órdenes de compra
  })

  // Modificar la función useEffect para asegurar que se obtengan correctamente los datos del usuario
  useEffect(() => {
    // Modificar la función checkAuth para cargar correctamente los datos del localStorage

    const checkAuth = async () => {
      try {
        setLoading(true)
        console.log("Verificando autenticación en dashboard...")

        // Primero verificar localStorage
        const storedUser = localStorage.getItem("user")
        const storedToken = localStorage.getItem("accessToken")

        console.log("Datos en localStorage:", {
          userExists: !!storedUser,
          tokenExists: !!storedToken,
        })

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser)
          console.log("Usuario cargado desde localStorage:", userData)

          // Establecer la información del usuario desde localStorage
          setUserInfo({
            nombre: userData.nombre || "",
            apellido: userData.apellido || "",
            rol: userData.rol || "",
          })

          // Configurar las secciones visibles según el rol del usuario
          configurarPermisosSegunRol(userData.rol)

          // Intentar obtener datos actualizados del usuario
          try {
            console.log("Intentando obtener perfil actualizado con token:", storedToken.substring(0, 10) + "...")
            const response = await fetch("/api/usuarios/profile", {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${storedToken}`,
              },
            })

            if (response.ok) {
              const profileData = await response.json()
              console.log("Perfil actualizado cargado:", profileData)

              // Actualizar la información del usuario con los datos del perfil
              setUserInfo({
                nombre: profileData.persona?.nombre || userData.nombre || "",
                apellido: profileData.persona?.apellido || userData.apellido || "",
                rol: profileData.rol || userData.rol || "",
              })

              // Actualizar permisos con el rol actualizado
              configurarPermisosSegunRol(profileData.rol || userData.rol)
            } else {
              console.warn("No se pudo obtener el perfil actualizado:", response.status)
              console.log("Usando datos de localStorage para permisos")
            }
          } catch (profileError) {
            console.error("Error al obtener perfil actualizado:", profileError)
            console.log("Usando datos de localStorage para permisos")
          }
        } else if (session) {
          // Si no hay datos en localStorage pero sí en el contexto
          console.log("Sesión encontrada en contexto:", session)
          setUserInfo({
            nombre: session.nombre || "",
            apellido: session.apellido || "",
            rol: session.rol || "",
          })

          // Configurar permisos con el rol del contexto
          configurarPermisosSegunRol(session.rol)
        } else {
          // Si no hay información de usuario, redirigir al login
          console.log("No hay datos de autenticación, redirigiendo al login...")
          window.location.href = "/auth/login"
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        setError("Error al verificar la autenticación. Por favor, inicia sesión nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, session])

  // Función para configurar los permisos según el rol del usuario
  const configurarPermisosSegunRol = (rol) => {
    console.log("Configurando permisos para rol:", rol)

    // Por defecto, mostrar todo
    const secciones = {
      entidades: true,
      inventario: true,
      usuarios: true, // Siempre visible para pruebas
      ventas: true, // Sección para ventas/cotizaciones
      compras: true, // Nueva sección para compras/cotizaciones de proveedores
    }

    const items = {
      personas: true,
      clientes: true,
      empresas: true,
      proveedores: true,
      materiaprima: true,
      productos: true,
      administracionUsuarios: true, // Siempre visible para pruebas
      cotizaciones: true, // Ítem para cotizaciones de clientes
      cotizacionesProveedor: true, // Nuevo ítem para cotizaciones de proveedores
      ordenesCompra: true, // Nuevo ítem para órdenes de compra
    }

    // Configurar permisos específicos según el rol
    // Comentamos temporalmente las restricciones para pruebas
    switch (rol) {
      case "ADMINISTRADOR_SISTEMA":
        // El administrador ve todo
        break

      case "VENTAS":
        // Rol de ventas: ve clientes, empresas, productos y cotizaciones
        items.proveedores = false
        items.materiaprima = false
        items.cotizacionesProveedor = false // No ve cotizaciones de proveedores
        secciones.compras = false // No ve sección de compras
        // Comentado para pruebas: items.administracionUsuarios = false;
        // Comentado para pruebas: secciones.usuarios = false;
        break

      case "PRODUCCION":
        // Rol de producción: ve materias primas y productos
        items.clientes = false
        items.empresas = false
        items.cotizaciones = false // No ve cotizaciones de clientes
        items.cotizacionesProveedor = false // No ve cotizaciones de proveedores
        secciones.ventas = false // No ve sección de ventas
        secciones.compras = false // No ve sección de compras
        // Comentado para pruebas: items.administracionUsuarios = false;
        // Comentado para pruebas: secciones.usuarios = false;
        break

      case "COMPRAS":
        // Rol de compras: ve proveedores, materias primas y cotizaciones de proveedores
        items.clientes = false
        items.productos = false
        items.cotizaciones = false // No ve cotizaciones de clientes
        secciones.ventas = false // No ve sección de ventas
        // Comentado para pruebas: items.administracionUsuarios = false;
        // Comentado para pruebas: secciones.usuarios = false;
        break

      default:
      // Rol desconocido o básico: acceso limitado
      // Comentado para pruebas: items.administracionUsuarios = false;
      // Comentado para pruebas: secciones.usuarios = false;
    }

    // Actualizar los estados de visibilidad
    setVisibleSections(secciones)
    setVisibleItems(items)
  }

  // Función para navegar a diferentes secciones
  const navigateTo = (path) => {
    router.push(path)
  }

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => router.push("/auth/login")}>
          Ir al inicio de sesión
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <DashboardIcon sx={{ fontSize: 32, mr: 2, color: "primary.main" }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Panel de Control DistriSoft
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {userInfo && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bienvenido, {userInfo.nombre} {userInfo.apellido}
            {userInfo.rol && (
              <Typography component="span" variant="subtitle1" sx={{ ml: 1 }}>
                ({userInfo.rol})
              </Typography>
            )}
          </Typography>
        )}

        <Typography variant="body1" paragraph>
          Selecciona una de las siguientes opciones para comenzar a gestionar el sistema:
        </Typography>
      </Paper>

      {/* Sección de Gestión de Ventas */}
      {visibleSections.ventas && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium", textAlign: "center" }}>
            Gestión de Ventas
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {/* Tarjeta de Gestión de Cotizaciones */}
            {visibleItems.cotizaciones && (
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <DescriptionIcon sx={{ fontSize: 60, color: "#00796b" }} /> {/* Verde azulado */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Cotizaciones
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre las cotizaciones para clientes. Cree nuevas cotizaciones, consulte el historial y
                      gestione el estado de las mismas.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/cotizaciones")}
                      sx={{ bgcolor: "#00796b", "&:hover": { bgcolor: "#004d40" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Nueva Sección de Gestión de Compras */}
      {visibleSections.compras && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium", textAlign: "center" }}>
            Gestión de Compras
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {/* Tarjeta de Gestión de Cotizaciones de Proveedores */}
            {visibleItems.cotizacionesProveedor && (
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <ReceiptLongIcon sx={{ fontSize: 60, color: "#e65100" }} /> {/* Naranja oscuro */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Cotizaciones de Proveedores
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre las cotizaciones de proveedores. Cree nuevas cotizaciones, consulte el historial y
                      gestione el estado de las mismas.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/cotizaciones-proveedor")}
                      sx={{ bgcolor: "#e65100", "&:hover": { bgcolor: "#bf360c" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
            {visibleItems.ordenesCompra && (
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <LocalShipping sx={{ fontSize: 60, color: "#d32f2f" }} /> {/* Rojo */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Órdenes de Compra
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre las órdenes de compra. Cree nuevas órdenes, consulte el historial y gestione el estado
                      de las mismas.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/ordenes-compra")}
                      sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Sección de Gestión de Entidades */}
      {visibleSections.entidades && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium", textAlign: "center" }}>
            Gestión de Entidades
          </Typography>

          <Grid container spacing={3}>
            {/* Tarjeta de Gestión de Personas */}
            {visibleItems.personas && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <Person sx={{ fontSize: 60, color: "#2e7d32" }} /> {/* Verde */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Personas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre las personas del sistema. Visualice, registre y modifique la información personal.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/personas")}
                      sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {/* Tarjeta de Gestión de Clientes */}
            {visibleItems.clientes && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <People sx={{ fontSize: 60, color: "#1976d2" }} /> {/* Azul */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Clientes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre los clientes del sistema. Visualice, registre y modifique la información de los
                      clientes.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/clientes")}
                      sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#0d47a1" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {/* Tarjeta de Gestión de Empresas */}
            {visibleItems.empresas && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <Business sx={{ fontSize: 60, color: "#9c27b0" }} /> {/* Morado */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Empresas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre las empresas del sistema. Visualice, registre y modifique la información de las
                      empresas.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/empresas")}
                      sx={{ bgcolor: "#9c27b0", "&:hover": { bgcolor: "#7b1fa2" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {/* Tarjeta de Gestión de Proveedores */}
            {visibleItems.proveedores && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <LocalShipping sx={{ fontSize: 60, color: "#0288d1" }} /> {/* Azul claro */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Proveedores
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre los proveedores del sistema. Visualice, registre y modifique la información de los
                      proveedores.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/proveedores")}
                      sx={{ bgcolor: "#0288d1", "&:hover": { bgcolor: "#01579b" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Sección de Gestión de Inventario */}
      {visibleSections.inventario && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium", textAlign: "center" }}>
            Gestión de Inventario
          </Typography>

          <Grid container spacing={3}>
            {/* Tarjeta de Gestión de Materia Prima */}
            {visibleItems.materiaprima && (
              <Grid item xs={12} sm={6}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 2 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <Category sx={{ fontSize: 60, color: "#ff9800" }} /> {/* Naranja */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Materia Prima
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre el inventario de materias primas. Visualice, registre y modifique la información de
                      stock, unidades de medida y estados de las materias primas.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/materiaprima")}
                      sx={{ bgcolor: "#ff9800", "&:hover": { bgcolor: "#e65100" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {/* Tarjeta de Gestión de Productos */}
            {visibleItems.productos && (
              <Grid item xs={12} sm={6}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 2 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <Inventory sx={{ fontSize: 60, color: "#f44336" }} /> {/* Rojo */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Productos
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre el catálogo de productos. Visualice, registre y modifique la información de precios,
                      tipos, pesos y estados de los productos.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/producto")}
                      sx={{ bgcolor: "#f44336", "&:hover": { bgcolor: "#b71c1c" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Sección de Gestión de Usuarios y Roles */}
      {visibleSections.usuarios && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium", textAlign: "center" }}>
            Gestión de Usuarios, Roles, Auditoría
          </Typography>
          <Grid container spacing={3}>
            {/* Tarjeta de Gestión de Usuarios */}
            {visibleItems.administracionUsuarios && (
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 2 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <AdminPanelSettings sx={{ fontSize: 60, color: "#673ab7" }} /> {/* Morado oscuro */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Usuarios
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Administre los usuarios del sistema. Cree, modifique y gestione las cuentas de usuario.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/usuarios")}
                      sx={{ bgcolor: "#673ab7", "&:hover": { bgcolor: "#4a148c" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {/* Tarjeta de Gestión de Roles */}
            {visibleItems.administracionUsuarios && (
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 2 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <SecurityIcon sx={{ fontSize: 60, color: "#2e7d32" }} /> {/* Verde */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestión de Roles
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Configure los roles y permisos del sistema. Defina los niveles de acceso para los usuarios.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/roles")}
                      sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {/* Tarjeta de Logs de Auditoría */}
            {visibleItems.administracionUsuarios && (
              <Grid item xs={12} sm={12} md={4}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 2 }}>
                  <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <HistoryIcon sx={{ fontSize: 60, color: "#1976d2" }} /> {/* Azul */}
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Logs de Auditoría
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Visualiza los registros de auditoría del sistema.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigateTo("/admin/auditoria")}
                      sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#0d47a1" } }}
                    >
                      ACCEDER
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
    </Container>
  )
}
