// app/formulas/[id]/page.jsx
"use client";

import React, { use } from 'react'; // Importar use de React
import { Box, Container } from '@mui/material';
import DetalleFormula from '@/src/components/formulas/DetalleFormula';

export default function DetalleFormulaPage({ params }) {
  const unwrappedParams = use(params);
  const id = parseInt(unwrappedParams.id, 10);
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <DetalleFormula formulaId={id} />
      </Box>
    </Container>
  );
}