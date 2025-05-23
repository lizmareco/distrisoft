// src/components/pedidos/GestionProduccion.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Iconos
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactoryIcon from '@mui/icons-material/Factory';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function GestionProduccion({ idPedido }) {
  const [pedido, setPedido] = useState(null);
  const [verificacionStock, setVerificacionStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogoCrearOrden, setDialogoCrearOrden] = useState(false);
  const [dialogoRegistrarProduccion, setDialogoRegistrarProduccion] = useState(false);
  const [dialogoMaterialesFaltantes, setDialogoMaterialesFaltantes] = useState(false);
  const [ordenesProduccion, setOrdenesProduccion] = useState([]);
  const [produccionesRegistradas, setProduccionesRegistradas] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [loadingAccion, setLoadingAccion] = useState(false);
  
  // Estados para el formulario de crear orden
  const [nuevaOrden, setNuevaOrden] = useState({
    operadorEncargado: '',
    fechaInicioProd: dayjs(),
    fechaFinProd: dayjs().add(7, 'day')
  });
  
  // Estados para el formulario de registrar producción
  const [nuevaProduccion, setNuevaProduccion] = useState({
    idOrdenProduccion: '',
    idFormula: '',
    idProducto: '',
    cantidadProducida: 0,
    observaciones: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar detalles del pedido
        const resPedido = await fetch(`/api/pedidos/${idPedido}`);
        if (!resPedido.ok) throw new Error('Error al cargar el pedido');
        const dataPedido = await resPedido.json();
        setPedido(dataPedido);
        
        // Verificar stock
        const resStock = await fetch('/api/pedidos/verificar-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idPedido })
        });
        if (!resStock.ok) throw new Error('Error al verificar stock');
        const dataStock = await resStock.json();
        setVerificacionStock(dataStock);
        
        // Cargar órdenes de producción existentes
        const resOrdenes = await fetch(`/api/produccion/ordenes?idPedido=${idPedido}`);
        if (resOrdenes.ok) {
          const dataOrdenes = await resOrdenes.json();
          setOrdenesProduccion(dataOrdenes);
          
          // Si hay órdenes, cargar producciones registradas
          if (dataOrdenes.length > 0) {
            const resProduccion = await fetch(`/api/produccion/registros?idOrdenProduccion=${dataOrdenes[0].idOrdenProduccion}`);
            if (resProduccion.ok) {
              const dataProduccion = await resProduccion.json();
              setProduccionesRegistradas(dataProduccion);
            }
          }
        }
        
        // Cargar operadores
        const resOperadores = await fetch('/api/usuarios/operadores');
        if (resOperadores.ok) {
          const dataOperadores = await resOperadores.json();
          setOperadores(dataOperadores);
        }
        
        // Cargar fórmulas disponibles
        const resFormulas = await fetch('/api/formulas');
        if (resFormulas.ok) {
          const dataFormulas = await resFormulas.json();
          setFormulas(dataFormulas);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (idPedido) {
      cargarDatos();
    }
  }, [idPedido]);

  // Refrescar verificación de stock
  const refrescarVerificacionStock = async () => {
    try {
      setLoadingAccion(true);
      const resStock = await fetch('/api/pedidos/verificar-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPedido })
      });
      if (!resStock.ok) throw new Error('Error al verificar stock');
      const dataStock = await resStock.json();
      setVerificacionStock(dataStock);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Crear nueva orden de producción
  const crearOrdenProduccion = async () => {
    try {
      setLoadingAccion(true);
      const res = await fetch('/api/produccion/orden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPedido,
          ...nuevaOrden,
          idUsuario: localStorage.getItem('userId') || 1 // Obtener el ID del usuario actual
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear orden de producción');
      }
      
      const data = await res.json();
      setOrdenesProduccion([...ordenesProduccion, data.ordenProduccion]);
      setDialogoCrearOrden(false);
      
      // Recargar datos del pedido para ver el cambio de estado
      const resPedido = await fetch(`/api/pedidos/${idPedido}`);
      if (resPedido.ok) {
        const dataPedido = await resPedido.json();
        setPedido(dataPedido);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Registrar producción
  const registrarProduccion = async () => {
    try {
      setLoadingAccion(true);
      const res = await fetch('/api/produccion/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevaProduccion,
          idUsuario: localStorage.getItem('userId') || 1 // Obtener el ID del usuario actual
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al registrar producción');
      }
      
      const data = await res.json();
      setProduccionesRegistradas([...produccionesRegistradas, data.produccion]);
      setDialogoRegistrarProduccion(false);
      
      // Recargar verificación de stock
      await refrescarVerificacionStock();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Generar cotización para materiales faltantes
  const generarCotizacionMaterialesFaltantes = () => {
    // Aquí iría la lógica para redirigir al usuario a la página de creación de cotización
    // con los materiales faltantes precargados
    console.log("Materiales faltantes para cotización:", verificacionStock?.materialesFaltantes);
    
    // Por ahora solo cerramos el diálogo
    setDialogoMaterialesFaltantes(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Información del pedido */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <ShoppingCartIcon sx={{ mr: 1 }} /> Información del Pedido #{pedido?.idPedido}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Cliente:</Typography>
            <Typography variant="body1">
              {pedido?.cliente?.persona?.nombre} {pedido?.cliente?.persona?.apellido}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Estado:</Typography>
            <Chip 
              label={pedido?.estadoPedido?.descEstadoPedido || 'Desconocido'} 
              color={pedido?.estadoPedido?.descEstadoPedido === 'EN PRODUCCION' ? 'primary' : 'default'}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2">Productos:</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedido?.pedidoDetalle?.map((detalle) => (
                    <TableRow key={detalle.idProducto}>
                      <TableCell>{detalle.producto?.nombreProducto}</TableCell>
                      <TableCell align="right">{detalle.cantidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Verificación de stock */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <FactoryIcon sx={{ mr: 1 }} /> Verificación de Stock
          </Typography>
          
          <Tooltip title="Refrescar verificación de stock">
            <IconButton onClick={refrescarVerificacionStock} disabled={loadingAccion}>
              {loadingAccion ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {verificacionStock?.stockSuficiente ? (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            icon={<CheckCircleIcon fontSize="inherit" />}
          >
            Hay suficiente stock para iniciar la producción
          </Alert>
        ) : (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            icon={<WarningIcon fontSize="inherit" />}
          >
            No hay suficiente stock para completar el pedido
          </Alert>
        )}
        
        {verificacionStock?.materialesFaltantes?.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Materiales faltantes:
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Materia Prima</TableCell>
                    <TableCell align="right">Stock Actual</TableCell>
                    <TableCell align="right">Cantidad Necesaria</TableCell>
                    <TableCell align="right">Faltante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verificacionStock.materialesFaltantes.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell>{material.materiaPrima}</TableCell>
                      <TableCell align="right">{material.stockActual}</TableCell>
                      <TableCell align="right">{material.cantidadNecesaria}</TableCell>
                      <TableCell align="right">{material.faltante}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="error">
                Nota: Debes generar una cotización para adquirir los materiales faltantes antes de iniciar la producción.
              </Typography>
              
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => setDialogoMaterialesFaltantes(true)}
                sx={{ mt: 1 }}
              >
                Ver opciones para materiales faltantes
              </Button>
            </Box>
          </>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddCircleIcon />}
            disabled={!verificacionStock?.stockSuficiente || ordenesProduccion.length > 0 || loadingAccion}
            onClick={() => setDialogoCrearOrden(true)}
          >
            Crear Orden de Producción
          </Button>
        </Box>
      </Paper>
      
      {/* Órdenes de producción */}
      {ordenesProduccion.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Órdenes de Producción
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Operador</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordenesProduccion.map((orden) => (
                  <TableRow key={orden.idOrdenProduccion}>
                    <TableCell>{orden.idOrdenProduccion}</TableCell>
                    <TableCell>{new Date(orden.fechaInicioProd).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(orden.fechaFinProd).toLocaleDateString()}</TableCell>
                    <TableCell>{orden.operadorNombre || orden.operadorEncargado}</TableCell>
                    <TableCell>
                      <Chip 
                        label={orden.estadoOrdenProd?.descEstadoOrdenProd || 'Desconocido'} 
                        color={orden.estadoOrdenProd?.descEstadoOrdenProd === 'COMPLETADA' ? 'success' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<AddCircleIcon />}
                        onClick={() => {
                          setNuevaProduccion({
                            ...nuevaProduccion,
                            idOrdenProduccion: orden.idOrdenProduccion
                          });
                          setDialogoRegistrarProduccion(true);
                        }}
                      >
                        Registrar Producción
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Producciones registradas */}
      {produccionesRegistradas.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Producciones Registradas
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Fórmula</TableCell>
                  <TableCell>Usuario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produccionesRegistradas.map((prod) => (
                  <TableRow key={prod.idProduccion}>
                    <TableCell>{prod.idProduccion}</TableCell>
                    <TableCell>{new Date(prod.fechaProduccion).toLocaleString()}</TableCell>
                    <TableCell>{prod.producto?.nombreProducto || prod.idProducto}</TableCell>
                    <TableCell align="right">{prod.cantidadProducida}</TableCell>
                    <TableCell>{prod.formula?.nombre || prod.idFormula}</TableCell>
                    <TableCell>
                      {prod.usuario?.persona 
                        ? `${prod.usuario.persona.nombre} ${prod.usuario.persona.apellido}`
                        : prod.usuario?.nombreUsuario || `Usuario ID: ${prod.idUsuario}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Diálogo para crear orden de producción */}
      <Dialog open={dialogoCrearOrden} onClose={() => setDialogoCrearOrden(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Orden de Producción</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Operador Encargado"
                  fullWidth
                  value={nuevaOrden.operadorEncargado}
                  onChange={(e) => setNuevaOrden({...nuevaOrden, operadorEncargado: e.target.value})}
                >
                  {operadores.map((op) => (
                    <MenuItem key={op.idUsuario} value={op.idUsuario}>
                      {op.nombreUsuario} - {op.persona?.nombre} {op.persona?.apellido}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    label="Fecha Inicio"
                    value={nuevaOrden.fechaInicioProd}
                    onChange={(newValue) => setNuevaOrden({...nuevaOrden, fechaInicioProd: newValue})}
                    slotProps={{
                      textField: { fullWidth: true }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    label="Fecha Fin Estimada"
                    value={nuevaOrden.fechaFinProd}
                    onChange={(newValue) => setNuevaOrden({...nuevaOrden, fechaFinProd: newValue})}
                    slotProps={{
                      textField: { fullWidth: true }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoCrearOrden(false)}>Cancelar</Button>
          <Button 
            onClick={crearOrdenProduccion} 
            variant="contained" 
            color="primary"
            disabled={!nuevaOrden.operadorEncargado || loadingAccion}
          >
            {loadingAccion ? <CircularProgress size={24} /> : 'Crear Orden'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para registrar producción */}
      <Dialog open={dialogoRegistrarProduccion} onClose={() => setDialogoRegistrarProduccion(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Producción</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Fórmula"
                  fullWidth
                  value={nuevaProduccion.idFormula}
                  onChange={(e) => {
                    const formulaSeleccionada = formulas.find(f => f.idFormula === e.target.value);
                    setNuevaProduccion({
                      ...nuevaProduccion, 
                      idFormula: e.target.value,
                      idProducto: formulaSeleccionada?.idProducto || ''
                    });
                  }}
                >
                  {formulas.map((formula) => (
                    <MenuItem key={formula.idFormula} value={formula.idFormula}>
                      {formula.nombre} - {formula.producto?.nombreProducto}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cantidad Producida"
                  type="number"
                  fullWidth
                  value={nuevaProduccion.cantidadProducida}
                  onChange={(e) => setNuevaProduccion({...nuevaProduccion, cantidadProducida: parseInt(e.target.value)})}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  fullWidth
                  multiline
                  rows={3}
                  value={nuevaProduccion.observaciones}
                  onChange={(e) => setNuevaProduccion({...nuevaProduccion, observaciones: e.target.value})}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoRegistrarProduccion(false)}>Cancelar</Button>
          <Button 
            onClick={registrarProduccion} 
            variant="contained" 
            color="primary"
            disabled={!nuevaProduccion.idFormula || nuevaProduccion.cantidadProducida <= 0 || loadingAccion}
          >
            {loadingAccion ? <CircularProgress size={24} /> : 'Registrar Producción'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para materiales faltantes */}
      <Dialog open={dialogoMaterialesFaltantes} onClose={() => setDialogoMaterialesFaltantes(false)} maxWidth="md" fullWidth>
        <DialogTitle>Opciones para Materiales Faltantes</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Para continuar con la producción, necesitas adquirir los siguientes materiales:
          </Alert>
          
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Materia Prima</TableCell>
                  <TableCell align="right">Stock Actual</TableCell>
                  <TableCell align="right">Cantidad Necesaria</TableCell>
                  <TableCell align="right">Faltante</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {verificacionStock?.materialesFaltantes?.map((material, index) => (
                  <TableRow key={index}>
                    <TableCell>{material.materiaPrima}</TableCell>
                    <TableCell align="right">{material.stockActual}</TableCell>
                    <TableCell align="right">{material.cantidadNecesaria}</TableCell>
                    <TableCell align="right">{material.faltante}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography variant="subtitle1" gutterBottom>
            Pasos a seguir:
          </Typography>
          
          <ol>
            <li>
              <Typography variant="body2" paragraph>
                Generar una cotización para los materiales faltantes.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                Esperar la aprobación de la cotización.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                Crear una orden de compra basada en la cotización aprobada.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" paragraph>
                Recibir los materiales y actualizar el inventario.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Volver a verificar el stock y crear la orden de producción.
              </Typography>
            </li>
          </ol>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoMaterialesFaltantes(false)}>Cerrar</Button>
          <Button 
            onClick={generarCotizacionMaterialesFaltantes} 
            variant="contained" 
            color="primary"
          >
            Ir a Crear Cotización
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}