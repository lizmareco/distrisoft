// app/formulas/page.jsx
"use client";

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import ListaFormulas from '@/src/components/formulas/ListaFormulas';

export default function FormulasPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <ListaFormulas />
      </Box>
    </Container>
  );
}