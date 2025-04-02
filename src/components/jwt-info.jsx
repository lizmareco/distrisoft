"use client"

import { useState, useEffect } from "react"
import { useRootContext } from "@/src/app/context/root"
import {
  Paper,
  Typography,
  Box,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material"
import { ExpandMore, Info } from "@mui/icons-material"

export default function JWTInfo() {
  const [decodedToken, setDecodedToken] = useState(null)
  const [expirationTime, setExpirationTime] = useState(null)
  const [tokenError, setTokenError] = useState(null)
  const context = useRootContext()

  useEffect(() => {
    if (context?.session?.token) {
      try {
        console.log("Token a decodificar:", context.session.token)

        // Dividir el token en sus partes
        const tokenParts = context.session.token.split(".")

        if (tokenParts.length !== 3) {
          setTokenError("El formato del token no es válido. Debe tener 3 partes separadas por puntos.")
          return
        }

        // Función para decodificar base64url a texto
        const base64UrlDecode = (str) => {
          // Convertir base64url a base64 estándar
          let base64 = str.replace(/-/g, "+").replace(/_/g, "/")
          // Añadir padding si es necesario
          while (base64.length % 4) {
            base64 += "="
          }
          // Decodificar
          try {
            return decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""),
            )
          } catch (e) {
            console.error("Error al decodificar:", e)
            return atob(base64)
          }
        }

        // Decodificar el header y el payload
        try {
          const header = JSON.parse(base64UrlDecode(tokenParts[0]))
          const payload = JSON.parse(base64UrlDecode(tokenParts[1]))

          console.log("Header decodificado:", header)
          console.log("Payload decodificado:", payload)

          setDecodedToken({ header, payload })

          // Calcular tiempo de expiración
          if (payload.exp) {
            const expirationDate = new Date(payload.exp * 1000)
            setExpirationTime(expirationDate)
          }
        } catch (parseError) {
          console.error("Error al parsear JSON:", parseError)
          setTokenError("Error al parsear el contenido del token. Formato inválido.")
        }
      } catch (error) {
        console.error("Error al decodificar el token:", error)
        setTokenError(`Error al decodificar el token: ${error.message}`)
      }
    } else {
      console.log("No hay token disponible en el contexto")
      setDecodedToken(null)
      setExpirationTime(null)
    }
  }, [context?.session?.token])

  if (tokenError) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Información del Token JWT
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {tokenError}
        </Alert>
      </Paper>
    )
  }

  if (!decodedToken) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Información del Token JWT
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No hay token disponible para mostrar.
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Información del Token JWT
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" fontWeight="bold">
            Header
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Algoritmo: <Chip label={decodedToken.header.alg} size="small" color="primary" />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tipo: <Chip label={decodedToken.header.typ} size="small" color="secondary" />
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Header completo:
          </Typography>
          <Box
            sx={{
              bgcolor: "background.paper",
              p: 1,
              borderRadius: 1,
              mt: 1,
              fontFamily: "monospace",
              fontSize: "0.8rem",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(decodedToken.header, null, 2)}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" fontWeight="bold">
            Payload
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ID Usuario: <Chip label={decodedToken.payload.idUsuario} size="small" color="info" />
            </Typography>

            {decodedToken.payload.iat && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Emitido: <Chip label={new Date(decodedToken.payload.iat * 1000).toLocaleString()} size="small" />
              </Typography>
            )}

            {expirationTime && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Expira: <Chip label={expirationTime.toLocaleString()} size="small" />
              </Typography>
            )}

            {decodedToken.payload.permisos && decodedToken.payload.permisos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Permisos:
                </Typography>
                <List dense sx={{ bgcolor: "background.paper", maxHeight: 200, overflow: "auto", borderRadius: 1 }}>
                  {decodedToken.payload.permisos.map((permiso, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={permiso} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
              Payload completo:
            </Typography>
            <Box
              sx={{
                bgcolor: "background.paper",
                p: 1,
                borderRadius: 1,
                mt: 1,
                fontFamily: "monospace",
                fontSize: "0.8rem",
                whiteSpace: "pre-wrap",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(decodedToken.payload, null, 2)}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info" icon={<Info />}>
          <Typography variant="body2">
            Este token contiene información sobre tu identidad y permisos en el sistema. No lo compartas con nadie.
          </Typography>
        </Alert>
      </Box>
    </Paper>
  )
}

