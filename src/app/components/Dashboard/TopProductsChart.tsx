'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function TopProductsChart() {
  const data = {
    labels: ['Producto A', 'Producto B', 'Producto C', 'Producto D'],
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: [120, 95, 78, 60],
        backgroundColor: '#10b981',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };


  return (
    <Card className='w-full h-full'>
      <CardHeader>
        <CardTitle>Top Productos Vendidos</CardTitle>
      </CardHeader>
      <CardContent className='w-full h-full'>
        <Bar className='w-ful h-fulll' data={data} options={options} />
      </CardContent>
    </Card>
  );
}
