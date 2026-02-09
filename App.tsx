import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import AudioNode from './components/AudioNode';
import { AudioNodeItem, Connection, NodeType, Position } from './types';
import { AudioEngine } from './services/AudioEngine';
import { Play, Square, Save, RotateCcw, Upload, Download } from 'lucide-react';

const INITIAL_NODES: AudioNodeItem[] = [
  { id: 'master', type: NodeType.MASTER, position: { x: 1100, y: 300 }, data: { label: 'Master Out', gain: 1.0 } },
  { id: 'reverb-1', type: NodeType.REVERB, position: { x: 900, y: 300 }, data: { label: 'Big Hall', decay: 3.5, wet: 0.3 } },
  { id: 'seq-bass', type: NodeType.SEQUENCER, position: { x: 50, y: 50 }, data: { label: 'Bass Seq', steps: [true,false,false,true, false,false,true,false, true,false,false,true, false,true,false,false] } },
  { id: 'synth-bass', type: NodeType.SYNTH, position: { x: 300, y: 50 }, data: { label: 'Bass Synth', waveType: 'sawtooth', gain: 0.5 } },
  { id: 'filter-bass', type: NodeType.FILTER, position: { x: 500, y: 50 }, data: { label: 'Lowpass', cutoff: 800 } },
  { id: 'dist-bass', type: NodeType.DISTORTION, position: { x: 700, y: 50 }, data: { label: 'Drive', distortion: 0.4, wet: 0.4 } },
  { id: 'seq-lead', type: NodeType.SEQUENCER, position: { x: 50, y: 300 }, data: { label: 'Arp Seq', steps: [true,true,false,true, false,true,true,false, true,false,true,true, false,true,false,true] } },
  { id: 'synth-lead', type: NodeType.SYNTH, position: { x: 300, y: 300 }, data: { label: 'Lead Synth', waveType: 'square', gain: 0.3 } },
  { id: 'delay-lead', type: NodeType.DELAY, position: { x: 500, y: 300 }, data: { label: 'Delay', delayTime: 0.25, wet: 0.4 } },
  { id: 'osc-drone', type: NodeType.OSCILLATOR, position: { x: 50, y: 550 }, data: { label: 'Drone Osc', frequency: 65, waveType: 'sine', gain: 0.3 } },
  { id: 'chorus-drone', type: NodeType.CHORUS, position: { x: 300, y: 550 }, data: { label: 'Widener', chorusFrequency: 0.5, chorusDepth: 0.8, wet: 0.6 } },
  { id: 'pan-drone', type: NodeType.PANNER, position: { x: 500, y: 550 }, data: { label: 'Panner', pan: -0.2 } },
];

const INITIAL_CONNECTIONS: Connection[] = [
    { id: 'c-b1', source: 'seq-bass', target: 'synth-bass' },
    { id: 'c-b2', source: 'synth-bass', target: 'filter-bass' },
    { id: 'c-b3', source: 'filter-bass', target: 'dist-bass' },
    { id: 'c-b4', source: 'dist-bass', target: 'master' },
    { id: 'c-l1', source: 'seq-lead', target: 'synth-lead' },
    { id: 'c-l2', source: 'synth-lead', target: 'delay-lead' },
    { id: 'c-l3', source: 'delay-lead', target: 'reverb-1' },
    { id: 'c-d1', source: 'osc-drone', target: 'chorus-drone' },
    { id: 'c-d2', source: 'chorus-drone', target: 'pan-drone' },
    { id: 'c-d3', source: 'pan-drone', target: 'reverb-1' },
    { id: 'c-m1', source: 'reverb-1', target: 'master' },
];

