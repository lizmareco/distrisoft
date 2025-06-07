"use client"
import { Box, Typography, List, ListItem, ListItemButton, Link, Divider } from "@mui/material"
import { useState } from "react"

const SECCIONES = [
    { id: "introduccion", label: "Introducción" },
    { id: "requisitos", label: "Requisitos del Sistema" },
    { id: "inicio", label: "Inicio de Sesión y Seguridad" },
    { id: "usuarios", label: "Módulo de Usuarios y Seguridad" },
    { id: "roles", label: "Módulo de Roles" },
    { id: "proveedores", label: "Módulo de Proveedores" },
    { id: "productos", label: "Módulo de Productos" },
    { id: "personas", label: "Módulo de Personas" },
    { id: "clientes", label: "Módulo de Clientes" },
    { id: "empresas", label: "Módulo de Empresas" },
    { id: "pedidos", label: "Módulo de Pedidos" },
    { id: "inventario", label: "Módulo de Inventario" },
    { id: "cotizacionesProveedor", label: "Módulo de Cotizacion Proveedor" },
    { id: "cotizacionesCliente", label: "Módulo de Cotizacion Cliente" },
    { id: "compras", label: "Módulo de Ordenes de Compras" },
    { id: "materiaprima", label: "Módulo de Materia Prima" },
    { id: "formulas", label: "Módulo de Formulas" },
    { id: "ordenesProduccion", label: "Módulo de Ordenes de Produccion" },
    { id: "cobrar", label: "Módulo de Cuentas por Cobrar" },
    { id: "pagar", label: "Módulo de Cuentas por Pagar" },
    { id: "Nota de Debito", label: "Módulo de Nota de Debito" },
    { id: "Nota de Credito", label: "Módulo de Nota de Credito" },
    { id: "Nota de Facturacion", label: "Módulo de Facturacion" },
    { id: "reportes", label: "Módulo de Reportes" },
    { id: "faq", label: "Preguntas Frecuentes y Soporte" },
    { id: "consejos", label: "Consejos y Buenas Prácticas" },
]

