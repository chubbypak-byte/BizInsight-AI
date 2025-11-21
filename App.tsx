import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Bot, 
  Briefcase, 
  Database, 
  TrendingUp, 
  Target, 
  Code2, 
  Sparkles, 
  AlertCircle,
  ChevronRight,
  PieChart as IconPieChart,
  BarChart3,
  LineChart as IconLineChart,
  Loader2,
  Upload,
  FileText,
  Globe,
  FileSpreadsheet,
  MessageSquare,
  Send,
  User,
  CornerDownLeft
} from 'lucide-react';
import { WowLevel, AppState, AnalysisResult, ChatMessage } from './types';
import { analyzeData, checkApiKey, askFollowUpQuestion } from './services/gemini';

// Mock data for demo purposes
const DEMO_DATA = `Month,Sales,Cost,CustomerSatisfaction
Jan,120000,80000,4.2
Feb,150000,85000,4.5
Mar,110000,82000,4.0
Apr,180000,90000,4.8
May,200000,95000,4.7
Jun,170000,88000,4.3`;

const DEMO_JD = `รับผิดชอบการพัฒนา Web Application ดูแลระบบ Database (PostgreSQL) 
และสร้าง Internal Tools สำหรับฝ่ายขายและฝ่ายการตลาด 
มีความรู้เรื่อง Python และ Data Visualization`;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    dataInput: '',
    jdInput: '',
    wowLevel: 50,
    isLoading: false,
    result: null,
    error: null,
    hasApiKey: true,
    chatHistory: [],
    isChatLoading: false
  });

  const [chatInput, setChatInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setState(prev => ({ ...prev, hasApiKey: checkApiKey() }));
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat when history changes
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatHistory, state.isChatLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [chatInput]);

  const handleAnalyze = async () => {
    if (!state.dataInput.trim()) {
      setState(prev => ({ ...prev, error: 'กรุณาระบุข้อมูล CSV หรือข้อความอธิบายข้อมูล' }));
      return;
    }
    if (!state.jdInput.trim()) {
      setState(prev => ({ ...prev, error: 'กรุณาระบุ JD ของคุณเพื่อกำหนดขอบเขตงาน' }));
      return;
    }

    // Clear previous results and chat history when starting new analysis
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      result: null,
      chatHistory: [] 
    }));

    try {
      const result = await analyzeData(state.dataInput, state.jdInput, state.wowLevel);
      setState(prev => ({ ...prev, result, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || state.isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMessage],
      isChatLoading: true
    }));
    setChatInput('');
    
    // Reset height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
      const answer = await askFollowUpQuestion(
        userMessage.content,
        state.dataInput,
        state.jdInput,
        state.chatHistory
      );

      const botMessage: ChatMessage = {
        role: 'assistant',
        content: answer,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, botMessage],
        isChatLoading: false
      }));

    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "ขออภัย เกิดข้อผิดพลาดในการประมวลผลคำตอบ กรุณาลองใหม่อีกครั้ง",
        timestamp: Date.now()
      };
      setState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, errorMessage],
        isChatLoading: false
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const loadDemo = () => {
    setState(prev => ({
      ...prev,
      dataInput: DEMO_DATA,
      jdInput: DEMO_JD,
      error: null
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setState(prev => ({
          ...prev,
          dataInput: content,
          error: null
        }));
      }
    };
    reader.onerror = () => {
      setState(prev => ({ ...prev, error: "ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง" }));
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getWowColor = (level: number) => {
    if (level <= 20) return 'bg-gray-500';
    if (level <= 50) return 'bg-blue-500';
    if (level <= 70) return 'bg-purple-500';
    return 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500';
  };

  const renderChart = (result: AnalysisResult) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (result.chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={result.chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Legend />
            <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} name={result.chartTitle} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (result.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={result.chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 8 }} name={result.chartTitle} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={result.chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {result.chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg text-white">
              <Bot size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">BizInsight AI</h1>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            <Code2 size={16} /> Senior Full-Stack Edition
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Input Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Database size={20} className="text-primary-600" />
                ข้อมูลนำเข้า
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={loadDemo}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                >
                  ใช้ข้อมูลตัวอย่าง
                </button>
              </div>
            </div>

            {/* Import Tools */}
            <div className="flex gap-2 mb-3">
              <button 
                onClick={triggerFileUpload}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <Upload size={14} />
                อัปโหลดไฟล์ (CSV/Txt)
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.txt,.json"
                onChange={handleFileUpload}
              />
            </div>

            <div className="relative">
              <textarea
                className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all resize-none"
                placeholder="วางข้อมูลที่นี่..."
                value={state.dataInput}
                onChange={(e) => setState({ ...state, dataInput: e.target.value })}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                 <div className="group relative">
                    <div className="w-6 h-6 bg-white rounded-full shadow border border-slate-200 flex items-center justify-center cursor-help text-green-600">
                      <FileSpreadsheet size={14} />
                    </div>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-10">
                      <b>Excel:</b> Save As เป็น .CSV แล้วอัปโหลด หรือ Copy Cell มาวางได้เลย
                    </div>
                 </div>
                 <div className="group relative">
                    <div className="w-6 h-6 bg-white rounded-full shadow border border-slate-200 flex items-center justify-center cursor-help text-blue-600">
                      <Globe size={14} />
                    </div>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-10">
                      <b>Web:</b> Copy ข้อมูลตารางหรือข้อความจากหน้าเว็บ แล้วนำมาวาง (Paste)
                    </div>
                 </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">รองรับ: ข้อความดิบ, CSV, หรือ JSON</p>
          </div>

          {/* JD Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-primary-600" />
              ขอบเขตงาน (JD)
            </h2>
            <textarea
              className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all resize-none"
              placeholder="ระบุหน้าที่ของคุณ (เพื่อให้ AI แนะนำงานที่ไม่ก้าวก่ายผู้อื่น)..."
              value={state.jdInput}
              onChange={(e) => setState({ ...state, jdInput: e.target.value })}
            />
          </div>

          {/* Wow Slider */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                ระดับความว้าว
              </h2>
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getWowColor(state.wowLevel)}`}>
                {state.wowLevel}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={state.wowLevel}
              onChange={(e) => setState({ ...state, wowLevel: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Basic</span>
              <span>Standard</span>
              <span>Visionary</span>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {state.wowLevel <= 20 ? "สรุปข้อมูลพื้นฐาน เข้าใจง่าย" :
               state.wowLevel <= 50 ? "วิเคราะห์แนวโน้มและนำเสนอภาพรวม" :
               state.wowLevel <= 70 ? "พยากรณ์อนาคตและแนะนำเชิงลึก" :
               "กลยุทธ์ระดับผู้บริหาร พลิกโฉมธุรกิจ"}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={state.isLoading || !state.hasApiKey}
            className={`w-full py-4 rounded-xl text-white font-semibold shadow-md transition-all flex items-center justify-center gap-2
              ${state.isLoading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            {state.isLoading ? (
              <>
                <Loader2 className="animate-spin" /> กำลังวิเคราะห์...
              </>
            ) : (
              <>
                <Bot /> วิเคราะห์ข้อมูลด้วย AI
              </>
            )}
          </button>
          
          {!state.hasApiKey && (
             <p className="text-xs text-red-500 text-center">ไม่พบ API Key กรุณาตั้งค่าใน Environment</p>
          )}
          
          {state.error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {state.error}
            </div>
          )}

        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {state.result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Main Title Card */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-full ${getWowColor(state.wowLevel)}`}></div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{state.result.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Target size={14}/> Impact Score: {state.result.impactScore}/100</span>
                  <span className="flex items-center gap-1"><Briefcase size={14}/> Scoped to JD</span>
                </div>
              </div>

              {/* Executive Summary & Chart Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Executive Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={20} />
                    มุมมองผู้บริหาร (Executive View)
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm flex-grow">
                    {state.result.executiveSummary}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Decision Ready</span>
                  </div>
                </div>

                {/* Visualization */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    {state.result.chartType === 'pie' ? <IconPieChart className="text-purple-600" size={20} /> :
                     state.result.chartType === 'line' ? <IconLineChart className="text-purple-600" size={20} /> :
                     <BarChart3 className="text-purple-600" size={20} />}
                    การวิเคราะห์เชิงภาพ
                  </h3>
                  <div className="flex-grow flex items-center justify-center">
                    {renderChart(state.result)}
                  </div>
                </div>
              </div>

              {/* Operational Insights */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Briefcase className="text-emerald-600" size={20} />
                  สำหรับผู้ปฏิบัติงาน (Operational Actions)
                </h3>
                <div className="grid gap-3">
                  {state.result.operationalInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                      <div className="bg-emerald-100 text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-slate-700 text-sm pt-0.5">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tool Suggestions (JD Scoped) */}
              <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Code2 size={120} />
                </div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-300">
                  <Code2 size={20} />
                  Developer Action Plan (JD Specific)
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  เครื่องมือและโซลูชันที่คุณควรพัฒนาเพื่อตอบโจทย์ข้างต้น โดยไม่เกินขอบเขตงาน:
                </p>
                <div className="grid gap-4 md:grid-cols-2 relative z-10">
                  {state.result.toolSuggestions.map((tool, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors group cursor-default">
                      <div className="flex items-center gap-2 mb-2 text-blue-200 group-hover:text-white transition-colors">
                        <ChevronRight size={16} />
                        <span className="font-semibold text-sm">Recommendation {idx + 1}</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {tool}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Section */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm">AI Data Consultant</h3>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                            Online
                        </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    Context Aware
                  </span>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                  {state.chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm p-8 text-center opacity-60">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare size={24} className="text-slate-300" />
                      </div>
                      <p className="font-medium text-slate-600 mb-1">เริ่มการสนทนา</p>
                      <p className="text-xs">สอบถามเชิงลึกเกี่ยวกับข้อมูล หรือขอคำแนะนำเพิ่มเติมได้เลย</p>
                    </div>
                  ) : (
                    state.chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                        
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border
                            ${msg.role === 'user' 
                                ? 'bg-slate-800 text-white border-slate-700' 
                                : 'bg-indigo-100 text-indigo-600 border-indigo-200'
                            }`}
                        >
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>

                        {/* Bubble */}
                        <div 
                          className={`max-w-[80%] p-4 text-sm leading-relaxed shadow-sm relative
                            ${msg.role === 'user' 
                              ? 'bg-slate-800 text-white rounded-2xl rounded-tr-none' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none'
                            }`}
                        >
                          <div className="whitespace-pre-wrap font-normal">{msg.content}</div>
                          <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right text-slate-300' : 'text-left text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {state.isChatLoading && (
                    <div className="flex items-start gap-3 animate-in fade-in">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 shadow-sm">
                            <Bot size={14} />
                       </div>
                       <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 w-16 h-[46px]">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0">
                  <div className="relative bg-slate-50 rounded-xl border border-slate-200 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all shadow-sm">
                    <textarea
                      ref={textareaRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="ถามคำถามเพิ่มเติม..."
                      rows={1}
                      className="w-full px-4 py-3.5 pr-12 bg-transparent border-none rounded-xl text-sm focus:ring-0 focus:outline-none resize-none max-h-32"
                      disabled={state.isChatLoading}
                    />
                    <div className="absolute right-2 bottom-2">
                        <button
                            onClick={handleSendChat}
                            disabled={!chatInput.trim() || state.isChatLoading}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center
                                ${!chatInput.trim() || state.isChatLoading 
                                ? 'text-slate-400 bg-slate-200 cursor-not-allowed' 
                                : 'text-white bg-primary-600 hover:bg-primary-700 shadow-sm hover:scale-105 active:scale-95'}`}
                            title="Send (Enter)"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                     <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <CornerDownLeft size={10} /> 
                        <span>กด <b>Enter</b> เพื่อส่ง</span>
                     </p>
                     <p className="text-[10px] text-slate-400">
                        <b>Shift + Enter</b> เพื่อขึ้นบรรทัดใหม่
                     </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <TrendingUp size={40} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">พร้อมวิเคราะห์ข้อมูลของคุณ</h3>
              <p className="text-slate-500 max-w-md mb-6">
                รองรับข้อมูลทั้งจากการ Copy-Paste และการอัปโหลดไฟล์ CSV
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm flex items-center gap-2 text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-800">Excel</div>
                    <div className="text-xs text-slate-400">Save as .CSV</div>
                  </div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm flex items-center gap-2 text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Globe size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-800">Website</div>
                    <div className="text-xs text-slate-400">Copy & Paste</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;