function App() {
  const [nodes, setNodes] = useState<AudioNodeItem[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState(128);
  
  const [dragState, setDragState] = useState<{ nodeId: string, offset: Position } | null>(null);
  const [connectionDraft, setConnectionDraft] = useState<{ sourceId: string, mousePos: Position } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  const nodeMap = useMemo(() => {
    return new Map(nodes.map(node => [node.id, node]));
  }, [nodes]);

  useEffect(() => {
    if (dragState) {
        return;
    }

    AudioEngine.syncGraph(nodes, connections);
    AudioEngine.scheduleSequencers(nodes, connections);
  }, [nodes, connections, dragState]);

  const togglePlay = async () => {
    if (!isPlaying) {
      await AudioEngine.start();
    } else {
      AudioEngine.stop();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleRecording = async () => {
    if (!isRecording) {
        await AudioEngine.startRecording();
        setIsRecording(true);
    } else {
        const blob = await AudioEngine.stopRecording();
        setIsRecording(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sonicgraph-export-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = Number(e.target.value);
    setBpm(newBpm);
    AudioEngine.setBpm(newBpm);
  };

  const handleSaveProject = () => {
      const projectData = {
          nodes,
          connections,
          bpm,
          version: '1.0'
      };
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sonicgraph-project-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const data = JSON.parse(content);
              
              if (data.nodes && data.connections) {
                  if (isPlaying) togglePlay();
                  
                  setNodes(data.nodes);
                  setConnections(data.connections);
                  if (data.bpm) {
                      setBpm(data.bpm);
                      AudioEngine.setBpm(data.bpm);
                  }
                  
                  if (fileInputRef.current) fileInputRef.current.value = '';
              } else {
                  alert('Invalid project file format.');
              }
          } catch (err) {
              console.error('Failed to parse project file', err);
              alert('Failed to load project file.');
          }
      };
      reader.readAsText(file);
  };

  const getLocalCoordinates = useCallback((e: React.MouseEvent | React.DragEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    
    const node = nodesRef.current.find(n => n.id === id);
    if (node) {
      setDragState({
        nodeId: id,
        offset: { x: e.clientX - node.position.x, y: e.clientY - node.position.y }
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState) {
      setNodes(prev => prev.map(n => {
        if (n.id === dragState.nodeId) {
          return { ...n, position: { x: e.clientX - dragState.offset.x, y: e.clientY - dragState.offset.y } };
        }
        return n;
      }));
    }
    
    if (connectionDraft) {
        const localPos = getLocalCoordinates(e);
        setConnectionDraft(prev => prev ? { ...prev, mousePos: localPos } : null);
    }
  }, [dragState, connectionDraft, getLocalCoordinates]);

  const handleMouseUp = () => {
    setDragState(null);
    setConnectionDraft(null);
  };

  const handleStartConnection = useCallback((id: string, isInput: boolean, e: React.MouseEvent) => {
      const localPos = getLocalCoordinates(e);
      
      if (isInput) {
          const existingConn = connectionsRef.current.find(c => c.target === id);
          if (existingConn) {
             setConnections(prev => prev.filter(c => c.id !== existingConn.id));
             setConnectionDraft({ sourceId: existingConn.source, mousePos: localPos });
          }
      } else {
          setConnectionDraft({ sourceId: id, mousePos: localPos });
      }
  }, [getLocalCoordinates]);

  const handleEndConnection = useCallback((targetId: string, isInput: boolean) => {
      setConnectionDraft(prevDraft => {
          if (prevDraft && isInput) {
             if (prevDraft.sourceId !== targetId) {
                 const newConnId = `${prevDraft.sourceId}-${targetId}`;
                 const exists = connectionsRef.current.find(c => c.source === prevDraft.sourceId && c.target === targetId);
                 if (!exists) {
                     setConnections(prev => [...prev, {
                         id: newConnId,
                         source: prevDraft.sourceId,
                         target: targetId
                     }]);
                 }
             }
          }
          return null;
      });
  }, []);

  const handleRemoveConnection = useCallback((id: string) => {
      setConnections(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow') as NodeType;
    if (type) {
      const pos = getLocalCoordinates(e);
      
      const newNode: AudioNodeItem = {
        id: `${type.toLowerCase()}-${Date.now()}`,
        type,
        position: pos,
        data: { 
            label: type === NodeType.MASTER ? 'Output' : type.charAt(0) + type.slice(1).toLowerCase(), 
            waveType: 'sine', 
            gain: 0.5, 
            wet: 0.5, 
            decay: 1.5, 
            steps: Array(16).fill(false) 
        }
      };
      setNodes(prev => [...prev, newNode]);
    }
  }, [getLocalCoordinates]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDeleteNode = useCallback((id: string) => {
      setNodes(prev => prev.filter(n => n.id !== id));
      setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
  }, []);

  const handleUpdateNodeData = useCallback((id: string, data: any) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, data } : n));
  }, []);

  const getNodeCenter = (id: string, isInput: boolean) => {
      const node = nodeMap.get(id); 
      if (!node) return { x: 0, y: 0 };
      return { 
          x: node.position.x + (isInput ? -4 : 204), 
          y: node.position.y + 64 
      };
  };

  const getPath = (start: Position, end: Position) => {
      const controlDist = Math.max(Math.abs(end.x - start.x) * 0.5, 50);
      return `M ${start.x} ${start.y} C ${start.x + controlDist} ${start.y} ${end.x - controlDist} ${end.y} ${end.x} ${end.y}`;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative">
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6 justify-between z-30">
           <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${isPlaying ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-accent-cyan hover:bg-cyan-500 shadow-accent-cyan/20'} shadow-lg`}
              >
                 {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                 {isPlaying ? 'STOP' : 'PLAY'}
              </button>
              
              <button 
                 onClick={toggleRecording}
                 className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border ${isRecording ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                 title="Record Output to Audio File"
              >
                 <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500' : 'bg-red-500/50'}`}></div>
                 {isRecording ? 'REC' : 'REC'}
              </button>

              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-400 font-bold tracking-wider">BPM</span>
                  <input 
                    type="number" 
                    value={bpm} 
                    onChange={handleBpmChange}
                    className="w-16 bg-transparent border-none text-right font-mono focus:ring-0" 
                  />
              </div>
           </div>

           <div className="flex gap-2">
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileLoad} 
                accept=".json" 
                className="hidden" 
             />
             
             <button onClick={() => { setNodes(INITIAL_NODES); setConnections(INITIAL_CONNECTIONS); }} className="p-2 hover:bg-gray-800 rounded text-gray-400" title="Reset Demo">
                <RotateCcw className="w-5 h-5" />
             </button>
             
             <button onClick={handleLoadClick} className="p-2 hover:bg-gray-800 rounded text-gray-400" title="Load Project">
                <Upload className="w-5 h-5" />
             </button>

             <button onClick={handleSaveProject} className="p-2 hover:bg-gray-800 rounded text-gray-400" title="Save Project">
                <Save className="w-5 h-5" />
             </button>
           </div>
        </div>

        <div 
            ref={canvasRef}
            className="flex-1 relative bg-gray-950 overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ 
                backgroundImage: 'radial-gradient(#1f2937 1px, transparent 1px)', 
                backgroundSize: '24px 24px' 
            }}
        >
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                {connections.map(conn => {
                    const start = getNodeCenter(conn.source, false);
                    const end = getNodeCenter(conn.target, true);
                    const isSequencer = nodeMap.get(conn.source)?.type === NodeType.SEQUENCER;
                    
                    return (
                        <g key={conn.id} className="pointer-events-auto group">
                            <path 
                                d={getPath(start, end)}
                                stroke="transparent"
                                strokeWidth="15"
                                fill="none"
                                className="cursor-pointer"
                                onDoubleClick={() => handleRemoveConnection(conn.id)}
                            >
                                <title>Double-click to remove</title>
                            </path>
                            
                            <path 
                                d={getPath(start, end)}
                                stroke={isSequencer ? '#facc15' : '#06b6d4'}
                                strokeWidth="3"
                                fill="none"
                                className="opacity-60 group-hover:opacity-100 group-hover:stroke-red-400 transition-all duration-200 pointer-events-none"
                            />
                        </g>
                    );
                })}
                {connectionDraft && (
                    <path 
                        d={getPath(getNodeCenter(connectionDraft.sourceId, false), connectionDraft.mousePos)}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        fill="none"
                    />
                )}
            </svg>

            {nodes.map(node => (
                <AudioNode 
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onMouseDown={handleNodeMouseDown}
                    onDelete={handleDeleteNode}
                    onUpdateData={handleUpdateNodeData}
                    onStartConnection={handleStartConnection}
                    onEndConnection={handleEndConnection}
                />
            ))}
        </div>
      </div>
    </div>
  );
}

export default App;