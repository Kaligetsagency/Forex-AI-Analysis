'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { useMarketStore } from '@/store/useMarketStore';
import { derivAPI } from '@/lib/deriv';
import '@/styles/style.css'; 

export default function LiveChart({ symbol = 'R_75' }: { symbol?: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<any>(null);
  const addTick = useMarketStore((state) => state.addTick);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: { background: { color: '#ffffff' }, textColor: '#333' },
      grid: { vertLines: { color: '#f0f3fa' }, horzLines: { color: '#f0f3fa' } },
      timeScale: { timeVisible: true, secondsVisible: true },
    });

    lineSeriesRef.current = chartRef.current.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
    });

    derivAPI.connect();
    derivAPI.onMessage((data) => {
      if (data.msg_type === 'tick') {
        const tickData = {
          time: data.tick.epoch,
          value: data.tick.quote,
        };
        lineSeriesRef.current.update(tickData);
        addTick({ time: tickData.time, price: tickData.value });
      }
    });

    derivAPI.subscribeTicks(symbol);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
    };
  }, [symbol]);

  return (
    <div className="chart-wrapper">
      <div ref={chartContainerRef} className="live-chart-container" />
    </div>
  );
}
