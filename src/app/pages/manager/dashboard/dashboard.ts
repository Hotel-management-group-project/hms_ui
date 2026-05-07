// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)

import { Component, inject, OnInit, OnDestroy, signal, computed, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';
import gsap from 'gsap';
import { OccupancyService } from '../../../core/services/occupancy.service';
import {
  ReportService, DashboardSummary, RevenueDataPoint, OccupancyDataPoint,
} from '../../../core/services/report.service';

Chart.register(...registerables);

@Component({
  selector: 'app-manager-dashboard',
  imports: [RouterLink, BaseChartDirective],
  templateUrl: './dashboard.html',
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  readonly occupancy = inject(OccupancyService);
  private reportService = inject(ReportService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly revenueData = signal<RevenueDataPoint[]>([]);
  readonly occupancyData = signal<OccupancyDataPoint[]>([]);
  readonly loadingKpi = signal(true);
  readonly loadingCharts = signal(true);

  // KPI computed values from monthly revenue data
  readonly monthlyRevenue = computed(() =>
    this.revenueData().reduce((sum, d) => sum + d.revenue, 0)
  );
  readonly totalBookings = computed(() =>
    this.revenueData().reduce((sum, d) => sum + d.bookingCount, 0)
  );
  readonly avgBookingValue = computed(() => {
    const b = this.totalBookings();
    return b > 0 ? Math.round(this.monthlyRevenue() / b) : 0;
  });

  // Revenue line chart (monthly data)
  readonly revenueChartData = computed<ChartData<'line'>>(() => ({
    labels: this.revenueData().map(d => d.period),
    datasets: [{
      label: 'Revenue (£)',
      data: this.revenueData().map(d => d.revenue),
      borderColor: 'rgba(212, 175, 55, 0.9)',
      backgroundColor: 'rgba(212, 175, 55, 0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgba(212, 175, 55, 0.9)',
      pointRadius: 3,
    }],
  }));

  readonly revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` £${(ctx.parsed.y ?? 0).toLocaleString()}` } },
    },
    scales: {
      x: { ticks: { color: '#d4b896aa', font: { size: 11 } }, grid: { color: '#1e2d4420' } },
      y: { ticks: { color: '#d4b896aa', callback: v => `£${v}` }, grid: { color: '#1e2d4420' } },
    },
  };

  // Occupancy bar chart (monthly)
  readonly occupancyChartData = computed<ChartData<'bar'>>(() => ({
    labels: this.occupancyData().map(d => d.period),
    datasets: [{
      label: 'Occupancy %',
      data: this.occupancyData().map(d => d.occupancyRate),
      backgroundColor: 'rgba(96, 165, 250, 0.3)',
      borderColor: 'rgba(96, 165, 250, 0.85)',
      borderWidth: 2,
      borderRadius: 4,
    }],
  }));

  readonly occupancyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}%` } },
    },
    scales: {
      x: { ticks: { color: '#d4b896aa', font: { size: 11 } }, grid: { color: '#1e2d4420' } },
      y: { ticks: { color: '#d4b896aa', callback: v => `${v}%` }, grid: { color: '#1e2d4420' }, max: 100, min: 0 },
    },
  };

  readonly navLinks = [
    { path: '/manager/reports',        label: 'Reports',        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'Occupancy, revenue & demographics' },
    { path: '/manager/room-rates',     label: 'Room Rates',     icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Edit peak & off-peak pricing' },
    { path: '/manager/staff-accounts', label: 'Staff Accounts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', desc: 'Manage FrontDesk accounts' },
    { path: '/manager/audit-logs',     label: 'Audit Logs',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', desc: 'System activity & security audit' },
  ];

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('.gsap-kpi-card', {
        y: 28,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all',
      });
      gsap.from('.gsap-nav-card', {
        y: 16,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.4,
        clearProps: 'all',
      });
    });
  }

  ngOnInit(): void {
    this.occupancy.connect();

    this.reportService.getSummary().subscribe({
      next: s => { this.summary.set(s); this.loadingKpi.set(false); },
      error: () => this.loadingKpi.set(false),
    });

    this.reportService.getRevenue('monthly').subscribe({
      next: d => { this.revenueData.set(d); this.loadingCharts.set(false); },
      error: () => this.loadingCharts.set(false),
    });

    this.reportService.getOccupancy('monthly').subscribe({
      next: d => this.occupancyData.set(d),
    });
  }

  ngOnDestroy(): void {
    this.occupancy.disconnect();
  }

  get today(): string {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
  }
}
