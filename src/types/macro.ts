export type ScriptLanguage = 'cpp' | 'luau' | 'quickjs' | 'js' | 'kt';

export interface PipelineStep {
  id: string;
  stepNumber: number;
  language: ScriptLanguage;
  code: string;
  targetDesc: string;
  enabled: boolean;
}

export interface MacroConfig {
  id: string;
  name: string;
  description: string;
  engine: string;
  soruCoords: { x: number; y: number };
  portalCoords: { x: number; y: number };
  soruColor: string;
  portalColor: string;
  code: string;
  category?: 'bloxfruits' | 'combat' | 'farming';
}

export type LogLevel = 'INFO' | 'SUCCESS' | 'GESTURE' | 'SHARED_STATE' | 'WARN' | 'ERROR';

export interface TerminalLog {
  id: string;
  timestampOffset: number; // e.g. +22.5ms
  level: LogLevel;
  message: string;
  engine?: string;
}

export interface SpeedSettings {
  triggerDelayMs: number;
  randomDelayMode: boolean; // ±20% jitter
  executionSpeedMs: number; // overall delay between macros in ms (e.g. 5 ms, 10 ms)
  smartLoop: boolean; // pause on manual touch
}

export interface SharedStateData {
  [key: string]: string | number | boolean | null;
}

export interface AndroidCodeFile {
  path: string;
  title: string;
  module: 'app' | 'engine' | 'automator' | 'plugins' | 'root';
  language: 'kotlin' | 'cpp' | 'xml' | 'groovy' | 'cmake';
  content: string;
  description: string;
}

export interface ImageResolution {
  width: number;
  height: number;
  aspectRatio: string;
  name: string;
}

export interface ScreenCalibration {
  width: number;
  height: number;
  dpi: number;
  deviceName: string;
  isCalibrated: boolean;
  scaleFactor?: number;
}

export interface BlockLatencyMetric {
  name: string;
  lang: ScriptLanguage;
  latencyMs: number;
  cpuPercent: number;
  status: 'passed' | 'warning' | 'timeout';
}

export interface PerformanceMetricsData {
  totalExecutions: number;
  successfulCombos: number;
  missedPixels: number;
  timeouts: number;
  successRate: number;
  avgLatencyMs: number;
  cpuUsagePercent: number;
  memoryUsageMb: number;
  blockMetrics: BlockLatencyMetric[];
  timelineHistory: Array<{
    timestamp: string;
    cpu: number;
    memMb: number;
    latencyMs: number;
    fps: number;
  }>;
}

// JSON Export / Import Schemas
export interface ExportedMacroFile {
  version: '1.0';
  type: 'single_macro';
  exportedAt: string;
  macro: MacroConfig;
}

export interface ExportedPipelineFile {
  version: '1.0';
  type: 'pipeline';
  name?: string;
  description?: string;
  exportedAt: string;
  speedSettings?: SpeedSettings;
  sharedState?: SharedStateData;
  steps: PipelineStep[];
}

export interface ExportedSuiteFile {
  version: '1.0';
  type: 'macro_suite';
  name?: string;
  exportedAt: string;
  speedSettings: SpeedSettings;
  configs: MacroConfig[];
  pipelineSteps: PipelineStep[];
  sharedState: SharedStateData;
  singleEngineCode?: string;
  selectedSingleEngine?: ScriptLanguage;
}

export type MacroExportPackage = ExportedMacroFile | ExportedPipelineFile | ExportedSuiteFile;

export type ExportFormat = 'json' | 'cpp' | 'luau' | 'quickjs' | 'js' | 'kt';

export interface LanguageFileDefinition {
  format: ExportFormat;
  label: string;
  extension: string;
  mimeType: string;
  badgeColor: string;
  syntaxDesc: string;
}

export interface UniversalImportResult {
  isValid: boolean;
  format: ExportFormat;
  title: string;
  description: string;
  code: string;
  detectedLanguage?: ScriptLanguage;
  packageType?: 'single_macro' | 'pipeline' | 'macro_suite' | 'raw_script';
  itemCount: number;
  languages?: string[];
  parsedPackage?: MacroExportPackage;
  error?: string;
}
