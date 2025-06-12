// app/formulas/page.jsx
"use client";

import React from 'react';
import { Box, Container, Alert, Button } from '@mui/material';
import ListaFormulas from '@/src/components/formulas/ListaFormulas';
import Link from "next/link";
import { ArrowBack } from "@mui/icons-material";
import { useRootContext } from "@/src/app/context/root";

export default function FormulasPage() {
  // Llamada incondicional a hooks
  const context = useRootContext();
  const permisos = context.session?.permisos || [];
  const hasPermission = permisos.find(permiso => permiso === "VIEW_FORMULA") || context.session?.isAdmin;

  // Definimos el contenido según permisos sin afectar el orden de hooks
  const content = !hasPermission ? (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Alert severity="error">No tiene permisos para ver esta página</Alert>
    </Container>
  ) : (
    <Container maxWidth="xl">
      <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
        Volver a Gestión
      </Button>
      <Box sx={{ py: 4 }}>
        <ListaFormulas />
      </Box>
    </Container>
  );

  return content;
}