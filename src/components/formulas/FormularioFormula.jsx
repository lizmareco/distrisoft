// src/components/formulas/FormularioFormula.jsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

export default function FormularioFormula({ formulaId }) {
  const router = useRouter();
  const esEdicion = !!formulaId;
  
  // Estados para el formulario
  const [formula, setFormula] = useState({
    nombre: '',
    descripcion: '',
    idProducto: '',
    rendimiento: 0,
    detalles: []
  });
  
  // Estados para los catálogos
  const [productos, setProductos] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estados para el detalle actual
  const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = useState(null);
  const [cantidad, setCantidad] = useState(0);
  const [unidadMedida, setUnidadMedida] = useState('kg');
  
  // Estados para la UI
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        
        // Cargar productos
        const respuestaProductos = await fetch('/api/productos');
        if (!respuestaProductos.ok) {
          throw new Error(`Error al cargar productos: ${respuestaProductos.status}`);
        }
        const datosProductos = await respuestaProductos.json();
        setProductos(datosProductos);
        
        // Cargar materias primas
        const respuestaMP = await fetch('/api/materiaprima');
        if (!respuestaMP.ok) {
          throw new Error(`Error al cargar materias primas: ${respuestaMP.status}`);
        }
        const datosMP = await respuestaMP.json();
        setMateriasPrimas(datosMP);
        
        // Si es edición, cargar la fórmula
        if (esEdicion) {
          const respuestaFormula = await fetch(`/api/formulas/${formulaId}`);
          if (!respuestaFormula.ok) {
            throw new Error(`Error al cargar fórmula: ${respuestaFormula.status}`);
          }
          const datosFormula = await respuestaFormula.json();
          
          // Encontrar el producto seleccionado
          const producto = datosProductos.find(p => p.idProducto === datosFormula.idProducto);
          
          setFormula({
            nombre: datosFormula.nombre,
            descripcion: datosFormula.descripcion || '',
            idProducto: datosFormula.idProducto,
            rendimiento: datosFormula.rendimiento,
            detalles: datosFormula.FormulaDetalle.map(detalle => ({
              idMateriaPrima: detalle.idMateriaPrima,
              materiaPrima: detalle.materiaPrima,
              cantidad: detalle.cantidad,
              unidadMedida: detalle.unidadMedida
            }))
          });
          
          setProductoSeleccionado(producto);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError(error.message);
      } finally {
        setLoadingData(false);
      }
    };
    
    cargarDatos();
  }, [esEdicion, formulaId]);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Convertir rendimiento a número
  if (name === 'rendimiento') {
    setFormula(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0 // Convertir a entero
    }));
  } else {
    setFormula(prev => ({
      ...prev,
      [name]: value
    }));
  }
};
  
  // Manejar selección de producto
  const handleProductoChange = (event, newValue) => {
    setProductoSeleccionado(newValue);
    if (newValue) {
      setFormula(prev => ({
        ...prev,
        idProducto: newValue.idProducto
      }));
    } else {
      setFormula(prev => ({
        ...prev,
        idProducto: ''
      }));
    }
  };
  
  // Agregar detalle de materia prima
  const agregarDetalle = () => {
    if (!materiaPrimaSeleccionada || cantidad <= 0) {
      setSnackbar({
        open: true,
        message: 'Seleccione una materia prima y una cantidad válida',
        severity: 'error'
      });
      return;
    }
    
    // Verificar si ya existe la materia prima
    const existe = formula.detalles.some(d => d.idMateriaPrima === materiaPrimaSeleccionada.idMateriaPrima);
    
    if (existe) {
      setSnackbar({
        open: true,
        message: 'Esta materia prima ya está en la fórmula',
        severity: 'warning'
      });
      return;
    }
    
    // Agregar el detalle
    setFormula(prev => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          idMateriaPrima: materiaPrimaSeleccionada.idMateriaPrima,
          materiaPrima: materiaPrimaSeleccionada,
          cantidad,
          unidadMedida
        }
      ]
    }));
    
    // Limpiar campos
    setMateriaPrimaSeleccionada(null);
    setCantidad(0);
  };
  
  // Eliminar detalle
  const eliminarDetalle = (index) => {
    setFormula(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  };
  
  // Validar formulario
  const validarFormulario = () => {
    if (!formula.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'El nombre de la fórmula es requerido',
        severity: 'error'
      });
      return false;
    }
    
    if (!formula.idProducto) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar un producto',
        severity: 'error'
      });
      return false;
    }
    
    if (formula.rendimiento <= 0) {
      setSnackbar({
        open: true,
        message: 'El rendimiento debe ser mayor a cero',
        severity: 'error'
      });
      return false;
    }
    
    if (formula.detalles.length === 0) {
      setSnackbar({
        open: true,
        message: 'Debe agregar al menos una materia prima',
        severity: 'error'
      });
      return false;
    }
    
    return true;
  };
  
  // Guardar fórmula
  const guardarFormula = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    try {
      setLoading(true);

      const datosFormula = {
      ...formula,
      idProducto: parseInt(formula.idProducto, 10),
      rendimiento: parseInt(formula.rendimiento, 10),
      detalles: formula.detalles.map(detalle => ({
        ...detalle,
        idMateriaPrima: parseInt(detalle.idMateriaPrima, 10),
        cantidad: parseFloat(detalle.cantidad)
      }))
    };
      
      const url = esEdicion 
        ? `/api/formulas/${formulaId}` 
        : '/api/formulas';
      
      const method = esEdicion ? 'PUT' : 'POST';
      
      const respuesta = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosFormula)
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json();
        throw new Error(error.error || `Error al ${esEdicion ? 'actualizar' : 'crear'} la fórmula`);
      }
      
      const resultado = await respuesta.json();
      
      setSnackbar({
        open: true,
        message: `Fórmula ${esEdicion ? 'actualizada' : 'creada'} exitosamente`,
        severity: 'success'
      });
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push('/formulas');
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Cancelar y volver a la lista
  const cancelar = () => {
    router.push('/formulas');
  };
  
  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
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
    <Box component="form" onSubmit={guardarFormula}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={cancelar}
        >
          Volver
        </Button>
        <Typography variant="h5">
          {esEdicion ? 'Editar Fórmula' : 'Nueva Fórmula'}
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información General
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de la Fórmula"
              name="nombre"
              value={formula.nombre}
              onChange={handleChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={productos}
              getOptionLabel={(option) => option.nombreProducto || ''}
              value={productoSeleccionado}
              onChange={handleProductoChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Producto"
                  required
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Rendimiento (unidades)"
              name="rendimiento"
              type="number"
              value={formula.rendimiento}
              onChange={handleChange}
              required
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={formula.descripcion}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Materias Primas
        </Typography>
        
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={5}>
            <Autocomplete
              options={materiasPrimas}
              getOptionLabel={(option) => option.nombreMateriaPrima || ''}
              value={materiaPrimaSeleccionada}
              onChange={(event, newValue) => setMateriaPrimaSeleccionada(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Materia Prima"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
              InputProps={{
                inputProps: { min: 0, step: 0.01 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Unidad"
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value)}
              select
              SelectProps={{
                native: true
              }}
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
              <option value="unidad">unidad</option>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={agregarDetalle}
            >
              Agregar
            </Button>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {formula.detalles.length === 0 ? (
          <Alert severity="info">
            No hay materias primas agregadas a la fórmula
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Materia Prima</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formula.detalles.map((detalle, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {detalle.materiaPrima?.nombreMateriaPrima || `Materia Prima #${detalle.idMateriaPrima}`}
                    </TableCell>
                    <TableCell align="right">{detalle.cantidad}</TableCell>
                    <TableCell>{detalle.unidadMedida}</TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => eliminarDetalle(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
        <Button 
          variant="outlined" 
          onClick={cancelar}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Fórmula'}
        </Button>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}