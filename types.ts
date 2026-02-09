export enum NodeType {
  MASTER = 'MASTER',
  OSCILLATOR = 'OSCILLATOR',
  SYNTH = 'SYNTH',
  SEQUENCER = 'SEQUENCER',
  FILTER = 'FILTER',
  DELAY = 'DELAY',
  REVERB = 'REVERB',
  DISTORTION = 'DISTORTION',
  CHORUS = 'CHORUS',
  GAIN = 'GAIN',
  NOISE = 'NOISE',
  COMPRESSOR = 'COMPRESSOR',
  PANNER = 'PANNER',
  ANALYZER = 'ANALYZER',
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  // Common properties
  label?: string;
  
  // Oscillator/Synth params
  frequency?: number;
  waveType?: 'sine' | 'square' | 'triangle' | 'sawtooth';
  detune?: number;
  gain?: number; // 0-1

  // Sequencer params
  bpm?: number;
  steps?: boolean[]; // 16 steps

  // Effect params
  wet?: number; // 0-1
  cutoff?: number; // Filter frequency
  delayTime?: number; // Delay time in seconds
  decay?: number; // Reverb decay
  
  // New Params
  distortion?: number; // 0-1
  chorusFrequency?: number;
  chorusDelay?: number;
  chorusDepth?: number;

  // New Node Params
  noiseType?: 'white' | 'pink' | 'brown';
  threshold?: number; // Compressor threshold (-100 to 0)
  ratio?: number; // Compressor ratio (1 to 20)
  attack?: number;
  release?: number;
  pan?: number; // -1 to 1

  // Master Params
  isMuted?: boolean;
}

export interface AudioNodeItem {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // 'audioOut' | 'triggerOut'
  targetHandle?: string; // 'audioIn' | 'triggerIn'
}

export interface AppState {
  nodes: AudioNodeItem[];
  connections: Connection[];
  isPlaying: boolean;
  bpm: number;
}