import React from 'react';
import { NodeType } from '../types';
import { Music, Activity, Hexagon, Mic2, Zap, Waves, Volume2, Radio, AudioWaveform, MoveHorizontal, Monitor, Speaker } from 'lucide-react';

const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toolsFixed = [
    { type: NodeType.MASTER, label: 'Output', icon: Speaker, color: 'text-red-400' },
    { type: NodeType.SEQUENCER, label: 'Sequencer', icon: Activity, color: 'text-yellow-400' },
    { type: NodeType.SYNTH, label: 'Synthesizer', icon: Music, color: 'text-purple-400' },
    { type: NodeType.OSCILLATOR, label: 'Oscillator', icon: Activity, color: 'text-blue-400' },
    { type: NodeType.NOISE, label: 'Noise Gen', icon: Radio, color: 'text-gray-400' },
    { type: NodeType.FILTER, label: 'Filter', icon: Hexagon, color: 'text-green-400' },
    { type: NodeType.COMPRESSOR, label: 'Compressor', icon: AudioWaveform, color: 'text-emerald-400' },
    { type: NodeType.DELAY, label: 'Delay', icon: Activity, color: 'text-orange-400' },
    { type: NodeType.REVERB, label: 'Reverb', icon: Mic2, color: 'text-indigo-400' },
    { type: NodeType.DISTORTION, label: 'Distortion', icon: Zap, color: 'text-red-500' },
    { type: NodeType.CHORUS, label: 'Chorus', icon: Waves, color: 'text-cyan-400' },
    { type: NodeType.PANNER, label: 'Panner', icon: MoveHorizontal, color: 'text-pink-400' },
    { type: NodeType.GAIN, label: 'Gain', icon: Volume2, color: 'text-green-300' },
    { type: NodeType.ANALYZER, label: 'Analyzer', icon: Monitor, color: 'text-purple-500' },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">SonicGraph</h1>
        <p className="text-xs text-gray-500 mt-1">Visual Audio Workstation</p>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Modules</h2>
        <div className="grid gap-3">
          {toolsFixed.map((tool) => (
            <div
              key={tool.type}
              className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 cursor-grab active:cursor-grabbing transition-all hover:translate-x-1"
              draggable
              onDragStart={(e) => onDragStart(e, tool.type)}
            >
              <tool.icon className={`w-5 h-5 ${tool.color}`} />
              <span className="text-sm font-medium text-gray-300">{tool.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800/50 rounded text-xs text-gray-400 leading-relaxed border border-gray-700/50">
          <p className="font-bold text-gray-300 mb-2">How to use:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Drag modules onto the canvas.</li>
            <li>Connect output (right) to input (left).</li>
            <li>Connect <strong>Sequencer</strong> to <strong>Synth</strong> to trigger notes.</li>
            <li>Connect <strong>Synth</strong> to <strong>Output</strong> to hear sound.</li>
            <li>Double-click a wire to remove connection.</li>
          </ol>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-600">
        v1.1.0 Beta
      </div>
    </div>
  );
};

export default Sidebar;