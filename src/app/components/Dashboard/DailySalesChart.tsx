'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function DailySalesChart() {
  const data = {
    labels: ['01 Jul', '02 Jul', '03 Jul', '04 Jul', '05 Jul'],
    datasets: [
      {
        label: 'Ventas ($)',
        data: [320, 540, 390, 610, 470],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    indexAxis: 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Card className='w-full h-full'>
      <CardHeader>
        <CardTitle>Ventas Diarias</CardTitle>
      </CardHeader>
      <CardContent className='w-full h-full'>
        <Line className='w-full h-full' data={data} options={options} />
      </CardContent>
    </Card>
  );
}