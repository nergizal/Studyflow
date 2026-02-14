import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Check, X, Calendar, Tag, Play, Pause, Square, Clock, ListTodo, BarChart3, LogOut, Layout, MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Task } from "./types";
import * as api from "./services/api";

const CATEGORIES = ["Genel", "Okul", "Yazılım", "Tulpar-FF", "VetApp", "Kişisel"];
const POMODORO_TIME = 25 * 60;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

  // --- HESAPLAMALAR ---
  const totalTimeSpent = useMemo(() => tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0), [tasks]);
  
  const categoryData = useMemo(() => CATEGORIES.map(cat => ({
    name: cat,
    value: tasks.filter(t => t.category === cat).reduce((sum, t) => sum + (t.timeSpent || 0), 0)
  })).filter(d => d.value > 0), [tasks]);

  const taskChartData = useMemo(() => tasks.filter(t => (t.timeSpent || 0) > 0).map(t => ({
    name: t.title.substring(0, 10),
    time: t.timeSpent
  })), [tasks]);

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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeTask = tasks.find(t => t._id === activeTaskId);

  // --- AUTH UI ---
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
            <button onClick={() => setActiveTab('tasks')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'tasks' ? 'bg-slate-100 text-blue-600' : 'text-slate-400'}`}>Board</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'analytics' ? 'bg-slate-100 text-blue-600' : 'text-slate-400'}`}>İstatistikler</button>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
      </nav>

      <main className="pt-24 px-8 h-screen overflow-hidden">
        {activeTab === 'tasks' ? (
          <div className="flex gap-6 h-full pb-10 overflow-x-auto">
            {/* Columns */}
            {[
              { t: 'Yapılacaklar', s: 'todo', i: ListTodo, c: 'bg-slate-400' },
              { t: 'Yapılıyor', s: 'doing', i: Clock, c: 'bg-blue-500' },
              { t: 'Tamamlandı', s: 'done', i: Check, c: 'bg-emerald-500' }
            ].map(col => (
              <div key={col.s} className="flex-1 min-w-[300px] bg-slate-50 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className={`p-1 rounded-md ${col.c} text-white`}><col.i size={14} /></div>
                  <h3 className="font-black text-slate-700 uppercase text-[10px] tracking-widest">{col.t}</h3>
                </div>
                <div className="flex-1 overflow-y-auto pb-4">
                  {tasks.filter(t => t.status === col.s).map(task => (
                    <div key={task._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-3 group">
                      <div className={`h-1 w-8 rounded-full mb-3 ${PRIORITY_MAP[task.priority].color}`} />
                      <h4 className={`font-bold text-sm text-slate-800 ${task.status === 'done' ? 'line-through opacity-40' : ''}`}>{task.title}</h4>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Clock size={10}/> {task.timeSpent} dk</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {task.status !== 'done' && <button onClick={() => handleStartPomodoro(task._id)} className="p-1 hover:bg-blue-50 text-blue-600 rounded-md"><Play size={12} fill="currentColor"/></button>}
                          <button onClick={() => handleDeleteTask(task._id)} className="p-1 hover:bg-red-50 text-red-500 rounded-md"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {col.s === 'todo' && (
                    <button onClick={() => setIsFormOpen(true)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 text-xs font-bold hover:border-blue-400 hover:text-blue-500 transition-all">+ Kart Ekle</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto overflow-y-auto h-full pb-20 scrollbar-hide">
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="bg-blue-50 p-8 rounded-3xl text-center border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Odaklanma Süresi</p>
                <h2 className="text-4xl font-black text-blue-700">{Math.floor(totalTimeSpent / 60)}sa {totalTimeSpent % 60}dk</h2>
              </div>
              <div className="bg-emerald-50 p-8 rounded-3xl text-center border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">Biten Kartlar</p>
                <h2 className="text-4xl font-black text-emerald-700">{tasks.filter(t => t.status === 'done').length}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
               <div className="h-64 bg-white p-6 rounded-3xl border border-slate-100">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart><Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip/><Legend/></PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="h-64 bg-white p-6 rounded-3xl border border-slate-100">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={taskChartData}><XAxis dataKey="name" tick={{fontSize: 10}}/><YAxis hide/><Tooltip/><Bar dataKey="time" fill="#3b82f6" radius={[4, 4, 0, 0]}/></BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6"><h3 className="font-black uppercase text-slate-800 italic">Yeni Kart</h3><button onClick={() => setIsFormOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input type="text" autoFocus placeholder="Başlık..." className="w-full text-lg font-bold border-none focus:ring-0" value={title} onChange={e => setTitle(e.target.value)} />
              <textarea placeholder="Açıklama..." className="w-full h-24 border-none focus:ring-0 text-slate-500 text-sm resize-none" value={description} onChange={e => setDescription(e.target.value)} />
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <select className="flex-1 bg-slate-50 border-none rounded-xl text-xs font-bold" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className="flex gap-1">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button key={p} type="button" onClick={() => setPriority(p)} className={`w-6 h-6 rounded-full ${PRIORITY_MAP[p].color} ${priority === p ? 'ring-2 ring-offset-2 ring-blue-600' : 'opacity-30'}`} />
                  ))}
                </div>
              </div>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs mt-4">Ekle</button>
            </form>
          </div>
        </div>
      )}

      {activeTaskId && activeTask && !isNoteModalOpen && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl animate-pulse"><Clock size={18}/></div>
            <h4 className="font-bold text-xs truncate max-w-[100px]">{activeTask.title}</h4>
          </div>
          <div className="text-3xl font-black font-mono italic text-blue-400">{formatTime(timeLeft)}</div>
          <div className="flex gap-1">
            <button onClick={() => setIsTimerRunning(!isTimerRunning)}>{isTimerRunning ? <Pause size={20}/> : <Play size={20}/>}</button>
            <button onClick={handleStopClicked} className="text-red-500 ml-1"><Square size={20}/></button>
          </div>
        </div>
      )}

      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden p-10 animate-in zoom-in-95">
            <div className="bg-blue-600 -mx-10 -mt-10 p-10 text-white text-center mb-8">
              <h3 className="text-2xl font-black uppercase italic">Harikasın!</h3>
              <p className="text-xs font-bold opacity-70 mt-2">{Math.floor((POMODORO_TIME - timeLeft) / 60)} dakikalık seans bitti.</p>
            </div>
            <form onSubmit={saveSessionWithNote} className="space-y-6">
              <textarea autoFocus placeholder="Neler başardın?" className="w-full border-none focus:ring-0 text-slate-700 font-medium h-24" value={sessionNote} onChange={e => setSessionNote(e.target.value)} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase text-[10px]">İptal</button>
                <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-[10px]">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;