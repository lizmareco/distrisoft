// app/formulas/editar/[id]/page.jsx
"use client";

import React, { use } from 'react'; // Importar use de React
import { Box, Container } from '@mui/material';
import FormularioFormula from '@/src/components/formulas/FormularioFormula';

export default function EditarFormulaPage({ params }) {

  const unwrappedParams = use(params);
  const id = parseInt(unwrappedParams.id, 10);
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <FormularioFormula formulaId={id} />
      </Box>
    </Container>
  );
}