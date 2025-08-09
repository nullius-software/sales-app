'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import axios, { AxiosResponse, isAxiosError } from "axios"
import { Organization, useOrganizationStore } from "@/store/organizationStore"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { SearchOrganization } from "@/components/shared/SearchOrganization"

export default function OrganizationsPage() {
  const [newOrgName, setNewOrgName] = useState("")
  const [businessType, setBusinessType] = useState("almacen")

  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const navigation = useRouter();

  const {
    organizations,
    setOrganizations,
    setCurrentOrganization
  } = useOrganizationStore();

  const handleCreate = async () => {
    if (!newOrgName.trim()) return toast.error("El nombre es requerido")
    try {
      setCreating(true)
      const { data } = await axios.post<{ name: string, business_type: string }, AxiosResponse<Organization>>(
        '/api/organizations',
        { name: newOrgName, business_type: businessType },
        { withCredentials: true }
      )
      toast.success("Organización creada")
      setNewOrgName("")
      setBusinessType("almacen")
      setDialogOpen(false)
      setOrganizations([...organizations, data])
      setCurrentOrganization(data)
    } catch (e) {
      if (isAxiosError(e) && e.status === 409) {
        toast.error('El nombre de la organización ya fue usado')
        return
      }
      toast.error("Error al crear organización")
    } finally {
      setCreating(false)
      navigation.push("/")
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex justify-center items-start flex-col gap-8 h-full px-8">
      <h1 className="text-2xl font-bold">Unite a una organización</h1>
      <SearchOrganization />
      <div className="flex flex-col gap-4 items-start w-full p-2 rounded-md">
        <p className="text-sm">O da el primer paso y crea tu propia organización</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button name="create-org" variant="outline">Crear organización</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva organización</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nombre de la organización</Label>
                <Input
                  id="org-name"
                  placeholder="Nombre de la organización"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de organización</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="almacen">Almacén</SelectItem>
                    <SelectItem value="textil">Textil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}