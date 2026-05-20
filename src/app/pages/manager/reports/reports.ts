// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  ReportService, ReportPeriod,
  OccupancyDataPoint, RevenueDataPoint, DemographicItem,
} from '../../../core/services/report.service';
import { HotelService } from '../../../core/services/hotel.service';
import { Hotel } from '../../../core/models';

Chart.register(...registerables);

type Tab = 'occupancy' | 'revenue' | 'demographics';

@Component({
  selector: 'app-reports',
  imports: [FormsModule, BaseChartDirective],
  templateUrl: './reports.html',
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private hotelService = inject(HotelService);

  readonly hotels = signal<Hotel[]>([]);
  readonly activeTab = signal<Tab>('occupancy');
  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly error = signal('');

  // Filters
  selectedHotelId = '';
  selectedPeriod: ReportPeriod = 'monthly';
  dateFrom = '';
  dateTo = '';

  // Raw data
  readonly occupancyData = signal<OccupancyDataPoint[]>([]);
  readonly revenueData = signal<RevenueDataPoint[]>([]);
  readonly demographicsData = signal<DemographicItem[]>([]);

  // Chart config — occupancy
  readonly occupancyChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.occupancyData().map(d => d.period),
    datasets: [{
      label: 'Occupancy %',
      data: this.occupancyData().map(d => d.occupancyRate),
      backgroundColor: 'rgba(212, 175, 55, 0.25)',
      borderColor: 'rgba(212, 175, 55, 0.9)',
      borderWidth: 2,
      borderRadius: 4,
    }],
  }));

  readonly occupancyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#d4b896' } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}%` } },
    },
    scales: {
      x: { ticks: { color: '#d4b896aa' }, grid: { color: '#1e2d4422' } },
      y: { ticks: { color: '#d4b896aa', callback: v => `${v}%` }, grid: { color: '#1e2d4422' }, max: 100 },
    },
  };

  // Chart config — revenue
  readonly revenueChartData = computed<ChartData<'line'>>(() => ({
    labels: this.revenueData().map(d => d.period),
    datasets: [
      {
        label: 'Revenue (£)',
        data: this.revenueData().map(d => d.revenue),
        borderColor: 'rgba(74, 222, 128, 0.9)',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(74, 222, 128, 0.9)',
      },
      {
        label: 'Bookings',
        data: this.revenueData().map(d => d.bookingCount),
        borderColor: 'rgba(96, 165, 250, 0.9)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        yAxisID: 'y1',
        pointBackgroundColor: 'rgba(96, 165, 250, 0.9)',
      },
    ],
  }));

  readonly revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#d4b896' } } },
    scales: {
      x: { ticks: { color: '#d4b896aa' }, grid: { color: '#1e2d4422' } },
      y:  { ticks: { color: '#d4b896aa', callback: v => `£${v}` }, grid: { color: '#1e2d4422' } },
      y1: { position: 'right', ticks: { color: '#60a5faaa' }, grid: { drawOnChartArea: false } },
    },
  };

  // Chart config — demographics (doughnut)
  readonly demographicsChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: this.demographicsData().map(d => d.label),
    datasets: [{
      data: this.demographicsData().map(d => d.value),
      backgroundColor: [
        'rgba(212,175,55,0.8)', 'rgba(96,165,250,0.8)', 'rgba(74,222,128,0.8)',
        'rgba(251,191,36,0.8)', 'rgba(167,139,250,0.8)', 'rgba(248,113,113,0.8)',
      ],
      borderColor: '#0d1b2a',
      borderWidth: 2,
    }],
  }));

  readonly demographicsChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#d4b896', padding: 16 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} (${this.demographicsData()[ctx.dataIndex]?.percentage ?? 0}%)` } },
    },
  };

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe(h => this.hotels.set(h));
    this.loadReport();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set('');
    const tab = this.activeTab();
    const { selectedHotelId: hotel, selectedPeriod: period, dateFrom: from, dateTo: to } = this;

    if (tab === 'occupancy') {
      this.reportService.getOccupancy(period, hotel || undefined, from || undefined, to || undefined).subscribe({
        next: d => { this.occupancyData.set(d); this.loading.set(false); },
        error: () => { this.error.set('Failed to load occupancy data.'); this.loading.set(false); },
      });
    } else if (tab === 'revenue') {
      this.reportService.getRevenue(period, hotel || undefined, from || undefined, to || undefined).subscribe({
        next: d => { this.revenueData.set(d); this.loading.set(false); },
        error: () => { this.error.set('Failed to load revenue data.'); this.loading.set(false); },
      });
    } else {
      this.reportService.getDemographics(hotel || undefined).subscribe({
        next: d => { this.demographicsData.set(d); this.loading.set(false); },
        error: () => { this.error.set('Failed to load demographics data.'); this.loading.set(false); },
      });
    }
  }

  exportReport(type: 'pdf' | 'excel'): void {
    this.exporting.set(true);
    this.reportService.exportReport(type, this.selectedPeriod, this.selectedHotelId || undefined).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hms-report-${this.selectedPeriod}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  get totalRevenue(): number {
    return this.revenueData().reduce((sum, d) => sum + d.revenue, 0);
  }

  get totalBookings(): number {
    return this.revenueData().reduce((sum, d) => sum + d.bookingCount, 0);
  }

  get avgOccupancy(): number {
    const data = this.occupancyData();
    if (!data.length) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.occupancyRate, 0) / data.length);
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
  }
}