export default function ManualDeUsuario() {
    const [seccionActiva, setSeccionActiva] = useState("introduccion")

    return (
        <Box sx={{ display: "flex", minHeight: "80vh" }}>
            {/* Menú lateral sticky */}
            <Box
                sx={{
                    width: 260,
                    borderRight: 1,
                    borderColor: "divider",
                    p: 2,
                    bgcolor: "#f7f7f7",
                    position: "sticky",
                    top: 0,
                    alignSelf: "flex-start",
                    height: "100vh",
                    overflowY: "auto",
                }}
            >
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

            {/* Contenido scrolleable */}
            <Box
                sx={{
                    flex: 1,
                    p: 4,
                    maxHeight: "100vh",
                    overflowY: "auto",
                }}
            >
                {seccionActiva === "introduccion" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Introducción
                        </Typography>

                        <Typography paragraph>
                            Este manual está dirigido a todos los usuarios del sistema de gestión desarrollado específicamente para
                            distribuidoras de alimentos y productos. Su propósito es ofrecer una guía clara, práctica y completa
                            sobre el funcionamiento y uso adecuado de cada uno de los módulos del sistema.
                        </Typography>

                        <Typography paragraph>
                            El contenido de este manual incluye:
                        </Typography>

                        <ul>
                            <li>
                                <Typography>
                                    Instrucciones detalladas y paso a paso para operar correctamente cada módulo
                                    (<b>ventas, stock, producción, facturación</b>, entre otros).
                                </Typography>
                            </li>
                            <li>
                                <Typography>
                                    Recomendaciones de uso para aprovechar al máximo las funcionalidades del sistema y
                                    optimizar los procesos internos de la empresa.
                                </Typography>
                            </li>
                            <li>
                                <Typography>
                                    Advertencias y buenas prácticas para evitar errores comunes, prevenir pérdidas de información
                                    y garantizar la integridad de los datos.
                                </Typography>
                            </li>
                            <li>
                                <Typography>
                                    Soluciones a problemas frecuentes con sugerencias claras para resolverlos de forma rápida y efectiva.
                                </Typography>
                            </li>
                            <li>
                                <Typography>
                                    Glosario de términos técnicos y comerciales utilizados en el sistema.
                                </Typography>
                            </li>
                            <li>
                                <Typography>
                                    Sección de <b>Preguntas Frecuentes (FAQ)</b> con respuestas a las dudas más comunes de los usuarios.
                                </Typography>
                            </li>
                            <li>
                                <Typography>
                                    Información sobre los canales de <b>soporte técnico</b> y contacto en caso de requerir ayuda adicional
                                    o reportar incidentes.
                                </Typography>
                            </li>
                        </ul>

                        <Typography paragraph sx={{ mt: 2 }}>
                            Este documento ha sido diseñado pensando en usuarios con distintos niveles de experiencia tecnológica,
                            desde principiantes hasta usuarios avanzados. Su finalidad es facilitar la adopción del sistema, garantizar
                            una experiencia de uso eficiente y contribuir a la mejora continua de la gestión operativa de tu empresa.
                        </Typography>
                    </>
                )}


                {seccionActiva === "requisitos" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Requisitos del Sistema
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Navegador web actualizado:</strong> Se recomienda utilizar las versiones más recientes de
                                        <em> Google Chrome</em>, <em> Mozilla Firefox</em> o <em> Microsoft Edge</em> para garantizar la compatibilidad total con el sistema.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Conexión a Internet estable y segura:</strong> Es indispensable contar con una conexión de banda ancha confiable para evitar interrupciones durante el uso del sistema, especialmente al cargar datos, generar informes o emitir facturas.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Credenciales de acceso:</strong> Cada usuario debe disponer de un <em>nombre de usuario</em> y <em>contraseña</em> provistos por el administrador del sistema. Estas credenciales son personales, intransferibles y deben mantenerse seguras.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Dispositivo compatible:</strong> Se puede acceder al sistema desde <em>PCs, notebooks o tablets</em> con sistema operativo actualizado (<em>Windows</em>, <em>macOS</em> o <em>Linux</em>). Aunque el acceso desde teléfonos móviles es posible, se recomienda usar pantallas medianas o grandes para una mejor experiencia.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Resolución de pantalla recomendada:</strong> Para una visualización óptima de todos los componentes de la interfaz, se sugiere una resolución mínima de <em>1366 x 768 píxeles</em>.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Permitir JavaScript y ventanas emergentes:</strong> Deben estar habilitados tanto <em>JavaScript</em> como las <em>ventanas emergentes</em> desde el dominio del sistema para garantizar el correcto funcionamiento de funciones como vistas previas, reportes o descargas.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Software adicional (si aplica):</strong> Para visualizar o descargar ciertos documentos (como facturas en PDF), se puede requerir un visor actualizado, por ejemplo, <em>Adobe Acrobat Reader</em> u otro compatible.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}


                {seccionActiva === "inicio" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Inicio de Sesión y Seguridad
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        {/* Ingreso al sistema */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
                            Cómo ingresar al sistema
                        </Typography>
                        <ol>
                            <li>Accede a la URL del sistema proporcionada por tu empresa o administrador.</li>
                            <li>Ingresa tu <b>nombre de usuario</b> y <b>contraseña</b> en los campos correspondientes.</li>
                            <li>Haz clic en el botón <b>Iniciar Sesión</b> para acceder al sistema.</li>
                        </ol>

                        <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
                            Recomendación:
                        </Typography>
                        <Typography>
                            Cambia tu contraseña en tu primer ingreso y evita utilizar contraseñas obvias o compartidas.
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        {/* Recuperar contraseña */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
                            ¿Olvidaste tu contraseña?
                        </Typography>
                        <ol>
                            <li>Haz clic en el enlace <b>“¿Olvidaste tu contraseña?”</b> en la pantalla de inicio de sesión.</li>
                            <li>Ingresa tu <b>correo electrónico</b> registrado en el sistema.</li>
                            <li>Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</li>
                        </ol>

                        <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
                            Sugerencia:
                        </Typography>
                        <Typography>
                            Si no recibes el correo en unos minutos, verifica tu carpeta de spam o comunícate con el administrador del sistema.
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        {/* Cierre de sesión */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
                            Cerrar sesión
                        </Typography>
                        <ul>
                            <li>Haz clic en tu nombre de usuario ubicado en la esquina superior derecha de la pantalla.</li>
                            <li>Selecciona la opción <b>“Cerrar Sesión”</b> en el menú desplegable.</li>
                        </ul>

                        <Typography variant="subtitle2" color="error" sx={{ mt: 1 }}>
                            Importante:
                        </Typography>
                        <Typography>
                            Por razones de seguridad, cierra sesión siempre que termines de usar el sistema, especialmente si estás en un dispositivo compartido o público.
                        </Typography>
                    </>
                )}

                {seccionActiva === "roles" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Roles
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar roles:</strong> Consulta el listado de todos los roles registrados, incluyendo su nombre, estado y permisos asociados.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Crear nuevo rol:</strong> Haz clic en el botón <em>"Nuevo Rol"</em> para registrar un nuevo rol en el sistema.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Editar rol:</strong> Haz clic en el ícono de lápiz para modificar los datos y permisos de un rol existente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Desactivar rol:</strong> Haz clic en el ícono de tacho de basura para desactivar un rol. El sistema solicitará confirmación antes de proceder y el rol cambiará su estado a INACTIVO.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Mostrar roles inactivos:</strong> Utiliza el switch para mostrar u ocultar los roles inactivos en la tabla.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualización de permisos:</strong> Cada rol muestra los permisos asociados mediante chips para una visualización clara.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y mensajes:</strong> El sistema muestra mensajes de error o confirmación según las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}


                {seccionActiva === "clientes" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Módulo de Clientes
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Registrar nuevos clientes:</strong> Puedes agregar clientes individuales o corporativos haciendo clic en el botón{" "}
                                        <em>"Registrar Nuevo Cliente"</em>. Deberás completar los datos personales y, si corresponde, asociarlo a una empresa.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Buscar clientes por documento:</strong> Utiliza el formulario de búsqueda seleccionando el <em>tipo de documento</em> e ingresando el <em>número de documento</em>. Presiona <em>"Buscar"</em> para filtrar los resultados.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Listar todos los clientes:</strong> Si deseas ver el listado completo de clientes registrados, haz clic en el botón <em>"Listar Todos"</em>.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Editar clientes:</strong> Utiliza el ícono de lápiz para modificar los datos de un cliente. Esto te permitirá actualizar información de contacto, tipo de cliente, asociación a empresa, entre otros.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Eliminar clientes:</strong> Puedes eliminar un cliente mediante el ícono de tacho de basura. El sistema pedirá confirmación antes de ejecutar la acción.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Visualización clara y segmentada:</strong> La tabla muestra información clave como el nombre, tipo de cliente (individual o corporativo), sector y empresa asociada si corresponde.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Indicadores visuales:</strong> Se utilizan <em>chips</em> e íconos para diferenciar fácilmente entre clientes corporativos e individuales, mejorando la experiencia visual.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "pedidos" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Módulo de Pedidos
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar lista de pedidos:</strong> En esta pantalla puedes ver todos los pedidos registrados, con detalles como número de pedido, cliente, fecha y estado.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Crear nuevo pedido:</strong> Para registrar un pedido nuevo, haz clic en el botón <em>"Nuevo Pedido"</em> (si está disponible) y completa los datos requeridos, como cliente, productos y cantidades.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Filtrar pedidos:</strong> Utiliza los filtros o el buscador para encontrar pedidos específicos por número, cliente o estado.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Actualizar estado del pedido:</strong> Puedes cambiar el estado del pedido para reflejar su progreso, como <em>En Proceso</em>, <em>Despachado</em> o <em>Entregado</em>.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Editar o eliminar pedidos:</strong> Si necesitas modificar la información de un pedido o eliminarlo, utiliza los íconos de edición y eliminación correspondientes. Se pedirá confirmación antes de eliminar.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Detalle del pedido:</strong> Al seleccionar un pedido, puedes revisar la lista de productos solicitados, cantidades y precios asociados.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Notificaciones y alertas:</strong> El sistema puede mostrar alertas si algún pedido tiene problemas, como stock insuficiente o retrasos en la entrega.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}


                {seccionActiva === "productos" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Módulo de Productos
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        {/* Ver listado de productos */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
                            Ver listado de productos
                        </Typography>
                        <Typography>
                            Accede al menú <b>Productos</b> para visualizar el listado completo de productos registrados en el sistema.
                            Cada ítem muestra: <b>nombre</b>, <b>código</b>, <b>tipo</b>, <b>stock disponible</b>, <b>precio</b> y <b>estado</b> (activo/inactivo).
                        </Typography>

                        {/* Buscar productos */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 3 }}>
                            Buscar productos
                        </Typography>
                        <Typography>
                            Utiliza la barra de búsqueda para filtrar productos por <b>nombre</b>, <b>código</b> o <b>tipo</b>.
                            Es posible combinar filtros para realizar búsquedas más precisas y rápidas.
                        </Typography>

                        {/* Agregar nuevo producto */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 3 }}>
                            Agregar un nuevo producto
                        </Typography>
                        <ol>
                            <li>Haz clic en el botón <b>Nuevo Producto</b>.</li>
                            <li>Completa todos los campos obligatorios:
                                <ul>
                                    <li><b>Nombre del producto</b></li>
                                    <li><b>Código</b></li>
                                    <li><b>Tipo de producto</b></li>
                                    <li><b>Precio unitario</b></li>
                                    <li><b>Stock inicial</b></li>
                                    <li><b>Unidad de medida</b></li>
                                    <li><b>Estado</b> (activo/inactivo)</li>
                                </ul>
                            </li>
                            <li>Opcionalmente, puedes agregar una <b>descripción detallada</b> y cargar una <b>imagen representativa</b> del producto.</li>
                            <li>Haz clic en <b>Guardar</b> para registrar el nuevo producto.</li>
                        </ol>

                        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                            <b>Ejemplo:</b> Producto: “Aceite de Girasol 900ml” — Código: “A001” — Tipo: “Alimento Envasado” — Precio: “12.000” — Stock: “50 unidades”.
                        </Typography>
                    </>
                )}

                {seccionActiva === "cotizacionesProveedor" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Cotizaciones de Proveedores
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar cotizaciones:</strong> En esta sección puedes consultar todas las cotizaciones registradas de proveedores, incluyendo su ID, fecha, proveedor, monto total, validez y estado.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Buscar cotizaciones:</strong> Utiliza el campo de búsqueda para filtrar cotizaciones por ID o nombre del proveedor. Esto facilita encontrar rápidamente la cotización deseada.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Crear nueva cotización:</strong> Haz clic en el botón <em>"Nueva Cotización"</em> para registrar una nueva cotización con los datos del proveedor y los productos cotizados.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Visualizar detalles:</strong> Mediante el ícono de <em>vista</em>, puedes acceder a la información completa de cada cotización para revisarla detalladamente.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Eliminar cotizaciones pendientes:</strong> Solo las cotizaciones en estado <em>"PENDIENTE"</em> pueden ser eliminadas. Confirma la eliminación mediante el diálogo que aparecerá para evitar borrados accidentales.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Estados de cotización:</strong> Las cotizaciones pueden estar en estado <em>PENDIENTE</em>, <em>APROBADA</em> o <em>RECHAZADA</em>, y se identifican fácilmente con etiquetas de colores para facilitar su seguimiento.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Notificaciones y mensajes:</strong> El sistema muestra mensajes informativos, de éxito o error mediante barras de notificación para mantenerte informado de las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "compras" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Órdenes de Compra
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar órdenes de compra:</strong> En esta sección puedes consultar todas las órdenes de compra registradas, incluyendo su número, proveedor, fecha de emisión, estado y monto total.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Buscar órdenes:</strong> Utiliza el campo de búsqueda para filtrar órdenes por número, proveedor o estado. Esto facilita encontrar rápidamente la orden deseada.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Crear nueva orden de compra:</strong> Haz clic en el botón <em>"Nueva Orden de Compra"</em> para registrar una nueva orden. Completa los datos requeridos como proveedor, productos, cantidades y condiciones de pago.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Visualizar detalles:</strong> Mediante el ícono de <em>vista</em>, puedes acceder a la información completa de cada orden, incluyendo los productos solicitados, cantidades, precios y estado de recepción.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Editar o anular órdenes:</strong> Solo las órdenes en estado <em>"PENDIENTE"</em> pueden ser editadas o anuladas. Confirma la acción mediante el diálogo que aparecerá para evitar modificaciones accidentales.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Estados de la orden:</strong> Las órdenes pueden estar en estado <em>PENDIENTE</em>, <em>ENVIADA</em>, <em>RECIBIDA</em> o <em>ANULADA</em>, y se identifican fácilmente con etiquetas de colores para facilitar su seguimiento.
                                    </Typography>
                                </li>

                                <li>
                                    <Typography>
                                        <strong>Notificaciones y mensajes:</strong> El sistema muestra mensajes informativos, de éxito o error mediante barras de notificación para mantenerte informado de las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "cobrar" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Cuentas por Cobrar
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar cuentas por cobrar:</strong> Consulta todas las cuentas pendientes de cobro, incluyendo información como número de factura, cliente, fecha de emisión, fecha de vencimiento, monto original, saldo restante y estado.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Filtrar y buscar:</strong> Utiliza los filtros para buscar cuentas por cliente, estado (vigente, vencida, cobrada) o por rango de fechas. Haz clic en "Buscar" para ver los resultados.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Ver detalles:</strong> Haz clic en una cuenta para desplegar detalles adicionales, como el historial de pagos, último pago realizado y observaciones.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Registrar cobro:</strong> Haz clic en el ícono <em>Registrar Cobro</em> o el botón correspondiente para ingresar un nuevo pago. Completa el monto, método de pago, comprobante y observaciones. Solo puedes registrar pagos hasta el saldo pendiente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Cobro rápido:</strong> Utiliza los botones de "Cobro Total" o "50%" para registrar rápidamente un pago por el total o la mitad del saldo pendiente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Ver factura:</strong> Haz clic en "Ver Factura" para visualizar el comprobante asociado a la cuenta por cobrar.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Historial de cobros:</strong> Consulta todos los pagos realizados sobre una factura desde el botón "Historial de Cobros".
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y notificaciones:</strong> El sistema muestra alertas si tienes cuentas vencidas o montos vencidos, para que puedas priorizar su gestión.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Paginación:</strong> Si hay muchas cuentas, navega entre páginas usando los controles de paginación.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "inventario" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Inventario
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Acceso al módulo:</strong> Al ingresar al módulo de Inventario, serás redirigido automáticamente a la sección de movimientos de inventario.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualizar movimientos:</strong> Consulta todos los movimientos de inventario registrados, incluyendo ingresos, egresos, transferencias y ajustes.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Filtrar y buscar:</strong> Utiliza los filtros para buscar movimientos por tipo, fecha, producto o usuario responsable.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Registrar nuevo movimiento:</strong> Haz clic en el botón correspondiente para agregar un ingreso, egreso o transferencia de inventario. Completa los datos requeridos como producto, cantidad, motivo y observaciones.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Ver detalles:</strong> Haz clic en un movimiento para ver información detallada, como fecha, productos involucrados, cantidades y usuario que realizó la acción.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y notificaciones:</strong> El sistema puede mostrar alertas si hay inconsistencias, faltantes o excesos en el inventario.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Paginación:</strong> Si hay muchos movimientos, navega entre páginas usando los controles de paginación.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "empresas" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Empresas
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Buscar empresas:</strong> Puedes buscar empresas por <em>RUC</em> o por <em>Razón Social</em> utilizando las pestañas y el formulario de búsqueda. Ingresa el dato correspondiente y haz clic en "Buscar".
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Listar todas las empresas:</strong> Haz clic en el botón <em>"Listar Todos"</em> para ver el listado completo de empresas activas con paginación.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Crear nueva empresa:</strong> Haz clic en <em>"Nueva Empresa"</em> para registrar una nueva empresa en el sistema.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Editar empresa:</strong> Haz clic en el ícono de lápiz para modificar los datos de una empresa existente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Eliminar empresa:</strong> Haz clic en el ícono de tacho de basura para eliminar una empresa. El sistema solicitará confirmación antes de proceder.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Paginación:</strong> Si hay muchas empresas, navega entre páginas usando los controles de paginación al pie de la tabla.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualización de datos:</strong> La tabla muestra información clave como ID, razón social, RUC, categoría, ciudad y contacto de cada empresa.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y mensajes:</strong> El sistema muestra mensajes de error o confirmación según las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "cotizacionesCliente" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Cotizaciones de Clientes
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar cotizaciones:</strong> Consulta todas las cotizaciones registradas, incluyendo su ID, fecha, cliente, vendedor, monto total, validez y estado.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Buscar cotizaciones:</strong> Utiliza los filtros para buscar cotizaciones por cliente, ID o estado. Puedes escribir el nombre, apellido o documento del cliente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Mostrar todas:</strong> Haz clic en el botón <em>"Mostrar Todas"</em> para ver todas las cotizaciones registradas sin aplicar filtros.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Crear nueva cotización:</strong> Haz clic en el botón <em>"Nueva Cotización"</em> para registrar una nueva cotización para un cliente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualizar detalles:</strong> Haz clic en el ícono de <em>vista</em> para acceder a la información completa de cada cotización.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Estados de cotización:</strong> Las cotizaciones pueden estar en estado <em>PENDIENTE</em>, <em>APROBADA</em>, <em>RECHAZADA</em> o <em>VENCIDA</em>, y se identifican fácilmente con etiquetas de colores.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Notificaciones y mensajes:</strong> El sistema muestra mensajes informativos, de éxito o error mediante barras de notificación para mantenerte informado de las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "pagar" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Cuentas por Pagar
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar cuentas por pagar:</strong> Consulta todas las cuentas pendientes de pago, incluyendo información como número de factura, proveedor, fecha de emisión, fecha de vencimiento, monto original, saldo restante y estado.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Filtrar y buscar:</strong> Utiliza los filtros para buscar cuentas por proveedor, estado (vigente, vencida, pagada) o por rango de fechas. Haz clic en "Buscar" para ver los resultados.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Ver detalles:</strong> Haz clic en una cuenta para desplegar detalles adicionales, como el historial de pagos, último pago realizado y observaciones.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Registrar pago:</strong> Haz clic en el ícono <em>Registrar Pago</em> o el botón correspondiente para ingresar un nuevo pago. Completa el monto, fecha, método de pago, comprobante y observaciones. Solo puedes registrar pagos hasta el saldo pendiente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Pago rápido:</strong> Utiliza los botones de "Pago Total" o "50%" para registrar rápidamente un pago por el total o la mitad del saldo pendiente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Ver factura:</strong> Haz clic en "Ver Factura" para visualizar el comprobante asociado a la cuenta por pagar.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Historial de pagos:</strong> Consulta todos los pagos realizados sobre una factura desde el botón "Historial de Pagos".
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y notificaciones:</strong> El sistema muestra alertas si tienes cuentas vencidas o montos vencidos, para que puedas priorizar su gestión.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Paginación:</strong> Si hay muchas cuentas, navega entre páginas usando los controles de paginación.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "materiaprima" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Materias Primas
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar materias primas:</strong> Consulta el listado de todas las materias primas registradas, incluyendo su nombre, descripción y estado.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Crear nueva materia prima:</strong> Haz clic en el botón <em>"Nueva Materia Prima"</em> para registrar una nueva materia prima en el sistema.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Editar materia prima:</strong> Haz clic en el ícono de lápiz para modificar los datos de una materia prima existente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Eliminar materia prima:</strong> Haz clic en el ícono de tacho de basura para eliminar una materia prima. El sistema solicitará confirmación antes de proceder.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Estados:</strong> Puedes visualizar el estado de cada materia prima (por ejemplo, activa o inactiva) en la tabla.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y mensajes:</strong> El sistema muestra mensajes de error o confirmación según las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "formulas" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Fórmulas
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Visualizar fórmulas:</strong> Consulta el listado de todas las fórmulas registradas en el sistema, incluyendo su nombre, código y descripción.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Buscar fórmulas:</strong> Utiliza el buscador para filtrar fórmulas por nombre o código y encontrar rápidamente la que necesitas.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Crear nueva fórmula:</strong> Haz clic en el botón correspondiente para agregar una nueva fórmula. Completa los datos requeridos y guarda la información.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Editar fórmula:</strong> Haz clic en el ícono de lápiz para modificar los datos de una fórmula existente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Eliminar fórmula:</strong> Haz clic en el ícono de tacho de basura para eliminar una fórmula. El sistema solicitará confirmación antes de proceder.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualización de detalles:</strong> Puedes ver los ingredientes y cantidades de cada fórmula seleccionando la opción de detalles.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "personas" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Personas
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Buscar personas por documento:</strong> Utiliza el formulario de búsqueda seleccionando el <em>tipo de documento</em> e ingresando el <em>número de documento</em>. Presiona <em>"Buscar"</em> para filtrar los resultados.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Listar todas las personas:</strong> Haz clic en el botón <em>"Listar Todos"</em> para ver el listado completo de personas registradas, con paginación.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Crear nueva persona:</strong> Haz clic en <em>"Nueva Persona"</em> para registrar una nueva persona en el sistema.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Editar persona:</strong> Haz clic en el ícono de lápiz para modificar los datos de una persona existente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Eliminar persona:</strong> Haz clic en el ícono de tacho de basura para eliminar una persona. El sistema solicitará confirmación antes de proceder.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Paginación:</strong> Si hay muchas personas, navega entre páginas usando los controles de paginación al pie de la tabla.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualización de datos:</strong> La tabla muestra información clave como nombre, apellido, documento, teléfono, correo y ciudad de cada persona.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y mensajes:</strong> El sistema muestra mensajes de error o confirmación según las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "ordenesProduccion" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Órdenes de Producción
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Buscar órdenes de producción:</strong> Utiliza los filtros para buscar órdenes por ID de orden, ID de pedido, estado, operador o mediante una búsqueda general.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Listar todas las órdenes:</strong> Haz clic en el botón <em>"Listar Todas"</em> para ver todas las órdenes de producción registradas (máximo 50 por página).
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualizar detalles:</strong> Consulta información relevante como fechas de inicio y fin, operador asignado, estado y pedido asociado.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Cambiar estado:</strong> Haz clic en <em>"Cambiar Estado"</em> para actualizar el estado de una orden. Solo las órdenes en proceso pueden ser modificadas. Al finalizar una orden, se actualiza el stock y el pedido pasa a "Listo para entrega".
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Paginación:</strong> Si hay muchas órdenes, navega entre páginas usando los controles de paginación.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y mensajes:</strong> El sistema muestra mensajes de error o confirmación según las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "proveedores" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Proveedores
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Buscar proveedores:</strong> Utiliza el formulario seleccionando el tipo y número de documento para buscar proveedores específicos. Haz clic en "Buscar" para ver los resultados.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Listar todos los proveedores:</strong> Haz clic en el botón <em>"Listar Todos"</em> para ver el listado completo de proveedores registrados.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Registrar nuevo proveedor:</strong> Haz clic en <em>"Registrar Nuevo Proveedor"</em> para agregar un proveedor al sistema.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Editar proveedor:</strong> Haz clic en el ícono de lápiz para modificar los datos de un proveedor existente.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Eliminar proveedor:</strong> Haz clic en el ícono de tacho de basura para eliminar un proveedor. El sistema solicitará confirmación antes de proceder.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualización de datos:</strong> La tabla muestra información clave como empresa, RUC, contacto, comentarios y fecha de registro.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Alertas y mensajes:</strong> El sistema muestra mensajes de error o confirmación según las acciones realizadas.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "reportes" && (
                    <>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            Gestión de Reportes
                        </Typography>

                        <Typography component="div">
                            <ul>
                                <li>
                                    <Typography>
                                        <strong>Seleccionar categoría de reporte:</strong> Utiliza las pestañas para elegir entre reportes de Administración, Ventas, Compras o Inventario.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Elegir reporte:</strong> Haz clic en el botón <em>"Generar"</em> de la tarjeta del reporte que deseas visualizar.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Visualizar reporte:</strong> El sistema mostrará el reporte seleccionado con los datos y filtros correspondientes.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Volver a la lista:</strong> Haz clic en el botón <em>"Volver"</em> para regresar al listado de reportes y seleccionar otro.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Reportes disponibles:</strong> Puedes generar reportes como Cuentas por Cobrar, Ventas por Cliente, Ventas por Producto, Ventas por Rango de Fecha, Ventas por Vendedor, Productos Más Vendidos, Clientes con Más Ventas, Facturas Emitidas, Compras por Proveedor, Compras por Producto, Órdenes de Compra, Estado de Stock, Movimientos de Inventario y Valoración de Inventario.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography>
                                        <strong>Reportes en desarrollo:</strong> Si seleccionas un reporte que aún no está disponible, el sistema mostrará un mensaje informativo.
                                    </Typography>
                                </li>
                            </ul>
                        </Typography>
                    </>
                )}

                {seccionActiva === "faq" && (
                    <>
                        <Typography variant="h5" gutterBottom>
                            Preguntas Frecuentes y Soporte
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        {[
                            {
                                pregunta: "¿Cómo exporto un reporte?",
                                respuesta: "Haz clic en los botones “Exportar Excel” o “Exportar PDF” en la pantalla del reporte. El archivo se descargará automáticamente en tu dispositivo."
                            },
                            {
                                pregunta: "¿Qué hago si no encuentro un producto, cliente o proveedor?",
                                respuesta: "Verifica la ortografía de tu búsqueda. Si no existe, puedes registrarlo desde el módulo correspondiente utilizando el botón “Nuevo” o “Registrar”."
                            },
                            {
                                pregunta: "¿Cómo recupero mi contraseña?",
                                respuesta: "Haz clic en “¿Olvidaste tu contraseña?” en la pantalla de inicio de sesión. Ingresa tu correo electrónico y sigue las instrucciones enviadas a tu email."
                            },
                            {
                                pregunta: "¿Por qué no puedo eliminar un registro?",
                                respuesta: "Algunos registros no pueden eliminarse si están vinculados a información importante como facturas, pagos o movimientos. Contacta al administrador si necesitas asistencia."
                            },
                            {
                                pregunta: "¿Cómo solicito soporte técnico?",
                                respuesta: "Comunícate con el área de soporte técnico a través del correo o teléfono disponibles en la sección de contacto del sistema. Incluye una descripción clara del problema y, si es posible, adjunta capturas de pantalla."
                            },
                            {
                                pregunta: "¿Por qué no veo algunos módulos o botones?",
                                respuesta: "Es posible que tu usuario no tenga los permisos necesarios para acceder a ciertas funciones. Solicita al administrador la revisión de tus permisos."
                            },
                            {
                                pregunta: "¿Cómo actualizo mis datos personales?",
                                respuesta: "Ve a tu perfil de usuario y haz clic en “Editar” para modificar tus datos personales, correo electrónico o contraseña."
                            },
                            {
                                pregunta: "¿Qué hago si el sistema está lento o no responde?",
                                respuesta: "Verifica tu conexión a Internet. Cierra y vuelve a abrir el navegador. Si el problema persiste, contacta al soporte técnico."
                            }
                        ].map(({ pregunta, respuesta }, index) => (
                            <Box key={index} sx={{ mt: index === 0 ? 0 : 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {pregunta}
                                </Typography>
                                <Typography>{respuesta}</Typography>
                            </Box>
                        ))}
                    </>
                )}

                {seccionActiva === "consejos" && (
                    <>
                        <Typography variant="h5" gutterBottom>
                            Consejos y Buenas Prácticas
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Box component="ul" sx={{ pl: 3 }}>
                            {[
                                "* Mantén tus credenciales seguras y no las compartas.",
                                "* Cambia tu contraseña periódicamente utilizando combinaciones seguras.",
                                "* Realiza copias de seguridad frecuentes de los datos importantes.",
                                "* Mantén actualizada la información de productos, clientes, proveedores y usuarios.",
                                "* Revisa y ajusta los permisos de usuario regularmente.",
                                "* Controla los movimientos de inventario y concilia cuentas con frecuencia.",
                                "* Verifica los efectos antes de eliminar o modificar registros.",
                                "* Utiliza filtros y buscadores para optimizar la gestión de datos.",
                                "* Cierra sesión al terminar, especialmente si usas un equipo compartido.",
                                "* Reporta errores o comportamientos inusuales al soporte técnico.",
                                "* Presta atención a las notificaciones y alertas del sistema.",
                                "* Evita usar el sistema en varias pestañas o dispositivos simultáneamente."
                            ].map((consejo, index) => (
                                <li key={index}>
                                    <Typography variant="body1" component="span">
                                        {consejo}
                                    </Typography>
                                </li>
                            ))}
                        </Box>
                    </>
                )}

            </Box>
        </Box>
    )
}