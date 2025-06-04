"use client"
import { Box, Typography, List, ListItem, ListItemButton, Link, Divider } from "@mui/material"
import { useState } from "react"

const SECCIONES = [
    { id: "introduccion", label: "Introducción" },
    { id: "requisitos", label: "Requisitos del Sistema" },
    { id: "inicio", label: "Inicio de Sesión y Seguridad" },
    { id: "productos", label: "Módulo de Productos" },
    { id: "clientes", label: "Módulo de Clientes" },
    { id: "ventas", label: "Módulo de Ventas" },
    { id: "compras", label: "Módulo de Compras y Stock" },
    { id: "cobrar", label: "Módulo de Cuentas por Cobrar" },
    { id: "reportes", label: "Módulo de Reportes" },
    { id: "usuarios", label: "Módulo de Usuarios y Seguridad" },
    { id: "faq", label: "Preguntas Frecuentes y Soporte" },
    { id: "consejos", label: "Consejos y Buenas Prácticas" },
]

export default function ManualDeUsuario() {
    const [seccionActiva, setSeccionActiva] = useState("introduccion")

    return (
        <Box sx={{ display: "flex", minHeight: "80vh" }}>
            {/* Menú lateral */}
            <Box sx={{ width: 260, borderRight: 1, borderColor: "divider", p: 2, bgcolor: "#f7f7f7" }}>
                <Typography variant="h6" gutterBottom>Manual de Usuario</Typography>
                <List>
                    {SECCIONES.map(sec => (
                        <ListItem key={sec.id} disablePadding>
                            <ListItemButton
                                selected={seccionActiva === sec.id}
                                onClick={() => setSeccionActiva(sec.id)}
                            >
                                {sec.label}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, p: 4 }}>
                {seccionActiva === "introduccion" && (
                    <>
                        <Typography variant="h5" gutterBottom>Introducción</Typography>
                        <Typography>
                            Este manual está dirigido a los usuarios del sistema de gestión para distribuidoras. Aquí encontrarás instrucciones detalladas para operar cada módulo, recomendaciones para un uso eficiente y advertencias para evitar errores comunes.
                        </Typography>
                    </>
                )}

                {seccionActiva === "requisitos" && (
                    <>
                        <Typography variant="h5" gutterBottom>Requisitos del Sistema</Typography>
                        <ul>
                            <li>Navegador web actualizado (Google Chrome, Mozilla Firefox, Edge)</li>
                            <li>Conexión a Internet estable</li>
                            <li>Usuario y contraseña proporcionados por el administrador</li>
                        </ul>
                    </>
                )}

                {seccionActiva === "inicio" && (
                    <>
                        <Typography variant="h5" gutterBottom>Inicio de Sesión y Seguridad</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1">Ingresar al sistema</Typography>
                        <ol>
                            <li>Accede a la URL del sistema proporcionada por tu empresa.</li>
                            <li>Ingresa tu <b>usuario</b> y <b>contraseña</b>.</li>
                            <li>Haz clic en <b>Iniciar Sesión</b>.</li>
                        </ol>
                        <Typography variant="subtitle2" color="primary">Recomendación:</Typography>
                        <Typography>Cambia tu contraseña la primera vez que ingreses.</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1">Recuperar contraseña</Typography>
                        <ol>
                            <li>Haz clic en “¿Olvidaste tu contraseña?”.</li>
                            <li>Ingresa tu correo electrónico registrado.</li>
                            <li>Revisa tu correo y sigue las instrucciones para restablecer la contraseña.</li>
                        </ol>
                        <Typography variant="subtitle1">Cerrar sesión</Typography>
                        <ul>
                            <li>Haz clic en tu nombre de usuario (esquina superior derecha).</li>
                            <li>Selecciona “Cerrar Sesión”.</li>
                        </ul>
                        <Typography variant="subtitle2" color="error">Advertencia:</Typography>
                        <Typography>Por seguridad, cierra sesión siempre que termines de usar el sistema.</Typography>
                    </>
                )}

                {/* ... Repite el patrón para cada sección, usando el contenido del manual extenso anterior ... */}

                {seccionActiva === "productos" && (
                    <>
                        <Typography variant="h5" gutterBottom>Módulo de Productos</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1">Ver listado de productos</Typography>
                        <Typography>Accede al menú <b>Productos</b> para visualizar la lista con nombre, código, tipo, stock, precio y estado (activo/inactivo).</Typography>
                        <Typography variant="subtitle1" sx={{ mt: 2 }}>Buscar productos</Typography>
                        <Typography>Usa la barra de búsqueda para filtrar por nombre, código o tipo. Puedes combinar filtros para búsquedas más precisas.</Typography>
                        <Typography variant="subtitle1" sx={{ mt: 2 }}>Agregar un nuevo producto</Typography>
                        <ol>
                            <li>Haz clic en <b>Nuevo Producto</b>.</li>
                            <li>Completa los campos obligatorios: Nombre, Código, Tipo, Precio, Stock, Unidad, Estado.</li>
                            <li>Opcional: agrega una descripción y carga una imagen.</li>
                            <li>Haz clic en <b>Guardar</b>.</li>
                        </ol>
                        <Typography variant="body2" color="primary">Ejemplo: Producto: “Aceite de Girasol 900ml”, Código: “A001”, Tipo: “Alimento Envasado”, Precio: “12.000”, Stock: “50”.</Typography>
                        {/* ...continúa con el resto de las instrucciones del módulo... */}
                    </>
                )}

                {/* ...continúa con el resto de los módulos usando el contenido del manual extenso... */}

                {seccionActiva === "faq" && (
                    <>
                        <Typography variant="h5" gutterBottom>Preguntas Frecuentes y Soporte</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1">¿Cómo exporto un reporte?</Typography>
                        <Typography>Haz clic en los botones “Exportar Excel” o “Exportar PDF” en la pantalla del reporte.</Typography>
                        <Typography variant="subtitle1" sx={{ mt: 2 }}>¿Qué hago si no encuentro un producto o cliente?</Typography>
                        <Typography>Verifica la ortografía en la búsqueda. Si no existe, agrégalo desde el módulo correspondiente.</Typography>
                        {/* ...y así sucesivamente... */}
                    </>
                )}

                {seccionActiva === "consejos" && (
                    <>
                        <Typography variant="h5" gutterBottom>Consejos y Buenas Prácticas</Typography>
                        <Divider sx={{ my: 2 }} />
                        <ul>
                            <li>Realiza copias de seguridad periódicas de los reportes.</li>
                            <li>Mantén actualizados los datos de productos y clientes.</li>
                            <li>Revisa los permisos de usuario regularmente.</li>
                            <li>No compartas tu usuario ni contraseña.</li>
                            <li>Cierra sesión al finalizar tu trabajo.</li>
                        </ul>
                    </>
                )}
            </Box>
        </Box>
    )
}