import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Check, X, Calendar, Tag, Play, Pause, Square, Clock, ListTodo, BarChart3, LogOut, Layout, MoreHorizontal, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import type { Task } from "./types";
import * as api from "./services/api";


// Kategoriler: Görevleri gruplandırmak için
const CATEGORIES = ["Genel", "Okul", "Yazılım", "Tulpar-FF", "VetApp", "Kişisel"];
// Pomodoro Süresi: 25 dakika * 60 saniye (Saniye cinsinden tutmak hesaplamayı kolaylaştırır)
const POMODORO_TIME = 25 * 60;
// Renk Paleti: Grafiklerde (Recharts) kullanılacak profesyonel renkler
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
// Öncelik Haritası: 'high', 'medium', 'low' değerlerini etiketlere ve renklere dönüştürür
const PRIORITY_MAP = {
  high: { label: "Yüksek", color: "bg-red-500" },
  medium: { label: "Orta", color: "bg-amber-500" },
  low: { label: "Düşük", color: "bg-emerald-500" }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'analytics'>('tasks');

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Genel");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>("medium");
  const [estPomodoros, setEstPomodoros] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [sessionNote, setSessionNote] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  

  // --- GELİŞMİŞ ANALİZ HESAPLAMALARI ---
  const totalTimeSpent = useMemo(() => tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0), [tasks]);
  
  const categoryData = useMemo(() => CATEGORIES.map(cat => ({
    name: cat,
    value: tasks.filter(t => t.category === cat).reduce((sum, t) => sum + (t.timeSpent || 0), 0)
  })).filter(d => d.value > 0), [tasks]);

  const taskChartData = useMemo(() => tasks.filter(t => (t.timeSpent || 0) > 0).map(t => ({
    name: t.title.substring(0, 10),
    time: t.timeSpent
  })), [tasks]);

  const dailyStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    tasks.filter(t => t.status === 'done').forEach(t => {
      const date = t.updatedAt ? new Date(t.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.keys(counts).map(date => ({ date, count: counts[date] }));
  }, [tasks]);

  const focusScore = useMemo(() => {
    const completedTasksCount = tasks.filter(t => t.status === 'done').length;
    const score = (completedTasksCount * 8) + (totalTimeSpent / 20);
    return Math.min(Math.round(score), 100);
  }, [tasks, totalTimeSpent]);

  useEffect(() => {
    const token = localStorage.getItem("studyflow_token");
    if (token) {
      setIsAuthenticated(true);
      fetchTasks();
    } else { setLoading(false); }
  }, []);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      handleStopClicked();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const fetchTasks = async () => {
    setLoading(true);
    try { const data = await api.getTasks(); setTasks(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLoginMode) {
        const data = await api.login({ email: authForm.email, password: authForm.password });
        localStorage.setItem("studyflow_token", data.token);
        setIsAuthenticated(true);
        fetchTasks();
      } else {
        await api.register(authForm);
        setIsLoginMode(true);
        setAuthError("Kayıt başarılı! Giriş yapabilirsiniz.");
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || "Hata oluştu.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studyflow_token");
    setIsAuthenticated(false);
    setTasks([]);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const newTask = await api.createTask({
        title, description, category, priority, estimated_pomodoros: estPomodoros,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      setTasks([...tasks, newTask]);
      setTitle(""); setDescription(""); setIsFormOpen(false);
    } catch (error) { console.error(error); }
  };

  const updateTaskStatus = async (id: string, newStatus: 'todo' | 'doing' | 'done') => {
    try {
      const updatedTask = await api.updateTask(id, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === id ? updatedTask : t)));
    } catch (error) { console.error(error); }
  };

  const handleDeleteTask = async (id: string) => {
    try { await api.deleteTask(id); setTasks(tasks.filter((t) => t._id !== id)); }
    catch (error) { console.error(error); }
  };

  const handleStartPomodoro = (id: string) => {
    setActiveTaskId(id);
    setTimeLeft(POMODORO_TIME);
    setIsTimerRunning(true);
    setSessionStartTime(new Date());
    updateTaskStatus(id, 'doing');
  };

  const handleStopClicked = () => {
    setIsTimerRunning(false);
    setIsNoteModalOpen(true);
  };

  const saveSessionWithNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const elapsedMinutes = Math.floor((POMODORO_TIME - timeLeft) / 60);
    try {
      await api.completeSession({
        taskId: activeTaskId,
        duration: elapsedMinutes,
        note: sessionNote,
        startedAt: sessionStartTime,
        endedAt: new Date()
      });
      setIsNoteModalOpen(false); setSessionNote("");
      setActiveTaskId(null); setTimeLeft(POMODORO_TIME);
      fetchTasks();
    } catch (error) { console.error(error); }
  };

  const [isAIThinking, setIsAIThinking] = useState(false);

