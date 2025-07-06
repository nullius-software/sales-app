'use client';

import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AverageTicketChart() {
  const data = {
    labels: ['01 Jul', '02 Jul', '03 Jul', '04 Jul', '05 Jul'],
    datasets: [
      {
        label: 'Ticket Promedio ($)',
        data: [45.6, 50.2, 48.0, 52.4, 49.8],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.4,
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
        <CardTitle>Ticket Promedio Diario</CardTitle>
      </CardHeader>
      <CardContent className='w-full h-full'>
        <Line className='w-full h-full' data={data} options={options} />
      </CardContent>
    </Card>
  );
}
