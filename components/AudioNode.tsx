import React, { useEffect, useRef } from 'react';
import { AudioNodeItem, NodeType } from '../types';
import { Settings, PlayCircle, Music, Activity, Speaker, Mic2, Hexagon, X, Zap, Waves, Volume2, MoveHorizontal, Radio, AudioWaveform, VolumeX, Volume1, Monitor } from 'lucide-react';
import { AudioEngine } from '../services/AudioEngine';

interface AudioNodeProps {
  node: AudioNodeItem;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onDelete: (id: string) => void;
  onUpdateData: (id: string, data: any) => void;
  onStartConnection: (id: string, isInput: boolean, e: React.MouseEvent) => void;
  onEndConnection: (id: string, isInput: boolean) => void;
}

const AudioNode: React.FC<AudioNodeProps> = ({ 
  node, 
  isSelected, 
  onMouseDown, 
  onDelete, 
  onUpdateData, 
  onStartConnection,
  onEndConnection
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if ((node.type === NodeType.MASTER || node.type === NodeType.ANALYZER) && canvasRef.current) {
        let frameId: number;
        const ctx = canvasRef.current.getContext('2d');
        
        const draw = () => {
            if (!ctx) return;
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            
            const values = AudioEngine.getNodeWaveform(node.id);
            
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#111827'; 
            ctx.fillRect(0, 0, width, height);
            
            if (values) {
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = node.type === NodeType.MASTER ? '#06b6d4' : '#a855f7'; 

                const sliceWidth = width / values.length;
                let x = 0;

                for (let i = 0; i < values.length; i++) {
                    const v = values[i]; 
                    const y = (1 - v) * height / 2; 

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }

                ctx.lineTo(width, height / 2);
                ctx.stroke();
            }

            frameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(frameId);
    }
  }, [node.type, node.id]);
  
  const handleDataChange = (key: string, value: any) => {
    onUpdateData(node.id, { ...node.data, [key]: value });
  };

  const getIcon = () => {
    switch(node.type) {
      case NodeType.MASTER: return <Speaker className="w-5 h-5 text-red-400" />;
      case NodeType.SEQUENCER: return <Activity className="w-5 h-5 text-yellow-400" />;
      case NodeType.SYNTH: return <Music className="w-5 h-5 text-purple-400" />;
      case NodeType.OSCILLATOR: return <Activity className="w-5 h-5 text-blue-400" />;
      case NodeType.FILTER: return <Hexagon className="w-5 h-5 text-green-400" />;
      case NodeType.DELAY: return <Activity className="w-5 h-5 text-orange-400" />;
      case NodeType.REVERB: return <Mic2 className="w-5 h-5 text-indigo-400" />;
      case NodeType.DISTORTION: return <Zap className="w-5 h-5 text-red-500" />;
      case NodeType.CHORUS: return <Waves className="w-5 h-5 text-cyan-400" />;
      case NodeType.GAIN: return <Volume2 className="w-5 h-5 text-green-300" />;
      case NodeType.NOISE: return <Radio className="w-5 h-5 text-gray-400" />;
      case NodeType.COMPRESSOR: return <AudioWaveform className="w-5 h-5 text-emerald-400" />;
      case NodeType.PANNER: return <MoveHorizontal className="w-5 h-5 text-pink-400" />;
      case NodeType.ANALYZER: return <Monitor className="w-5 h-5 text-purple-500" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div
      className={`absolute flex flex-col bg-gray-850 rounded-lg border-2 node-shadow transition-colors duration-200 select-none ${isSelected ? 'border-accent-cyan z-20' : 'border-gray-700 z-10'}`}
      style={{ 
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        width: '200px', 
        left: 0,
        top: 0,
        willChange: 'transform'
      }}
    >
      <div 
        className="flex items-center justify-between p-2 bg-gray-950 rounded-t-lg border-b border-gray-800 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onMouseDown(e, node.id)}
      >
        <div className="flex items-center gap-2 font-mono text-sm font-bold text-gray-200 pointer-events-none">
          {getIcon()}
          <span>{node.data.label || node.type}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
          className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {node.type === NodeType.MASTER && (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                     <span className="text-xs text-gray-400">Main Out</span>
                     <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDataChange('isMuted', !node.data.isMuted); 
                        }}
                        className={`p-1 rounded ${node.data.isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                        onMouseDown={(e) => e.stopPropagation()}
                     >
                         {node.data.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                     </button>
                </div>
                <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={node.data.gain ?? 1}
                        onChange={(e) => handleDataChange('gain', Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                />
                
                <canvas 
                    ref={canvasRef} 
                    width={174} 
                    height={60} 
                    className="bg-gray-900 rounded border border-gray-700 w-full"
                />
            </div>
        )}

        {node.type === NodeType.ANALYZER && (
             <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-400">Oscilloscope</span>
                <canvas 
                    ref={canvasRef} 
                    width={174} 
                    height={80} 
                    className="bg-gray-900 rounded border border-gray-700 w-full"
                />
             </div>
        )}

        <div className="space-y-2">
            
            {(node.type === NodeType.OSCILLATOR || node.type === NodeType.FILTER) && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Freq: {node.data.frequency || node.data.cutoff || 440}Hz</label>
                    <input 
                        type="range" min="20" max="2000" step="10" 
                        value={node.data.frequency || node.data.cutoff || 440}
                        onChange={(e) => handleDataChange(node.type === NodeType.FILTER ? 'cutoff' : 'frequency', Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                    />
                </div>
            )}

            {(node.type === NodeType.OSCILLATOR || node.type === NodeType.SYNTH) && (
                <div className="flex gap-1 justify-between bg-gray-900 p-1 rounded">
                    {['sine', 'square', 'sawtooth'].map((type) => (
                        <button
                            key={type}
                            className={`w-full h-6 rounded text-[10px] uppercase font-bold transition-colors ${node.data.waveType === type ? 'bg-accent-purple text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            onClick={() => handleDataChange('waveType', type)}
                        >
                           {type.slice(0, 3)}
                        </button>
                    ))}
                </div>
            )}

            {node.type === NodeType.NOISE && (
                <div className="flex gap-1 justify-between bg-gray-900 p-1 rounded">
                    {['white', 'pink', 'brown'].map((type) => (
                        <button
                            key={type}
                            className={`w-full h-6 rounded text-[10px] uppercase font-bold transition-colors ${node.data.noiseType === type ? 'bg-pink-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            onClick={() => handleDataChange('noiseType', type)}
                        >
                           {type}
                        </button>
                    ))}
                </div>
            )}

            {node.type === NodeType.PANNER && (
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>L</span>
                        <span>{(node.data.pan ?? 0).toFixed(1)}</span>
                        <span>R</span>
                    </div>
                    <input 
                        type="range" min="-1" max="1" step="0.1" 
                        value={node.data.pan ?? 0}
                        onChange={(e) => handleDataChange('pan', Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                </div>
            )}

            {node.type === NodeType.COMPRESSOR && (
                <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Thresh: {(node.data.threshold ?? -30)}dB</label>
                        <input 
                            type="range" min="-60" max="0" step="1" 
                            value={node.data.threshold ?? -30}
                            onChange={(e) => handleDataChange('threshold', Number(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Ratio: {(node.data.ratio ?? 3)}:1</label>
                        <input 
                            type="range" min="1" max="20" step="0.5" 
                            value={node.data.ratio ?? 3}
                            onChange={(e) => handleDataChange('ratio', Number(e.target.value))}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        />
                    </div>
                </div>
            )}

            {node.type === NodeType.SEQUENCER && (
                <div className="grid grid-cols-4 gap-1">
                    {(node.data.steps || Array(16).fill(false)).map((isActive, idx) => (
                        <button
                            key={idx}
                            className={`w-6 h-6 rounded-sm transition-all ${isActive ? 'bg-accent-cyan shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-gray-700 hover:bg-gray-600'}`}
                            onClick={() => {
                                const newSteps = [...(node.data.steps || Array(16).fill(false))];
                                newSteps[idx] = !newSteps[idx];
                                handleDataChange('steps', newSteps);
                            }}
                        />
                    ))}
                </div>
            )}

            {(node.type === NodeType.DELAY || node.type === NodeType.REVERB || node.type === NodeType.DISTORTION || node.type === NodeType.CHORUS) && (
                <>
                    {node.type === NodeType.DISTORTION && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Amt: {(node.data.distortion ?? 0.4).toFixed(2)}</label>
                            <input 
                                type="range" min="0" max="1" step="0.05" 
                                value={node.data.distortion ?? 0.4}
                                onChange={(e) => handleDataChange('distortion', Number(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                            />
                        </div>
                    )}
                    {node.type === NodeType.CHORUS && (
                         <div className="flex flex-col gap-2">
                             <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Freq: {(node.data.chorusFrequency ?? 4)}Hz</label>
                                <input 
                                    type="range" min="0.1" max="10" step="0.1" 
                                    value={node.data.chorusFrequency ?? 4}
                                    onChange={(e) => handleDataChange('chorusFrequency', Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                                />
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Depth: {(node.data.chorusDepth ?? 0.5).toFixed(2)}</label>
                                <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={node.data.chorusDepth ?? 0.5}
                                    onChange={(e) => handleDataChange('chorusDepth', Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                                />
                             </div>
                         </div>
                    )}
                    
                    {(node.type !== NodeType.DISTORTION || node.type === NodeType.DISTORTION) && ( 
                         <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Wet: {(node.data.wet || 0.5).toFixed(2)}</label>
                            <input 
                                type="range" min="0" max="1" step="0.05" 
                                value={node.data.wet ?? 0.5}
                                onChange={(e) => handleDataChange('wet', Number(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                            />
                        </div>
                    )}
                </>
            )}

            {(node.type === NodeType.GAIN || node.type === NodeType.NOISE) && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Gain: {(node.data.gain ?? (node.type === NodeType.GAIN ? 1 : 0.8)).toFixed(2)}</label>
                    <input 
                        type="range" min="0" max="2" step="0.05" 
                        value={node.data.gain ?? (node.type === NodeType.GAIN ? 1 : 0.8)}
                        onChange={(e) => handleDataChange('gain', Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                    />
                </div>
            )}
        </div>
      </div>

      {node.type !== NodeType.OSCILLATOR && node.type !== NodeType.SEQUENCER && node.type !== NodeType.NOISE && (
        <div 
            className="absolute w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-950 hover:bg-green-400 cursor-crosshair transition-colors z-50"
            style={{ top: '56px', left: '-12px' }}
            title="Audio In"
            onMouseDown={(e) => { e.stopPropagation(); onStartConnection(node.id, true, e); }}
            onMouseUp={() => onEndConnection(node.id, true)}
        />
      )}

      {node.type !== NodeType.MASTER && (
        <div 
            className="absolute w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-950 hover:bg-accent-cyan cursor-crosshair transition-colors z-50"
            style={{ top: '56px', right: '-12px' }}
            title="Audio Out"
            onMouseDown={(e) => { e.stopPropagation(); onStartConnection(node.id, false, e); }}
            onMouseUp={() => onEndConnection(node.id, false)}
        />
      )}
    </div>
  );
};

export default React.memo(AudioNode);