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
  Drawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
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
  ReceiptLong as ReceiptLongIcon, 
  AttachMoney as AttachMoneyIcon, 
  Science as ScienceIcon, 
  Inventory2 as InventoryGeneralIcon, 
  ShoppingCart as ShoppingCartIcon, 
  InsertChart as InsertChartIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material"
import { useRootContext } from "@/src/app/context/root"
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

const drawerWidth = 280;

export default function DashboardPage() {
  const router = useRouter()
  const { session } = useRootContext()
  console.log("DashboardPage session:", session)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [openMenu, setOpenMenu] = useState({});

  const handleMenuClick = (menu) => {
    setOpenMenu((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Estado para controlar la visibilidad de las secciones según el rol
  const [visibleSections, setVisibleSections] = useState({
    entidades: true,
    inventario: true,
    usuarios: true,
    ventas: true,      // Sección de Ventas
    compras: true,     // Sección de Compras
    produccion: true,  // Sección de Producción (nueva propiedad)
    finanzas: true,
    cuentasCobrar: true,
    cuentasPagar: true,
    ReportesPage: true, // Sección de Reportes
    ordenesProduccion: true,
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
    inventario: true, // Nuevo
    formulas: true, // Nuevo

    // Sección de Usuarios
    administracionUsuarios: true,

    // Sección de Ventas
    cotizaciones: true,
    pedidos: true, // Nuevo

    // Sección de Compras
    cotizacionesProveedor: true, // Nuevo ítem para cotizaciones de proveedores
    ordenesCompra: true, // Nuevo ítem para órdenes de compra

    // Sección de Finanzas
    finanzas: true, // Nuevo
    cuentasCobrar: true,
    cuentasPagar: true,

    // Sección de Reportes
    reportes: true, // Nuevo ítem para reportes
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

    // Por defecto, ocultar todo
    const secciones = {
      entidades: false,
      inventario: false,
      usuarios: false,
      ventas: false,
      compras: false,
      finanzas: false,
      cuentasCobrar: false,
      cuentasPagar: false,
      ReportesPage: false,
      produccion: false,
    }

    const items = {
      personas: false,
      clientes: false,
      empresas: false,
      proveedores: false,
      materiaprima: false,
      productos: false,
      inventario: false,
      formulas: false,
      administracionUsuarios: false,
      cotizaciones: false,
      pedidos: false,
      cotizacionesProveedor: false,
      ordenesCompra: false,
      finanzas: false,
      cuentasCobrar: false,
      cuentasPagar: false,
      reportes: false,
      ordenesProduccion: false,
    }

    // Configurar permisos específicos según el rol
    switch (rol) {
      case "ADMINISTRADOR":
        // El administrador ve todo
        Object.keys(secciones).forEach(key => secciones[key] = true)
        Object.keys(items).forEach(key => items[key] = true)
        break

      case "ADMINISTRADORSISTEMA":
        // Solo ve la sección de usuarios y sus items
        secciones.usuarios = true
        items.administracionUsuarios = true
        break

      case "PRODUCCION":
        // Ve producción e inventario
        secciones.produccion = true
        secciones.inventario = true
        items.ordenesProduccion = true
        items.materiaprima = false
        items.productos = false
        items.inventario = true
        items.formulas = true
        break

      case "ADMINISTRATIVO":
        // Ve ventas, compras, finanzas, entidades, inventario y reportes
        secciones.ventas = true
        secciones.compras = true
        secciones.finanzas = true
        secciones.entidades = true
        secciones.inventario = true
        secciones.ReportesPage = true
        
        // Items de ventas
        items.cotizaciones = true
        items.pedidos = true
        
        // Items de compras
        items.cotizacionesProveedor = true
        items.ordenesCompra = true
        
        // Items de finanzas
        items.finanzas = true
        items.cuentasCobrar = true
        items.cuentasPagar = true
        
        // Items de entidades
        items.personas = true
        items.clientes = true
        items.empresas = true
        items.proveedores = true
        
        // Items de inventario
        items.materiaprima = true
        items.productos = true
        items.inventario = true
        items.formulas = true
        
        // Items de reportes
        items.reportes = true
        break

      default:
        // Rol desconocido: acceso limitado
        console.warn("Rol desconocido:", rol)
    }

    // Actualizar los estados de visibilidad
    setVisibleSections(secciones)
    setVisibleItems(items)
  }

  // Función para navegar a diferentes secciones
  const navigateTo = (path) => {
    router.push(path)
  }

  //Verificación de permisos
  const permisos = session?.permisos || []
  /*const hasPermission =
    permisos.find(permiso => permiso === "VIEW_USUARIO") || session?.isAdmin*/

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

  /*if (!hasPermission) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No tiene permisos para ver esta página
        </Alert>
      </Container>
    )
  }*/

  const menuConfig = [
    {
      section: "ventas",
      title: "Gestión de Ventas",
      icon: <DescriptionIcon />,
      visible: visibleSections.ventas,
      items: [
        { item: "cotizaciones", title: "Cotizaciones a Clientes", path: "/cotizaciones", icon: <DescriptionIcon />, visible: visibleItems.cotizaciones },
        { item: "pedidos", title: "Gestión de Pedidos", path: "/pedidos", icon: <ShoppingCartIcon />, visible: visibleItems.pedidos },
      ],
    },
    {
      section: "compras",
      title: "Gestión de Compras",
      icon: <ReceiptLongIcon />,
      visible: visibleSections.compras,
      items: [
        { item: "cotizacionesProveedor", title: "Cotizaciones de Proveedores", path: "/cotizaciones-proveedor", icon: <ReceiptLongIcon />, visible: visibleItems.cotizacionesProveedor },
        { item: "ordenesCompra", title: "Órdenes de Compra", path: "/ordenes-compra", icon: <LocalShipping />, visible: visibleItems.ordenesCompra },
      ],
    },
    {
        section: "produccion",
        title: "Gestión de Producción",
        icon: <PrecisionManufacturingIcon />,
        visible: visibleSections.produccion,
        items: [
            { item: "ordenesProduccion", title: "Órdenes de Producción", path: "/produccion/ordenes", icon: <PrecisionManufacturingIcon />, visible: visibleItems.ordenesProduccion },
        ],
    },
    {
      section: "finanzas",
      title: "Gestión de Finanzas",
      icon: <AttachMoneyIcon />,
      visible: visibleSections.finanzas,
      items: [
        { item: "finanzas", title: "Finanzas", path: "/finanzas", icon: <AttachMoneyIcon />, visible: visibleItems.finanzas },
        { item: "cuentasCobrar", title: "Cuentas por Cobrar", path: "/finanzas/cuentas-cobrar", icon: <TrendingUpIcon />, visible: visibleItems.cuentasCobrar },
        { item: "cuentasPagar", title: "Cuentas por Pagar", path: "/finanzas/cuentas-pagar", icon: <TrendingDownIcon />, visible: visibleItems.cuentasPagar },
      ],
    },
    {
      section: "entidades",
      title: "Gestión de Entidades",
      icon: <People />,
      visible: visibleSections.entidades,
      items: [
        { item: "personas", title: "Gestión de Personas", path: "/personas", icon: <Person />, visible: visibleItems.personas },
        { item: "clientes", title: "Gestión de Clientes", path: "/clientes", icon: <People />, visible: visibleItems.clientes },
        { item: "empresas", title: "Gestión de Empresas", path: "/empresas", icon: <Business />, visible: visibleItems.empresas },
        { item: "proveedores", title: "Gestión de Proveedores", path: "/proveedores", icon: <LocalShipping />, visible: visibleItems.proveedores },
      ],
    },
    {
      section: "inventario",
      title: "Gestión de Inventario",
      icon: <Inventory />,
      visible: visibleSections.inventario,
      items: [
        { item: "materiaprima", title: "Gestión de Materia Prima", path: "/materiaprima", icon: <Category />, visible: visibleItems.materiaprima },
        { item: "productos", title: "Gestión de Productos", path: "/producto", icon: <Inventory />, visible: visibleItems.productos },
        { item: "inventario", title: "Inventario General", path: "/inventario", icon: <InventoryGeneralIcon />, visible: visibleItems.inventario },
        { item: "formulas", title: "Gestión de Fórmulas", path: "/formulas", icon: <ScienceIcon />, visible: visibleItems.formulas },
      ],
    },
    {
        section: "usuarios",
        title: "Admin. de Sistema",
        icon: <AdminPanelSettings />,
        visible: visibleSections.usuarios,
        items: [
            { item: "administracionUsuarios", title: "Gestión de Usuarios", path: "/usuarios", icon: <AdminPanelSettings />, visible: visibleItems.administracionUsuarios },
            { item: "roles", title: "Gestión de Roles", path: "/roles", icon: <SecurityIcon />, visible: visibleItems.administracionUsuarios },
            { item: "auditoria", title: "Logs de Auditoría", path: "/admin/auditoria", icon: <HistoryIcon />, visible: visibleItems.administracionUsuarios },
        ],
    },
    {
        section: "reportes",
        title: "Gestión de Reportes",
        icon: <InsertChartIcon />,
        visible: visibleSections.ReportesPage,
        items: [
            { item: "reportes", title: "Reportes", path: "/reportes", icon: <InsertChartIcon />, visible: visibleItems.reportes },
        ],
    }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
      >
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuConfig.map((menu) =>
              menu.visible ? (
                <div key={menu.section}>
                  <ListItemButton onClick={() => handleMenuClick(menu.section)}>
                    <ListItemIcon sx={{ color: "#1976D2" }}>{menu.icon}</ListItemIcon>
                    <ListItemText primary={menu.title} />
                    {openMenu[menu.section] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={openMenu[menu.section]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {menu.items.map((item) =>
                        item.visible ? (
                          <ListItemButton key={item.item} sx={{ pl: 4 }} onClick={() => navigateTo(item.path)}>
                            <ListItemIcon sx={{ color: "#c60f7b" }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.title} />
                          </ListItemButton>
                        ) : null
                      )}
                    </List>
                  </Collapse>
                </div>
              ) : null
            )}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Distribuidora Las niñas
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

        <Grid container spacing={2} sx={{ mb: 3, alignItems: "stretch" }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, bgcolor: "#e3f2fd", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Typography variant="h6" gutterBottom>Accesos Rápidos</Typography>
              <Typography variant="body2">
                Utiliza la barra lateral para navegar entre los diferentes módulos del sistema.<br />
                Las secciones se expanden al hacer clic para mostrar sus opciones.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, bgcolor: "#f1faee", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Typography variant="h6" gutterBottom>Permisos</Typography>
              <Typography variant="body2">
                {userInfo.rol === "ADMINISTRADOR" && (
                  <>
                    Tu rol actual (<b>ADMINISTRADOR</b>) determina las funcionalidades disponibles.<br />
                    Contacta al administrador si necesitas acceso adicional.
                  </>
                )}
                {userInfo.rol === "ADMINISTRATIVO" && (
                  <>
                    Tu rol actual (<b>ADMINISTRATIVO</b>) te permite gestionar ventas, compras, finanzas y reportes.<br />
                    Si necesitas más permisos, contacta al administrador.
                  </>
                )}
                {userInfo.rol === "PRODUCCION" && (
                  <>
                    Tu rol actual (<b>PRODUCCIÓN</b>) te permite gestionar órdenes de producción e inventario.<br />
                    Si necesitas más permisos, contacta al administrador.
                  </>
                )}
                {!["ADMINISTRADOR", "ADMINISTRATIVO", "PRODUCCION"].includes(userInfo.rol) && (
                  <>
                    Tu rol actual (<b>{userInfo.rol}</b>) tiene permisos limitados.<br />
                    Contacta al administrador si necesitas acceso adicional.
                  </>
                )}
              </Typography>
            </Paper>
          </Grid>
        </Grid>


      </Paper>
        </Container>
                    </Box>
                  </Box>
  )
}
