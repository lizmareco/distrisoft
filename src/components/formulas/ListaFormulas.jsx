// src/components/formulas/ListaFormulas.jsx
"use client";

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
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';

export default function ListaFormulas() {
  const router = useRouter();
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [formulaAEliminar, setFormulaAEliminar] = useState(null);
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Cargar fórmulas al montar el componente
  useEffect(() => {
    cargarFormulas();
  }, []);

  // Función para cargar fórmulas
  const cargarFormulas = async () => {
    try {
      setLoading(true);
      const respuesta = await fetch('/api/formulas');
      
      if (!respuesta.ok) {
        throw new Error(`Error al cargar fórmulas: ${respuesta.status}`);
      }
      
      const datos = await respuesta.json();
      setFormulas(datos);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar fórmulas según término de búsqueda
  const formulasFiltradas = formulas.filter(formula => 
    formula.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    formula.producto?.nombreProducto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    formula.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Navegar a la página de crear fórmula
  const irACrearFormula = () => {
    router.push('/formulas/nueva');
  };

  // Navegar a la página de ver fórmula
  const irAVerFormula = (id) => {
    router.push(`/formulas/${id}`);
  };

  // Navegar a la página de editar fórmula
  const irAEditarFormula = (id) => {
    router.push(`/formulas/editar/${id}`);
  };

  // Abrir diálogo de confirmación para eliminar
  const confirmarEliminar = (formula) => {
    setFormulaAEliminar(formula);
    setDialogoEliminarAbierto(true);
  };

  // Cerrar diálogo de confirmación
  const cerrarDialogoEliminar = () => {
    setDialogoEliminarAbierto(false);
    setFormulaAEliminar(null);
  };

  // Eliminar fórmula
  const eliminarFormula = async () => {
    if (!formulaAEliminar) return;
    
    try {
      setEliminando(true);
      const respuesta = await fetch(`/api/formulas/${formulaAEliminar.idFormula}`, {
        method: 'DELETE'
      });
      
      if (!respuesta.ok) {
        throw new Error(`Error al eliminar fórmula: ${respuesta.status}`);
      }
      
      // Actualizar la lista de fórmulas
      setFormulas(formulas.filter(f => f.idFormula !== formulaAEliminar.idFormula));
      
      // Cerrar el diálogo
      cerrarDialogoEliminar();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Fórmulas de Producción</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={irACrearFormula}
        >
          Nueva Fórmula
        </Button>
      </Box>
      
      <TextField
        fullWidth
        placeholder="Buscar fórmulas..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      {formulasFiltradas.length === 0 ? (
        <Alert severity="info">
          No se encontraron fórmulas. {busqueda ? 'Intenta con otra búsqueda.' : 'Crea una nueva fórmula para comenzar.'}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell>Rendimiento</TableCell>
                <TableCell>Materias Primas</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formulasFiltradas.map((formula) => (
                <TableRow key={formula.idFormula}>
                  <TableCell>{formula.nombre}</TableCell>
                  <TableCell>{formula.producto?.nombreProducto || 'No disponible'}</TableCell>
                  <TableCell>{formula.rendimiento} unidades</TableCell>
                  <TableCell>
                    {formula.FormulaDetalle?.length || 0} materias primas
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        color="info" 
                        onClick={() => irAVerFormula(formula.idFormula)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton 
                        color="primary" 
                        onClick={() => irAEditarFormula(formula.idFormula)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton 
                        color="error" 
                        onClick={() => confirmarEliminar(formula)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={dialogoEliminarAbierto}
        onClose={cerrarDialogoEliminar}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la fórmula "{formulaAEliminar?.nombre}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoEliminar} disabled={eliminando}>
            Cancelar
          </Button>
          <Button 
            onClick={eliminarFormula} 
            color="error" 
            disabled={eliminando}
            startIcon={eliminando ? <CircularProgress size={20} /> : null}
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}