"use client";

import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { OrganizationUnjoined } from "@/store/organizationStore";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export function SearchOrganization() {
  const [searchTerm, setSearchTerm] = useState("");
  const [result, setResult] = useState<OrganizationUnjoined | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchTerm) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.get<OrganizationUnjoined[]>(
        "/api/organizations",
        {
          params: {
            name: searchTerm,
            limit: 1,
          },
          withCredentials: true,
        },
      );

      const org = response.data[0] || null;
      setResult(org);
    } catch (err) {
      console.error("Error al buscar organización:", err);
      setError("Ocurrió un error al buscar.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id: number) => {
    try {
      if (!result) return;

      const user = await getCurrentUser();

      setResult({ ...result, requested: true });
      await axios.post(`/api/organizations/${id}/join`, { user_id: user?.id });
      toast.success("Solicitud enviada");
    } catch {
      toast.error("Error al solicitar unirse");
    }
  };

  return (
    <div className="space-y-4 w-full">
      <Label htmlFor="search">Buscar organización por nombre</Label>
      <div className="flex gap-2">
        <Input
          id="search"
          placeholder="Ej. Almacén Central"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{result.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Tipo de negocio:{" "}
              {result.business_type === "almacen" ? "Almacén" : "Textil"}
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => handleJoin(result.id)}
              disabled={result.requested}
            >
              {result.requested ? "Solicitud enviada" : "Unirse"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        searchTerm &&
        !loading &&
        !error && (
          <p className="text-sm text-muted-foreground mt-4">
            No se encontró ninguna organización.
          </p>
        )
      )}
    </div>
  );
}
