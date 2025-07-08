'use server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TodaySales from './metricsItems/TodaySales';
import AverageTicket from './metricsItems/AverageTicket';
import ProductsSold from './metricsItems/ProductsSold';

export default async function MetricsSummary() {
  return (
    <div className="flex *:flex-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Ventas Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <TodaySales />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ticket Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <AverageTicket />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Productos Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsSold />
        </CardContent>
      </Card>
    </div>
  );
}
