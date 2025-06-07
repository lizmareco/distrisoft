// app/formulas/page.jsx
"use client";

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import ListaFormulas from '@/src/components/formulas/ListaFormulas';
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import { Button } from "@mui/material"

export default function FormulasPage() {
  return (
    <Container maxWidth="xl">
      <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
      </Button>
      <Box sx={{ py: 4 }}>
        <ListaFormulas />
      </Box>
    </Container>
  );
}