'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { useOrganizationStore } from '@/store/organizationStore';

export default function AverageTicketChart() {
  const [ticketData, setTicketData] = useState<{ date: string; average_ticket: number }[]>([]);
  const { currentOrganization } = useOrganizationStore();

  useEffect(() => {
    async function fetchTicketData() {
      if (!currentOrganization) return;

      const endDate = new Date();

      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);

      const formatDate = (date: Date) => date.toISOString().slice(0, 10);

      try {
        const res = await axios.get('/api/sales/average-ticket', {
          params: {
            organizationId: currentOrganization.id,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          },
        });
        if (res.data.daily) {
          setTicketData(res.data.daily);
        } else {
          setTicketData([{ date: formatDate(endDate), average_ticket: res.data.total }]);
        }
      } catch (error) {
        console.error(error);
      }
    }


    fetchTicketData();
  }, [currentOrganization]);

  const data = {
    labels: ticketData.map((d) => d.date),
    datasets: [
      {
        label: 'Ticket Promedio ($)',
        data: ticketData.map((d) => d.average_ticket),
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
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
      },
    },
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Ticket Promedio Diario</CardTitle>
      </CardHeader>
      <CardContent className="w-full h-full">
        <Line className="w-full h-full" data={data} options={options} />
      </CardContent>
    </Card>
  );
}
