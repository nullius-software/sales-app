"use client";
import { useState } from "react";
import DailySalesChart from "./DailySalesChart";
import WeeklySalesChart from "./WeeklySalesChart";
import MonthlySalesChart from "./MonthlySalesChart";
import HistoricSalesChart from "./HistoricSalesChart";

export default function SalesRangeSelector() {
    const [range, setRange] = useState<"week"|"month"|"year"|"all">("week");

    const renderChart = () => {
        switch (range) {
            case "week": return <DailySalesChart />;
            case "month": return <WeeklySalesChart />;
            case "year": return <MonthlySalesChart />;
            case "all": return <HistoricSalesChart />;
        }
    }

    return (
        <div className="space-y-4">
            <select
                value={range}
                onChange={e => setRange(e.target.value as typeof range)}
                className="border rounded px-3 py-2"
            >
                <option value="week">Última semana</option>
                <option value="month">Últimas 4 semanas</option>
                <option value="year">Últimos 12 meses</option>
                <option value="all">Histórico completo</option>
            </select>

            {renderChart()}
        </div>
    );
}
