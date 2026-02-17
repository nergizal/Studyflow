import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import axios from 'axios';

// Backend'den beklediğimiz veri yapısını tanımlıyoruz
interface AnalyticsData {
  categoryStats: { name: string; value: number }[];
  dailyStats: { date: string; count: number }[];
  summary: {
    totalMinutes: number;
    totalSessions: number;
    completedTasks: number;
  }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const Analytics: React.FC = () => {
  // Başlangıçta tipi AnalyticsData veya null olarak belirtiyoruz
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/analytics');
        setData(res.data);
      } catch (err) {
        console.error("Veri çekme hatası:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-10 text-center text-blue-500">Veriler hazırlanıyor...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Veri bulunamadı.</div>;

  // Güvenli değerler (eğer summary boş gelirse hata vermemesi için)
  const summary = data.summary[0] || { totalMinutes: 0, totalSessions: 0, completedTasks: 0 };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Verimlilik Analizi</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Toplam Odaklanma</p>
          <h3 className="text-2xl font-bold text-blue-600">{summary.totalMinutes} dk</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Tamamlanan Pomodoro</p>
          <h3 className="text-2xl font-bold text-green-600">{summary.totalSessions} Seans</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Focus Score</p>
          <h3 className="text-2xl font-bold text-purple-600">%{Math.min((summary.totalSessions * 5), 100)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Kategori Bazlı Dağılım</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.categoryStats || []} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {(data.categoryStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4">Çalışma Yoğunluğu</h2>
          <div className="px-4">
            <CalendarHeatmap
              startDate={new Date('2026-01-01')}
              endDate={new Date('2026-12-31')}
              values={data.dailyStats || []}
              classForValue={(value) => {
                if (!value || value.count === 0) return 'color-empty';
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;