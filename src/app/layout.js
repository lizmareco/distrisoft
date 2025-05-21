import { Inter } from "next/font/google"
import "./globals.css"
import { RootProvider } from "@/src/app/context/root"
import AuthProvider from "@/src/app/components/auth-provider"
import Navbar from "@/src/app/components/navbar"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "DistriSoft",
  description: "Sistema de Gestión para Distribuidoras",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Script de sincronización de autenticación */}
        <Script src="/js/auth-sync.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <RootProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </RootProvider>
      </body>
    </html>
  )
}
