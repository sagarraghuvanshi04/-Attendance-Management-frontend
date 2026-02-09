// src/components/Admin/Reports.jsx
import React, { useState, useMemo, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from "recharts";
import { Download, Filter, Calendar, TrendingUp, Users, Wallet, ArrowUpRight, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/api";

const Reports = () => {
  const [timeRange, setTimeRange] = useState("Last 6 Months");
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    chartData: [],
    planData: [],
    kpis: {
      monthlyRevenue: 0,
      revenueGrowth: "+0%",
      growthRate: "0%",
      growthRateChange: "+0%",
      retention: "0%",
      retentionChange: "+0%",
    },
  });

  useEffect(() => {
    fetchReportsData();
  }, [timeRange]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/reports?timeRange=${timeRange}`);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- PDF Export Logic ---
  const handleExport = () => {
    setIsExporting(true);
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Library Performance Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${timeRange}`, 14, 28);

    autoTable(doc, {
      head: [["Period", "Revenue (INR)", "Enrolled Students"]],
      body: data.chartData.map(d => [d.month, `Rs. ${d.revenue}`, d.students]),
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    setTimeout(() => {
      doc.save(`Library_Report_${timeRange.replace(" ", "_")}.pdf`);
      setIsExporting(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Dynamic Header --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Analytics Hub</h2>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <CheckCircle size={16} className="text-emerald-500" /> System data synced 2 mins ago.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm">
          {["Last 6 Months", "Last 30 Days"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                timeRange === range ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {range}
            </button>
          ))}
          <div className="w-[1px] h-6 bg-slate-100 mx-2" />
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isExporting ? "Generating..." : <><Download size={16} /> Export PDF</>}
          </button>
        </div>
      </div>

      {/* --- KPI Summary Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Monthly Revenue" 
          value={`₹${data.kpis.monthlyRevenue.toLocaleString()}`} 
          growth={data.kpis.revenueGrowth} 
          icon={<Wallet />} 
          trend="up" 
        />
        <SummaryCard 
          title="Growth Rate" 
          value={data.kpis.growthRate} 
          growth={data.kpis.growthRateChange} 
          icon={<TrendingUp />} 
          trend="up" 
        />
        <SummaryCard 
          title="Retention" 
          value={data.kpis.retention} 
          growth={data.kpis.retentionChange} 
          icon={<Users />} 
          trend="up" 
        />
      </div>

      {/* --- Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Revenue Area Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-black text-slate-800 text-xl">Revenue Stream</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Income Over Time</p>
            </div>
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }}
                  cursor={{ stroke: '#4F46E5', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4F46E5" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollment Distribution */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 text-xl mb-2">Plan Popularity</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">User Preferences</p>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.planData} 
                  innerRadius="65%" 
                  outerRadius="85%" 
                  paddingAngle={10} 
                  dataKey="value"
                  stroke="none"
                >
                  {data.planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-6">
            {data.planData.map((item) => (
              <div key={item.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/* --- Summary Card Helper --- */
const SummaryCard = ({ title, value, growth, icon, trend }) => (
  <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden">
    <div className="flex justify-between items-start relative z-10">
      <div className="h-14 w-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 ${
          trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
        }`}>
          <ArrowUpRight size={14} /> {growth}
        </span>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">{title}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
    </div>
    <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
       {React.cloneElement(icon, { size: 100 })}
    </div>
  </div>
);

export default Reports;