// app/formulas/nueva/page.jsx
"use client";

import React from 'react';
import { Box, Container } from '@mui/material';
import FormularioFormula from '@/src/components/formulas/FormularioFormula';

export default function NuevaFormulaPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <FormularioFormula />
      </Box>
    </Container>
  );
}