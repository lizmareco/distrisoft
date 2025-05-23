// src/components/formulas/DetalleFormula.jsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

export default function DetalleFormula({ formulaId }) {
  const router = useRouter();
  const [formula, setFormula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar datos de la fórmula
  useEffect(() => {
    const cargarFormula = async () => {
      try {
        setLoading(true);
        const respuesta = await fetch(`/api/formulas/${formulaId}`);
        
        if (!respuesta.ok) {
          throw new Error(`Error al cargar fórmula: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        setFormula(datos);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (formulaId) {
      cargarFormula();
    }
  }, [formulaId]);
  
  // Volver a la lista de fórmulas
  const volverALista = () => {
    router.push('/formulas');
  };
  
  // Ir a editar fórmula
  const irAEditarFormula = () => {
    router.push(`/formulas/editar/${formulaId}`);
  };
  
  // Ir a eliminar fórmula
  const irAEliminarFormula = () => {
    router.push(`/formulas?eliminar=${formulaId}`);
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
  
  if (!formula) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        No se encontró la fórmula solicitada
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={volverALista}
        >
          Volver a la lista
        </Button>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<EditIcon />} 
            onClick={irAEditarFormula}
            sx={{ mr: 1 }}
          >
            Editar
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />} 
            onClick={irAEliminarFormula}
          >
            Eliminar
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {formula.nombre}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Producto:
            </Typography>
            <Typography variant="body1">
              {formula.producto?.nombreProducto || 'No disponible'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Rendimiento:
            </Typography>
            <Typography variant="body1">
              {formula.rendimiento} unidades
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">
              Descripción:
            </Typography>
            <Typography variant="body1">
              {formula.descripcion || 'Sin descripción'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Materias Primas
        </Typography>
        
        {formula.FormulaDetalle?.length === 0 ? (
          <Alert severity="info">
            Esta fórmula no tiene materias primas registradas
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Materia Prima</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Stock Actual</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formula.FormulaDetalle?.map((detalle) => (
                  <TableRow key={detalle.idFormulaDetalle}>
                    <TableCell>
                      {detalle.materiaPrima?.nombreMateriaPrima || `Materia Prima #${detalle.idMateriaPrima}`}
                    </TableCell>
                    <TableCell>
                      {detalle.materiaPrima?.descMateriaPrima || 'Sin descripción'}
                    </TableCell>
                    <TableCell align="right">{detalle.cantidad}</TableCell>
                    <TableCell>{detalle.unidadMedida}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${detalle.materiaPrima?.stockActual || 0} ${detalle.unidadMedida}`}
                        color={
                          (detalle.materiaPrima?.stockActual || 0) >= detalle.cantidad 
                            ? 'success' 
                            : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}