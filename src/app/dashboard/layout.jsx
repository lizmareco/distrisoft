import Navbar from "@/src/components/navbar"
import SessionTimeout from "@/src/components/session-timeout"

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <SessionTimeout />
      <main className="flex-grow p-4">{children}</main>
    </div>
  )
}

