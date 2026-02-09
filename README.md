# SonicGraph

SonicGraph is a browser-based visual modular synthesizer and sequencer. It allows users to create complex soundscapes and rhythms by connecting various audio nodes in a graph interface.

## Features

-   **Modular Design**: Drag and drop nodes like Oscillators, Synths, Effects, and Utility modules.
-   **Visual Connections**: intuitively wire inputs and outputs.
-   **Sequencer**: 16-step sequencer to trigger synthesizers.
-   **Effects Chain**: Includes Reverb, Delay, Distortion, Chorus, Compressor, and Filter.
-   **Audio Engine**: Powered by Tone.js for high-quality audio synthesis.
-   **Project Management**: Save and Load your patch layouts as JSON files.
-   **Recorder**: Record your jam session and download it as a WEBM audio file.

## Getting Started

1.  **Play**: Click the PLAY button in the top bar to start the audio engine.
2.  **Add Nodes**: Drag modules from the sidebar onto the canvas.
3.  **Connect**: Drag from a node's Output (Right side) to another node's Input (Left side).
4.  **Make Sound**:
    *   Connect a **Sequencer** to a **Synthesizer** to create a melody.
    *   Connect the **Synthesizer** to the **Master Output** (or via effects) to hear it.
5.  **Adjust**: Use the sliders on each node to tweak parameters like frequency, gain, and effect wetness.

## Node Types

-   **Master**: The final output. Includes a volume slider, mute button, and oscilloscope.
-   **Sequencer**: Triggers connected Synths. Click the 4x4 grid to toggle steps.
-   **Synthesizer**: Polyphonic synth with selectable waveforms (Sine, Square, Sawtooth).
-   **Oscillator**: Continuous signal generator (LFO or Drone).
-   **Noise**: White/Pink/Brown noise generator.
-   **Filter**: Lowpass filter with frequency control.
-   **Effects**: Delay, Reverb, Distortion, Chorus, Compressor, Panner.
-   **Analyzer**: Visual oscilloscope to inspect signals at any point in the chain.

## Tech Stack

-   React
-   TypeScript
-   Tone.js
-   Tailwind CSS
-   Lucide React (Icons)
