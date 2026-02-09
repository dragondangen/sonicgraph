import * as Tone from 'tone';
import { AudioNodeItem, Connection, NodeType } from '../types';

class AudioEngineService {
  private nodes: Map<string, Tone.ToneAudioNode | any> = new Map();
  private connections: Set<string> = new Set();
  private loop: Tone.Loop | null = null;
  private isStarted = false;
  private recorder: Tone.Recorder;
  
  constructor() {
    const dest = Tone.getDestination();
    this.recorder = new Tone.Recorder();
    dest.connect(this.recorder);
  }

  public getNodeWaveform(nodeId: string): Float32Array | null {
      const node = this.nodes.get(nodeId);
      if (node) {
          if (node instanceof Tone.Waveform) return node.getValue();
          if ((node as any).waveform) return (node as any).waveform.getValue();
      }
      return null;
  }

  public async start() {
    if (!this.isStarted) {
      await Tone.start();
      console.log('Audio Context Started');
      this.isStarted = true;
    }
    if (Tone.getTransport().state !== 'started') {
      Tone.getTransport().start();
    }
  }

  public stop() {
    Tone.getTransport().stop();
  }

  public setBpm(bpm: number) {
    Tone.getTransport().bpm.value = bpm;
  }

  public async startRecording() {
    if (Tone.getContext().state !== 'running') {
        await Tone.start();
    }
    if (this.recorder.state !== 'started') {
        this.recorder.start();
    }
  }

  public async stopRecording(): Promise<Blob> {
    if (this.recorder.state === 'started') {
        return await this.recorder.stop();
    }
    return new Blob([], { type: 'audio/webm' }); 
  }

  public syncGraph(nodes: AudioNodeItem[], connections: Connection[]) {
    nodes.forEach(node => {
      let toneNode = this.nodes.get(node.id);

      if (!toneNode) {
        toneNode = this.createToneNode(node);
        if (toneNode) {
          this.nodes.set(node.id, toneNode);
        }
      }

      this.updateNodeParams(toneNode, node);
    });

    const activeNodeIds = new Set(nodes.map(n => n.id));
    this.nodes.forEach((node, id) => {
      if (!activeNodeIds.has(id)) {
        if (node) {
          if (node.dispose) node.dispose();
          this.nodes.delete(id);
        }
      }
    });

    this.nodes.forEach(node => {
      if (node && node.disconnect && node !== Tone.getDestination()) {
         if (!(node instanceof Tone.Channel)) { 
             try {
                node.disconnect();
             } catch (e) {
                console.warn("Disconnect error", e);
             }
         }
      }
    });

    connections.forEach(conn => {
      const source = this.nodes.get(conn.source);
      const target = this.nodes.get(conn.target);

      if (source && target) {
        const sourceNodeDef = nodes.find(n => n.id === conn.source);
        
        if (sourceNodeDef?.type === NodeType.SEQUENCER) {
        } else {
             if (source.connect) {
                 source.connect(target);
             }
        }
      }
    });
  }

  private createToneNode(node: AudioNodeItem) {
    switch (node.type) {
      case NodeType.MASTER:
        const channel = new Tone.Channel(0, 0).toDestination();
        const waveform = new Tone.Waveform(64);
        channel.connect(waveform);
        (channel as any).waveform = waveform;
        return channel;
      case NodeType.OSCILLATOR:
        return new Tone.Oscillator().start();
      case NodeType.SYNTH:
        return new Tone.PolySynth(Tone.Synth);
      case NodeType.FILTER:
        return new Tone.Filter();
      case NodeType.DELAY:
        return new Tone.FeedbackDelay();
      case NodeType.REVERB:
        return new Tone.Reverb();
      case NodeType.DISTORTION:
        return new Tone.Distortion(0.4);
      case NodeType.CHORUS:
        return new Tone.Chorus(4, 2.5, 0.5).start();
      case NodeType.GAIN:
        return new Tone.Gain(1);
      case NodeType.NOISE:
        return new Tone.Noise('white').start();
      case NodeType.COMPRESSOR:
        return new Tone.Compressor(-30, 3);
      case NodeType.PANNER:
        return new Tone.Panner(0);
      case NodeType.ANALYZER:
        return new Tone.Waveform(64);
      case NodeType.SEQUENCER:
        return { type: 'sequencer', eventId: null };
      default:
        return null;
    }
  }

