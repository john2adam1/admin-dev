'use client';

import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardRes, GetDashboardReq } from '@/types';
import { StatCard, DashboardSkeleton } from '@/components/dashboard/StatCard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GetDashboardReq>({ type: 'month' });

  const loadStats = useCallback(async (params: GetDashboardReq) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getStats(params);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = useCallback((params: GetDashboardReq) => {
    setFilters(params);
    loadStats(params);
  }, [loadStats]);

  const getHelperText = useCallback(() => {
    if (filters.from === '2000-01-01' && filters.to === '2030-12-31') return 'Jami vaqt davomida';
    if (filters.type === 'day') return `Sana: ${filters.day}`;
    if (filters.type === 'range') return `Oraliq: ${filters.from} dan ${filters.to} gacha`;
    return `Yangi ma'lumotlar (${filters.day || 'joriy'})`;
  }, [filters]);

  const isEmpty = stats && Object.values(stats).every(val => val === 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Boshqaruv Paneli</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadStats(filters)}>
            Yangilash
          </Button>
        </div>
      </div>

      <DashboardFilters onFilter={handleFilterChange} initialValues={filters} />

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex justify-between items-center">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button size="sm" onClick={() => loadStats(filters)} variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10">
            Qayta urinish
          </Button>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : stats ? (
        <div className="space-y-6">
          {/* Content */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kontent</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Tariflar" value={stats.tariffs} helperText={getHelperText()} icon="💰" />
              <StatCard label="Fanlar" value={stats.subjects} helperText={getHelperText()} icon="📁" />
              <StatCard label="Kurslar" value={stats.courses} helperText={getHelperText()} icon="🎓" />
              <StatCard label="Modullar" value={stats.modules} helperText={getHelperText()} icon="📦" />
              <StatCard label="Darslar" value={stats.lessons} helperText={getHelperText()} icon="📖" />
              <StatCard label="Testlar" value={stats.tests} helperText={getHelperText()} icon="📝" />
              <StatCard label="Hujjatlar" value={stats.documents} helperText={getHelperText()} icon="📄" />
              <StatCard label="Videolar" value={stats.videos} helperText={getHelperText()} icon="🎬" />
            </div>
          </div>

          {/* Users */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Foydalanuvchilar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Foydalanuvchilar" value={stats.users} helperText={getHelperText()} icon="👥" />
              <StatCard label="Faol foydalanuvchilar" value={stats.active_users} helperText={getHelperText()} icon="✅" />
              <StatCard label="O'qituvchilar" value={stats.teachers} helperText={getHelperText()} icon="👨‍🏫" />
            </div>
          </div>

          {/* Course Permissions */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kurs Ruxsatlari</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Jami Ruxsatlar" value={stats.user_courses ?? 0} helperText={getHelperText()} icon="🔑" />
              <StatCard label="Faol Ruxsatlar" value={stats.active_user_courses ?? 0} helperText={getHelperText()} icon="🟢" />
              <StatCard label="Nofaol Ruxsatlar" value={stats.inactive_user_courses ?? 0} helperText={getHelperText()} icon="🟡" />
              <StatCard label="O'chirilgan Ruxsatlar" value={stats.deleted_user_courses ?? 0} helperText={getHelperText()} icon="🔴" />
            </div>
          </div>

          {/* Orders */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Buyurtmalar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="To'langan" value={stats.paid_orders ?? 0} helperText={getHelperText()} icon="💳" />
              <StatCard label="Admin orqali" value={stats.admin_orders ?? 0} helperText={getHelperText()} icon="🛡️" />
              <StatCard label="Click orqali" value={stats.click_orders ?? 0} helperText={getHelperText()} icon="🖱️" />
              <StatCard label="Bekor qilingan" value={stats.cancelled_orders ?? 0} helperText={getHelperText()} icon="❌" />
            </div>
          </div>

          {/* Promocodes */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Promokodlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Jami Promokodlar" value={stats.promocodes ?? 0} helperText={getHelperText()} icon="🎟️" />
              <StatCard label="Faol Promokodlar" value={stats.active_promocodes ?? 0} helperText={getHelperText()} icon="✨" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


