import { RootProvider } from "./context/root"
import MUIRegistry from "@/src/lib/mui-registry"
import "./globals.css" // Si tienes estilos globales

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <RootProvider>
          <MUIRegistry>{children}</MUIRegistry>
        </RootProvider>
      </body>
    </html>
  )
}









