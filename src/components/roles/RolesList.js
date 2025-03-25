"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { Edit, Trash2, Shield, Power } from "lucide-react"

export default function RolesList({ roles, loading, onEdit, onDelete, onToggleStatus, onManagePermissions }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!roles || roles.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/50 rounded-md">
        <p className="text-muted-foreground">No hay roles disponibles</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Permisos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Creación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.idRol}>
              <TableCell className="font-medium">{role.idRol}</TableCell>
              <TableCell>{role.nombreRol}</TableCell>
              <TableCell>{role.descripcion || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {role.rolPermiso && role.rolPermiso.length > 0 ? (
                    <>
                      {role.rolPermiso.slice(0, 2).map((rp) => (
                        <Badge key={rp.permiso.idPermiso} variant="outline">
                          {rp.permiso.nombrePermiso}
                        </Badge>
                      ))}
                      {role.rolPermiso.length > 2 && (
                        <Badge variant="outline" className="bg-muted">
                          +{role.rolPermiso.length - 2} más
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin permisos</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={role.deletedAt ? "destructive" : "success"}>
                  {role.deletedAt ? "Inhabilitado" : "Habilitado"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(role.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => onEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar rol</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => onManagePermissions(role)}>
                          <Shield className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gestionar permisos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={role.deletedAt ? "outline" : "outline"}
                          size="icon"
                          onClick={() => onToggleStatus(role)}
                        >
                          <Power className={`h-4 w-4 ${role.deletedAt ? "text-green-500" : "text-red-500"}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{role.deletedAt ? "Habilitar rol" : "Inhabilitar rol"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="destructive" size="icon" onClick={() => onDelete(role)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminar rol</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

