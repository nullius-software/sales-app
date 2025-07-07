"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useOrganizationStore } from "@/store/organizationStore";

interface JoinRequest {
  request_id: number;
  user_id: number;
  email: string;
  created_at: string;
}

export function OrganizationJoinRequests() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { currentOrganization } = useOrganizationStore();

  const fetchRequests = useCallback(
    () =>
      axios
        .get(`/api/organizations/${currentOrganization?.id}/requests`, {
          withCredentials: true,
        })
        .then((res) => setRequests(res.data))
        .catch(() => {})
        .finally(() => setLoading(false)),
    [currentOrganization],
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    requestId: number,
    action: "approved" | "rejected",
  ) => {
    try {
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      toast.success(
        `Solicitud ${action === "approved" ? "aprobada" : "rechazada"}`,
      );
      if (action === "approved") {
        await axios.patch(`/api/organizations/requests/${requestId}`);
      } else {
        await axios.delete(`/api/organizations/requests/${requestId}`);
      }
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      fetchRequests();
    }
  };

  if (loading || requests.length === 0) return <></>;

  return (
    <div className="grid gap-4 mb-12 px-4">
      <h2 className="text-lg font-semibold mb-2">Solicitudes</h2>
      {requests.map((req) => (
        <Card key={req.request_id} className="p-0">
          <CardContent className="flex items-center justify-between gap-4 p-0 py-3 px-2">
            <div className="flex justify-center">
              <p className="font-normal text-sm break-all indent-0.5">
                {req.email}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleAction(req.request_id, "approved")}
                className="w-6 h-6"
              >
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleAction(req.request_id, "rejected")}
                className="w-6 h-6"
              >
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
