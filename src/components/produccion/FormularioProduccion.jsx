"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider
} from "@mui/material";
import FactoryIcon from "@mui/icons-material/Factory";
import InventoryIcon from "@mui/icons-material/Inventory";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function FormularioProduccion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFormulaParam = searchParams.get("formula");
  
  const [formula, setFormula] = useState(null);
  const [cantidadProducir, setCantidadProducir] = useState(1);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [materialesInsuficientes, setMaterialesInsuficientes] = useState([]);

  // Cargar datos de la fórmula
  useEffect(() => {
    const cargarFormula = async () => {
      if (!idFormulaParam) {
        setError("No se especificó una fórmula");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const respuesta = await fetch(`/api/formulas/${idFormulaParam}`);

        if (!respuesta.ok) {
          throw new Error(`Error al cargar fórmula: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        setFormula(datos);
      } catch (error) {
        console.error("Error:", error);
        setError("No se pudo cargar la fórmula. Por favor, intenta de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    cargarFormula();
  }, [idFormulaParam]);

  // Calcular materiales necesarios
  const calcularMaterialesNecesarios = () => {
    if (!formula || !formula.FormulaDetalle) return [];

    return formula.FormulaDetalle.map(detalle => {
      const cantidadNecesaria = detalle.cantidad * cantidadProducir;
      const suficiente = detalle.materiaPrima.stockActual >= cantidadNecesaria;
      
      return {
        ...detalle,
        cantidadNecesaria,
        suficiente
      };
    });
  };

  // Calcular producción total
  const calcularProduccionTotal = () => {
    if (!formula) return 0;
    return formula.rendimiento * cantidadProducir;
  };

  // Verificar si hay suficientes materiales
  const verificarMaterialesSuficientes = () => {
    const materiales = calcularMaterialesNecesarios();
    const insuficientes = materiales.filter(m => !m.suficiente);
    setMaterialesInsuficientes(insuficientes);
    return insuficientes.length === 0;
  };

  // Manejar cambio en cantidad a producir
  const handleCantidadChange = (e) => {
    const valor = parseInt(e.target.value) || 0;
    setCantidadProducir(Math.max(1, valor));
  };

  // Guardar producción
  const guardarProduccion = async (e) => {
    e.preventDefault();

    if (!verificarMaterialesSuficientes()) {
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/produccion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idFormula: formula.idFormula,
          cantidadProducir,
          observaciones
        }),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        
        if (errorData.materialesInsuficientes) {
          setMaterialesInsuficientes(errorData.materialesInsuficientes);
          throw new Error("Stock insuficiente de materias primas");
        }
        
        throw new Error(errorData.error || "Error al registrar producción");
      }

      const resultado = await respuesta.json();
      alert(`Producción registrada exitosamente. Se produjeron ${resultado.cantidadProducida} unidades.`);
      router.push("/produccion");
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al registrar la producción");
    } finally {
      setGuardando(false);
    }
  };

  // Volver a la lista
  const volver = () => {
    router.push("/formulas");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !formula) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={volver} sx={{ mt: 2 }}>
          Volver a la lista
        </Button>
      </Box>
    );
  }

  const materialesNecesarios = calcularMaterialesNecesarios();
  const produccionTotal = calcularProduccionTotal();

  return (
    <Box component="form" onSubmit={guardarProduccion} sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={volver}>
          Volver a la lista
        </Button>
        <Typography variant="h5" component="h1">
          Nueva Producción
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <FactoryIcon sx={{ mr: 1 }} /> Información de la Fórmula
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Nombre de la Fórmula</Typography>
            <Typography variant="body1" gutterBottom>
              {formula?.nombre || "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Producto</Typography>
            <Typography variant="body1" gutterBottom>
              {formula?.producto?.nombreProducto || "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Rendimiento</Typography>
            <Typography variant="body1" gutterBottom>
              {formula?.rendimiento || 0} unidades por lote
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Descripción</Typography>
            <Typography variant="body1" gutterBottom>
              {formula?.descripcion || "Sin descripción"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <InventoryIcon sx={{ mr: 1 }} /> Materias Primas Necesarias
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Materia Prima</TableCell>
                <TableCell align="right">Cantidad por Lote</TableCell>
                <TableCell align="right">Cantidad Necesaria</TableCell>
                <TableCell align="right">Stock Actual</TableCell>
                <TableCell align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materialesNecesarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay materias primas definidas en esta fórmula
                  </TableCell>
                </TableRow>
              ) : (
                materialesNecesarios.map((detalle, index) => (
                  <TableRow key={index}>
                    <TableCell>{detalle.materiaPrima.nombreMateriaPrima}</TableCell>
                    <TableCell align="right">
                      {detalle.cantidad} {detalle.unidadMedida}
                    </TableCell>
                    <TableCell align="right">
                      {detalle.cantidadNecesaria} {detalle.unidadMedida}
                    </TableCell>
                    <TableCell align="right">
                      {detalle.materiaPrima.stockActual} {detalle.unidadMedida}
                    </TableCell>
                    <TableCell align="center">
                      {detalle.suficiente ? (
                        <Alert severity="success" sx={{ py: 0 }}>
                          Suficiente
                        </Alert>
                      ) : (
                        <Alert severity="error" sx={{ py: 0 }}>
                          Insuficiente
                        </Alert>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {materialesInsuficientes.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            No hay suficiente stock de algunas materias primas para realizar esta producción.
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Detalles de Producción
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Cantidad de Lotes a Producir"
              type="number"
              fullWidth
              value={cantidadProducir}
              onChange={handleCantidadChange}
              inputProps={{ min: 1 }}
              required
              helperText={`Producirá un total de ${produccionTotal} unidades`}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observaciones"
              multiline
              rows={3}
              fullWidth
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ingrese cualquier observación relevante sobre esta producción"
            />
          </Grid>
        </Grid>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h6">
                Total a Producir: {produccionTotal} unidades
              </Typography>
            </Grid>
            <Grid item>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={guardando ? <CircularProgress size={24} /> : <SaveIcon />}
                disabled={guardando || materialesInsuficientes.length > 0}
              >
                {guardando ? "Registrando..." : "Registrar Producción"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}