const handleAIBreakdown = async () => {
  if (!title) return alert("Önce bir başlık yazmalısın!");
  setIsAIThinking(true);
  try {
    // Backend'e gidip AI'dan cevap alan fonksiyonu çağırıyoruz
    const data: any = await api.breakdownTaskWithAI(title); 
    
    // AI'dan gelen array'i (subtasks) liste haline getiriyoruz
    const aiText = (data.subtasks || []).map((s: string) => `• ${s}`).join("\n");
    
    // Mevcut açıklamayı temizleyip AI önerilerini ekliyoruz
    setDescription(aiText); 
    
  } catch (error) {
    console.error("AI Hatası:", error);
    alert("Yapay zeka şu an yanıt veremiyor, backend bağlantısını kontrol et.");
  } finally {
    setIsAIThinking(false);
  }
};

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeTask = tasks.find(t => t._id === activeTaskId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-blue-600 p-8 text-center text-white font-black italic text-3xl">STUDYFLOW 🚀</div>
          <div className="p-8">
            <h2 className="text-xl font-bold mb-6 text-center">{isLoginMode ? "Giriş Yap" : "Kayıt Ol"}</h2>
            {authError && <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-xs">{authError}</div>}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLoginMode && (
                <input type="text" placeholder="Ad Soyad" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl" onChange={e => setAuthForm({...authForm, name: e.target.value})} />
              )}
              <input type="email" placeholder="E-posta" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl" onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              <input type="password" placeholder="Şifre" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl" onChange={e => setAuthForm({...authForm, password: e.target.value})} />
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Devam Et</button>
            </form>
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="w-full mt-4 text-xs text-slate-400 font-bold">{isLoginMode ? "Hesap Oluştur" : "Giriş Yap"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded-lg text-white"><Layout size={18} /></div>
            <span className="font-black text-lg tracking-tighter uppercase italic text-blue-600">StudyFlow</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('tasks')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>Board</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>İstatistikler</button>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
      </nav>

      <main className="pt-24 px-8 h-screen overflow-hidden">
        {activeTab === 'tasks' ? (
          <div className="flex gap-6 h-full pb-10 overflow-x-auto">
            {[
              { t: 'Yapılacaklar', s: 'todo', i: ListTodo, c: 'bg-slate-400' },
              { t: 'Yapılıyor', s: 'doing', i: Clock, c: 'bg-blue-500' },
              { t: 'Tamamlandı', s: 'done', i: Check, c: 'bg-emerald-500' }
            ].map(col => (
              <div key={col.s} className="flex-1 min-w-[320px] bg-slate-50/50 rounded-3xl p-5 flex flex-col border border-slate-100">
                <div className="flex items-center gap-2 mb-5 px-1">
                  <div className={`p-1.5 rounded-lg ${col.c} text-white shadow-sm`}><col.i size={14} /></div>
                  <h3 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">{col.t}</h3>
                  <span className="ml-auto text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">{tasks.filter(t => t.status === col.s).length}</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {tasks.filter(t => t.status === col.s).map(task => (
                    <div key={task._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 group hover:border-blue-300 transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                         <div className={`h-1.5 w-10 rounded-full ${PRIORITY_MAP[task.priority].color}`} />
                         <span className="text-[9px] font-black uppercase text-slate-300 tracking-tighter">{task.category}</span>
                      </div>
                      <h4 className={`font-bold text-sm text-slate-800 leading-snug ${task.status === 'done' ? 'line-through opacity-40' : ''}`}>{task.title}</h4>
                      <div className="flex justify-between items-center mt-5">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {task.timeSpent || 0}dk</span>
                           {task.estimated_pomodoros && <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">🍅 {task.estimated_pomodoros}</span>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {task.status !== 'done' && <button onClick={() => handleStartPomodoro(task._id)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Play size={14} fill="currentColor"/></button>}
                          <button onClick={() => handleDeleteTask(task._id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {col.s === 'todo' && (
                    <button onClick={() => setIsFormOpen(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300 text-[10px] font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all">＋ Yeni Görev Ekle</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto overflow-y-auto h-full pb-24 scrollbar-hide">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-blue-600 p-8 rounded-[32px] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black opacity-60 uppercase mb-2">Toplam Odaklanma</p>
                    <h2 className="text-4xl font-black italic">{Math.floor(totalTimeSpent / 60)}<span className="text-sm ml-1 opacity-60">sa</span> {totalTimeSpent % 60}<span className="text-sm ml-1 opacity-60">dk</span></h2>
                 </div>
                 <BarChart3 className="absolute -bottom-4 -right-4 text-white opacity-10" size={120} />
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Tamamlanan Görevler</p>
                <h2 className="text-4xl font-black text-slate-800">{tasks.filter(t => t.status === 'done').length}</h2>
                <div className="mt-4 flex justify-center"><div className="h-1 w-12 bg-emerald-500 rounded-full"/></div>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Focus Score</p>
                <h2 className="text-4xl font-black text-purple-600">%{focusScore}</h2>
                <div className="mt-4 flex justify-center"><div className="h-1 w-12 bg-purple-600 rounded-full"/></div>
              </div>
            </div>

            {/* Isı Haritası */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm mb-10">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xs font-black uppercase text-slate-800 italic flex items-center gap-2">
                    <Calendar size={14} className="text-blue-600"/> Çalışma Yoğunluğu
                 </h3>
                 <span className="text-[10px] font-bold text-slate-400">2026 Yılı Aktivite</span>
              </div>
              <div className="heatmap-container px-2">
                <CalendarHeatmap
                  startDate={new Date('2026-01-01')}
                  endDate={new Date('2026-12-31')}
                  values={dailyStats}
                  classForValue={(value) => {
                    if (!value || value.count === 0) return 'color-empty';
                    return `color-scale-${Math.min(value.count, 4)}`;
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* Kategori Dağılımı */}
               <div className="h-80 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Kategori Analizi</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie 
  data={categoryData} 
  innerRadius={60} 
  outerRadius={80} 
  paddingAngle={8} // Dilimler arası boşluk bırakarak modern bir görünüm sağlar
  dataKey="value"
>
  {categoryData.map((_, i) => (
    <Cell 
       key={i} 
       fill={COLORS[i % COLORS.length]} 
       stroke="none" // Kenar çizgilerini kaldırarak daha yumuşak bir geçiş sağlar
    />
  ))}
</Pie>
                     <Tooltip />
                     <Legend iconType="circle" />
                   </PieChart>
                 </ResponsiveContainer>
               </div>

               {/* Bar Chart */}
               <div className="h-80 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">En Çok Zaman Harcananlar</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={taskChartData}>
                     <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} axisLine={false} tickLine={false}/>
                     <YAxis hide />
                     <Tooltip cursor={{fill: '#f8fafc'}} />
                     <Bar dataKey="time" fill="#3b82f6" radius={[10, 10, 10, 10]} barSize={24} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALLAR (Eski koddaki ile aynı) */}
      {/* MODAL: Yeni Kart Oluştur */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-10 animate-in zoom-in-95">
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black uppercase text-slate-800 italic">Yeni Kart Oluştur</h3>
              <button onClick={() => setIsFormOpen(false)} className="bg-slate-50 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-5">
              {/* Başlık */}
              <input 
                type="text" 
                autoFocus 
                placeholder="Neye odaklanacaksın?" 
                className="w-full text-xl font-bold border-none focus:ring-0 placeholder:text-slate-200" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
              />

              {/* AI Butonu ve Açıklama Alanı */}
              <div className="mt-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Görev Detayları
                  </label>
                  <button 
                    type="button" 
                    onClick={handleAIBreakdown}
                    disabled={isAIThinking}
                    className={`text-[10px] font-bold flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                      isAIThinking 
                        ? 'bg-slate-100 text-slate-400' 
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                    }`}
                  >
                    <Sparkles size={12} className={isAIThinking ? 'animate-spin' : ''} />
                    {isAIThinking ? "Analiz Ediliyor..." : "AI ile Parçala"}
                  </button>
                </div>
                <textarea 
                  placeholder="Detaylar veya AI'nın oluşturacağı alt adımlar..." 
                  className="w-full h-32 border-none bg-slate-50 rounded-2xl p-4 focus:ring-2 focus:ring-blue-100 text-slate-600 text-sm resize-none" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>

              {/* Kategori ve Öncelik */}
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <select 
                  className="flex-1 bg-slate-50 border-none rounded-2xl text-xs font-bold px-4" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button 
                      key={p} 
                      type="button" 
                      onClick={() => setPriority(p)} 
                      className={`w-8 h-8 rounded-full ${PRIORITY_MAP[p].color} transition-all ${
                        priority === p ? 'ring-4 ring-blue-100 scale-110' : 'opacity-20 hover:opacity-40'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <button className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs mt-6 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                Kartı Ekle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Timer ve Note Modalları (Aynı Yapı) */}
      {activeTaskId && activeTask && !isNoteModalOpen && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm bg-slate-900 text-white p-5 rounded-[32px] shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-10 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl animate-pulse shadow-lg shadow-blue-500/40"><Clock size={20}/></div>
            <div>
               <h4 className="font-bold text-[11px] truncate max-w-[120px] leading-tight">{activeTask.title}</h4>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{activeTask.category}</p>
            </div>
          </div>
          <div className="text-3xl font-black font-mono italic text-blue-400 tracking-tighter">{formatTime(timeLeft)}</div>
          <div className="flex gap-2 ml-2">
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-2 hover:bg-white/10 rounded-full transition-colors">{isTimerRunning ? <Pause size={20} fill="white"/> : <Play size={20} fill="white"/>}</button>
            <button onClick={handleStopClicked} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"><Square size={20} fill="currentColor"/></button>
          </div>
        </div>
      )}

      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden p-12 animate-in zoom-in-95">
            <div className="bg-blue-600 -mx-12 -mt-12 p-12 text-white text-center mb-10 shadow-lg">
              <div className="inline-block p-4 bg-white/20 rounded-full mb-4">🏆</div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Mükemmel!</h3>
              <p className="text-xs font-bold opacity-80 mt-2 tracking-widest uppercase">{Math.floor((POMODORO_TIME - timeLeft) / 60)} dakikalık seans tamamlandı.</p>
            </div>
            <form onSubmit={saveSessionWithNote} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-300 ml-1 tracking-widest">Seans Notu</label>
                <textarea autoFocus placeholder="Bu seansta neler yaptın?" className="w-full border-none bg-slate-50 rounded-2xl p-4 text-slate-700 font-medium h-28 focus:ring-2 focus:ring-blue-100" value={sessionNote} onChange={e => setSessionNote(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase text-[10px] tracking-widest">Kapat</button>
                <button className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100">Veriyi Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;