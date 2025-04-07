import MUIProvider from "@/src/components/mui-provider"
import AuthNavbar from "@/src/components/auth-navbar"

export default function LoginLayout({ children }) {
  return (
    <MUIProvider>
      <AuthNavbar />
      {children}
    </MUIProvider>
  )
}

