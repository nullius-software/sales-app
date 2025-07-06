'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MetricsSummary() {
  return (
    <div className="flex *:flex-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Ventas Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">$1,240</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ticket Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">$49.60</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Productos Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">265</p>
        </CardContent>
      </Card>
    </div>
  );
}
