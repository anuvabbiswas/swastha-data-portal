import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Filter, XCircle, AlertCircle, BarChart3, PieChart } from 'lucide-react';
import { 
  PieChart as RePieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// A professional color palette for the charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#ef4444'];

export default function Analytics() {
  const { token } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ totalSubmissions: 0, charts: [] });
  
  // Filter States
  const [category, setCategory] = useState('MARKETING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('ALL');

  // Fetch data whenever category or dates change
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        let url = `/api/analytics?category=${category}`;
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        
        if (res.ok) setData(result.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [category, startDate, endDate, token]);

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // Filter charts based on the Question dropdown
  const displayedCharts = selectedQuestion === 'ALL' 
    ? data.charts 
    : data.charts.filter(c => c.question === selectedQuestion);

  return (
    <div className="p-8">
      
      {/* 1. Header & Category Toggle */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
          <p className="text-slate-500 mt-1">Visualize data distributions and trends.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg shadow-inner">
          <button onClick={() => { setCategory('MARKETING'); setSelectedQuestion('ALL'); }} className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${category === 'MARKETING' ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Marketing</button>
          <button onClick={() => { setCategory('COMMUNITY'); setSelectedQuestion('ALL'); }} className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${category === 'COMMUNITY' ? 'bg-white text-brand shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Community</button>
        </div>
      </div>

      {/* 2. Control Bar (Filters & Total Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Submissions Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total {category} Forms</p>
            <h3 className="text-3xl font-bold text-slate-800">
              {loading ? '...' : data.totalSubmissions}
            </h3>
          </div>
          <div className="p-3 bg-brand/10 text-brand rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* Filters */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end md:items-center">
          
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> Date Range
            </label>
            <div className="flex items-center space-x-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
              <span className="text-slate-400 font-medium">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> Question Filter
            </label>
            <select value={selectedQuestion} onChange={(e) => setSelectedQuestion(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm truncate">
              <option value="ALL">All Available Questions</option>
              {data.charts.map(c => <option key={c.question} value={c.question}>{c.question}</option>)}
            </select>
          </div>

          {(startDate || endDate) && (
            <button onClick={clearDateFilter} className="flex items-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors justify-center whitespace-nowrap">
              <XCircle className="w-4 h-4 mr-2" /> Clear Dates
            </button>
          )}
        </div>
      </div>

      {/* 3. Charts Grid */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 font-medium">Analyzing data...</div>
      ) : data.charts.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-xl shadow-sm border border-slate-200">
          <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No analyzable questions found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {displayedCharts.map((chart, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
              
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-base font-bold text-slate-800 pr-4">{chart.question}</h3>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  {chart.type.replace('_', ' ')}
                </p>
              </div>

              <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {!chart.hasData ? (
                  // Insufficient Data Placeholder
                  <div className="text-center text-slate-400 flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Not enough data available.</p>
                  </div>
                ) : (
                  // Render Chart based on input type
                  <ResponsiveContainer width="100%" height={300}>
                    {['DROPDOWN', 'YES_NO'].includes(chart.type) ? (
                      // Single Choice -> Donut Chart
                      <RePieChart>
                        <Pie data={chart.data} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                          {chart.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => {
                                const total = chart.data.reduce((sum, item) => sum + item.value, 0);
                                const percentage = ((value / total) * 100).toFixed(0);
                                return [`${value} responses (${percentage}%)`, 'Count'];
                            }}
                        />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                      </RePieChart>
                    ) : (
                      // Multi Choice -> Horizontal Bar Chart
                      <BarChart data={chart.data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => {
                                const total = chart.data.reduce((sum, item) => sum + item.value, 0);
                                const percentage = ((value / total) * 100).toFixed(0);
                                return [`${value} selections (${percentage}%)`, 'Count'];
                            }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                           {chart.data.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}