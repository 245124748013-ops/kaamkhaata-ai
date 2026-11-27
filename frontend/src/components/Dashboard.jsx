import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Calendar, Users, Briefcase, ChevronRight } from 'lucide-react';
import { getDashboardStats, getChartData } from '../api';
import { useLang } from '../context/LangContext';
import { getTranslation } from '../translations';

const StatCard = ({ label, value, icon: Icon, gradient, change }) => (
  <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p className="stat-label" style={{ marginBottom: '8px' }}>{label}</p>
        <p className="stat-value">₹{Number(value).toLocaleString('en-IN')}</p>
      </div>
      <div className="stat-icon" style={{ background: gradient + '20' }}>
        <Icon size={22} style={{ color: gradient.split(' ')[0].replace('linear-gradient(135deg, ', '') }} />
      </div>
    </div>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
      background: gradient, borderRadius: '0 0 16px 16px'
    }} />
  </div>
);

const StatusBadge = ({ status }) => {
  const cls = { paid: 'badge-paid', pending: 'badge-pending', partial: 'badge-partial' }[status] || 'badge-pending';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default function Dashboard() {
  const { lang } = useLang();
  const t = (p) => getTranslation(lang, p);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([getDashboardStats(), getChartData(year)])
      .then(([statsRes, chartRes]) => {
        setStats(statsRes.data);
        const months = t('months');
        setChartData(chartRes.data.map(d => ({
          month: months[d.month - 1],
          [t('dashboard.totalEarned')]: d.earned,
          [t('dashboard.totalReceived')]: d.received,
        })));
      })
      .finally(() => setLoading(false));
  }, [lang]);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" /></div>;
  if (!stats) return <div>Error loading stats</div>;

  const statCards = [
    { key: 'totalEarned', value: stats.total_earned, icon: IndianRupee, gradient: 'linear-gradient(135deg, #3d35ca, #6165f1)' },
    { key: 'totalReceived', value: stats.total_received, icon: TrendingUp, gradient: 'linear-gradient(135deg, #0d9488, #2dd4bf)' },
    { key: 'totalPending', value: stats.total_pending, icon: TrendingDown, gradient: 'linear-gradient(135deg, #ea580c, #fb923c)' },
    { key: 'totalAdvances', value: stats.total_advances, icon: Briefcase, gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #3d35ca 60%, #0d9488 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '28px', color: 'white',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
            {t('appName')} 🙏
          </h1>
          <p style={{ opacity: 0.8, fontSize: '15px' }}>{t('tagline')}</p>
          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ opacity: 0.6, fontSize: '12px' }}>{t('dashboard.workingDays')}</p>
              <p style={{ fontSize: '24px', fontWeight: 800 }}>{stats.working_days}</p>
            </div>
            <div>
              <p style={{ opacity: 0.6, fontSize: '12px' }}>{t('dashboard.employers')}</p>
              <p style={{ fontSize: '24px', fontWeight: 800 }}>{stats.employer_count}</p>
            </div>
            <div>
              <p style={{ opacity: 0.6, fontSize: '12px' }}>{t('dashboard.thisMonth')}</p>
              <p style={{ fontSize: '24px', fontWeight: 800 }}>₹{Number(stats.this_month_earned).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 150, height: 150, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {statCards.map(({ key, value, icon, gradient }) => (
          <StatCard key={key} label={t(`dashboard.${key}`)} value={value} icon={icon} gradient={gradient} />
        ))}
      </div>

      <div className="grid-2">
        {/* Chart */}
        <div className="card" style={{ padding: '24px', marginBottom: '0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: '#1e1b4b' }}>
            {t('dashboard.monthlyChart')}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey={t('dashboard.totalEarned')} fill="#6165f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t('dashboard.totalReceived')} fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent entries */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>{t('dashboard.recentWork')}</h3>
          </div>
          {stats.recent_entries?.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No work entries yet</h3>
              <p>Your recent work will appear here</p>
            </div>
          ) : (
            <div>
              {stats.recent_entries?.map(entry => (
                <div key={entry.id} style={{
                  padding: '14px 24px', borderBottom: '1px solid #f8fafc',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{entry.work_description}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {entry.employer?.name || 'N/A'} • {entry.work_date}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '15px' }}>₹{entry.total_earned?.toLocaleString('en-IN')}</p>
                    <StatusBadge status={entry.payment_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
