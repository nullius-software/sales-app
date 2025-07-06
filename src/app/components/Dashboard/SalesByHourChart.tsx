// components/dashboard/charts/SalesByHourChart.tsx
'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SalesByHourChart() {
  const data = {
    labels: ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM'],
    datasets: [
      {
        label: 'Ventas ($)',
        data: [120, 200, 150, 300, 250, 180],
        backgroundColor: '#6366f1',
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Card className='w-full h-full'>
      <CardHeader>
        <CardTitle>Ventas por Hora</CardTitle>
      </CardHeader>
      <CardContent className='h-full'>
        <Bar className='h-full' data={data} options={options} />
      </CardContent>
    </Card>
  );
}
