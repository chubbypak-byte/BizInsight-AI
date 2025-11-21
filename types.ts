export enum WowLevel {
  BASIC = 20,
  STANDARD = 50,
  ADVANCED = 70,
  VISIONARY = 100
}

export interface ChartDataPoint {
  name: string;
  value: number;
  category?: string;
}

export interface AnalysisResult {
  title: string;
  executiveSummary: string; // For Executives (Decision making)
  operationalInsights: string[]; // For Operations (Easy to understand)
  toolSuggestions: string[]; // What to build/use
  chartData: ChartDataPoint[]; // Data for visualization
  chartType: 'bar' | 'line' | 'pie';
  chartTitle: string;
  impactScore: number; // Simulated score based on JD alignment
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppState {
  dataInput: string;
  jdInput: string;
  wowLevel: number;
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  hasApiKey: boolean;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
}