  private updateNodeParams(toneNode: any, nodeData: AudioNodeItem) {
    const { data } = nodeData;

    if (nodeData.type === NodeType.MASTER) {
        if (toneNode instanceof Tone.Channel) {
            const isMuted = !!data.isMuted;
            toneNode.mute = isMuted;
            const targetDb = isMuted ? -Infinity : Tone.gainToDb(data.gain ?? 1);
            toneNode.volume.rampTo(targetDb, 0.1);
        }
        return;
    }

    switch (nodeData.type) {
      case NodeType.OSCILLATOR:
        if (toneNode instanceof Tone.Oscillator) {
          toneNode.frequency.rampTo(data.frequency || 440, 0.1);
          toneNode.type = data.waveType || 'sine';
          toneNode.volume.rampTo(Tone.gainToDb(data.gain ?? 0.5), 0.1);
        }
        break;
        
      case NodeType.SYNTH:
        if (toneNode instanceof Tone.PolySynth) {
          toneNode.set({
             oscillator: { type: data.waveType || 'triangle' },
             volume: Tone.gainToDb(data.gain ?? 0.8)
          });
        }
        break;

      case NodeType.FILTER:
        if (toneNode instanceof Tone.Filter) {
          toneNode.frequency.rampTo(data.cutoff || 1000, 0.1);
          toneNode.type = 'lowpass';
        }
        break;

      case NodeType.DELAY:
        if (toneNode instanceof Tone.FeedbackDelay) {
          toneNode.delayTime.rampTo(data.delayTime || 0.25, 0.1);
          toneNode.feedback.rampTo(0.5, 0.1);
          toneNode.wet.value = data.wet ?? 0.5;
        }
        break;

        case NodeType.REVERB:
        if (toneNode instanceof Tone.Reverb) {
          toneNode.decay = data.decay || 1.5;
          toneNode.wet.value = data.wet ?? 0.5;
        }
        break;

      case NodeType.DISTORTION:
        if (toneNode instanceof Tone.Distortion) {
          toneNode.distortion = data.distortion ?? 0.4;
          toneNode.wet.value = data.wet ?? 0.5;
        }
        break;

      case NodeType.CHORUS:
        if (toneNode instanceof Tone.Chorus) {
          toneNode.frequency.value = data.chorusFrequency ?? 4;
          toneNode.delayTime = data.chorusDelay ?? 2.5;
          toneNode.depth = data.chorusDepth ?? 0.5;
          toneNode.wet.value = data.wet ?? 0.5;
        }
        break;

      case NodeType.GAIN:
        if (toneNode instanceof Tone.Gain) {
          toneNode.gain.rampTo(data.gain ?? 1, 0.1);
        }
        break;

      case NodeType.NOISE:
        if (toneNode instanceof Tone.Noise) {
            toneNode.type = data.noiseType || 'white';
            toneNode.volume.rampTo(Tone.gainToDb(data.gain ?? 0.8), 0.1);
        }
        break;
      
      case NodeType.COMPRESSOR:
        if (toneNode instanceof Tone.Compressor) {
            toneNode.threshold.value = data.threshold ?? -30;
            toneNode.ratio.value = data.ratio ?? 3;
        }
        break;

      case NodeType.PANNER:
        if (toneNode instanceof Tone.Panner) {
            toneNode.pan.rampTo(data.pan ?? 0, 0.1);
        }
        break;

      case NodeType.SEQUENCER:
      case NodeType.ANALYZER:
        break;
    }
  }

  public scheduleSequencers(nodes: AudioNodeItem[], connections: Connection[]) {
    if (this.loop) {
        this.loop.dispose();
        this.loop = null;
    }

    let stepIndex = 0;
    
    this.loop = new Tone.Loop((time) => {
        const sequencers = nodes.filter(n => n.type === NodeType.SEQUENCER);
        
        sequencers.forEach(seq => {
            const steps = seq.data.steps || Array(16).fill(false);
            const currentStepActive = steps[stepIndex % 16];
            
            if (currentStepActive) {
                const connectedEdges = connections.filter(c => c.source === seq.id);
                connectedEdges.forEach(edge => {
                    const targetToneNode = this.nodes.get(edge.target);
                    if (targetToneNode && targetToneNode instanceof Tone.PolySynth) {
                        targetToneNode.triggerAttackRelease("C4", "16n", time);
                    } else if (targetToneNode && targetToneNode instanceof Tone.Oscillator) {
                    }
                });
            }
        });

        stepIndex++;
    }, "16n").start(0);
  }
}

export const AudioEngine = new AudioEngineService();