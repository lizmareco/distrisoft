// app/pedidos/[id]/produccion/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GestionProduccion from '@/src/components/pedidos/GestionProduccion';
import { useRouter } from 'next/navigation';

export default function ProduccionPedidoPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    const cargarPedido = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/pedidos/${id}`);
        
        if (!res.ok) {
          throw new Error(`Error al cargar pedido: ${res.status}`);
        }
        
        const data = await res.json();
        setPedido(data);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      cargarPedido();
    }
  }, [id]);

  const volverAPedido = () => {
    router.push(`/pedidos/${id}`);
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={volverAPedido}>
          Volver al Pedido
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={volverAPedido}>
          Volver al Pedido
        </Button>
        
        <Typography variant="h5">
          Gestión de Producción - Pedido #{id}
        </Typography>
      </Box>
      
      <GestionProduccion idPedido={parseInt(id)} />
    </Box>
  );
}