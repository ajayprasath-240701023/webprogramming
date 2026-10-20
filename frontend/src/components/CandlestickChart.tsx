import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { getHistory } from '../api';
import { formatINR } from '../lib/utils';
import { BarChart3, RefreshCw } from 'lucide-react';

interface CandlestickChartProps {
  symbol: string;
  height?: number;
}

export default function CandlestickChart({ symbol, height = 400 }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [interval, setInterval] = useState<'1D' | '1H' | '15m'>('1D');
  const [loading, setLoading] = useState(false);
  const [currentInfo, setCurrentInfo] = useState<{
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    time?: string;
  }>({});

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0D111B' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: {
          color: 'rgba(59, 130, 246, 0.5)',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: 'rgba(59, 130, 246, 0.5)',
          width: 1,
          style: 3,
        },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1E293B',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        return;
      }
      const data = param.seriesData.get(candleSeries) as any;
      if (data) {
        setCurrentInfo({
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          time: typeof param.time === 'string' ? param.time : undefined,
        });
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // Fetch candle data
  useEffect(() => {
    let active = true;
    const loadCandles = async () => {
      setLoading(true);
      try {
        const historyData = await getHistory(symbol, interval, 120);
        if (active && candleSeriesRef.current && volumeSeriesRef.current) {
          const formattedCandles = historyData.map((d: any) => ({
            time: d.date || d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }));

          const formattedVolumes = historyData.map((d: any) => ({
            time: d.date || d.time,
            value: d.volume || 10000,
            color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
          }));

          candleSeriesRef.current.setData(formattedCandles);
          volumeSeriesRef.current.setData(formattedVolumes);

          if (formattedCandles.length > 0) {
            const last = formattedCandles[formattedCandles.length - 1];
            setCurrentInfo({
              open: last.open,
              high: last.high,
              low: last.low,
              close: last.close,
              time: last.time,
            });
          }

          chartRef.current?.timeScale().fitContent();
        }
      } catch (e) {
        console.error('Error fetching candles:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCandles();
    return () => {
      active = false;
    };
  }, [symbol, interval]);

  return (
    <div className="bg-tp-card border border-tp-border rounded-xl p-4 flex flex-col relative">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-tp-border mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-tp-accent" />
          <span className="font-bold text-sm text-tp-text">{symbol} • Technical Chart</span>
          <span className="text-[10px] bg-tp-bg text-tp-text-muted px-2 py-0.5 rounded border border-tp-border uppercase">
            Simulated Candlesticks
          </span>
        </div>

        {/* Intervals */}
        <div className="flex items-center gap-1 bg-tp-bg p-1 rounded-lg border border-tp-border">
          {(['15m', '1H', '1D'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setInterval(t)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                interval === t
                  ? 'bg-tp-accent text-white shadow-sm'
                  : 'text-tp-text-muted hover:text-tp-text'
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setInterval((prev) => (prev === '1D' ? '1H' : '1D'))}
            className="p-1 text-tp-text-muted hover:text-tp-text rounded"
            title="Refresh feed"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* OHLC floating ticker stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-tp-text-muted pb-2">
        {currentInfo.open !== undefined && (
          <>
            <div>O: <span className="text-tp-text font-bold">{formatINR(currentInfo.open, 2)}</span></div>
            <div>H: <span className="text-emerald-400 font-bold">{formatINR(currentInfo.high || 0, 2)}</span></div>
            <div>L: <span className="text-rose-400 font-bold">{formatINR(currentInfo.low || 0, 2)}</span></div>
            <div>C: <span className="text-tp-text font-bold">{formatINR(currentInfo.close || 0, 2)}</span></div>
            {currentInfo.time && <div className="text-[11px] text-tp-text-muted font-sans">Date: {currentInfo.time}</div>}
          </>
        )}
      </div>

      {/* Chart container */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        {loading && (
          <div className="absolute inset-0 bg-tp-card/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <RefreshCw size={24} className="text-tp-accent animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
