"use client"

import { useState, useEffect } from "react"
import RolesList from "./RolesList"
import RoleForm from "./RoleForm"
import PermissionAssignment from "./PermissionAssignment"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog"
import { useToast } from "@/src/hooks/use-toast"
import { fetchRoles, deleteRole, toggleRoleStatus } from "@/src/lib/api/roles" // /src/backend

export default function RolesManagement() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("list")
  const [selectedRole, setSelectedRole] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const data = await fetchRoles()
      setRoles(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = () => {
    setSelectedRole(null)
    setActiveTab("create")
  }

  const handleEditRole = (role) => {
    setSelectedRole(role)
    setActiveTab("edit")
  }

  const handleManagePermissions = (role) => {
    setSelectedRole(role)
    setActiveTab("permissions")
  }

  const handleDeleteClick = (role) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleToggleStatus = async (role) => {
    try {
      await toggleRoleStatus(role.idRol)

      toast({
        title: "Estado actualizado",
        description: `El rol ha sido ${role.deletedAt ? "habilitado" : "inhabilitado"} exitosamente`,
      })

      loadRoles()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteRole(roleToDelete.idRol)

      toast({
        title: "Rol eliminado",
        description: "El rol ha sido eliminado exitosamente",
      })

      loadRoles()
      setActiveTab("list")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    loadRoles()
    setActiveTab("list")
    setSelectedRole(null)
  }

  const handleCancel = () => {
    setActiveTab("list")
    setSelectedRole(null)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="list">Lista de Roles</TabsTrigger>
              <TabsTrigger value="create">Crear Rol</TabsTrigger>
              {selectedRole && <TabsTrigger value="edit">Editar Rol</TabsTrigger>}
              {selectedRole && <TabsTrigger value="permissions">Gestionar Permisos</TabsTrigger>}
            </TabsList>

            {activeTab === "list" && <Button onClick={handleCreateRole}>Nuevo Rol</Button>}
          </div>

          <TabsContent value="list" className="mt-0">
            <RolesList
              roles={roles}
              loading={loading}
              onEdit={handleEditRole}
              onDelete={handleDeleteClick}
              onToggleStatus={handleToggleStatus}
              onManagePermissions={handleManagePermissions}
            />
          </TabsContent>

          <TabsContent value="create" className="mt-0">
            <RoleForm onSuccess={handleFormSuccess} onCancel={handleCancel} />
          </TabsContent>

          <TabsContent value="edit" className="mt-0">
            {selectedRole && <RoleForm role={selectedRole} onSuccess={handleFormSuccess} onCancel={handleCancel} />}
          </TabsContent>

          <TabsContent value="permissions" className="mt-0">
            {selectedRole && (
              <PermissionAssignment role={selectedRole} onSuccess={handleFormSuccess} onCancel={handleCancel} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el rol "{roleToDelete?.nombreRol}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

