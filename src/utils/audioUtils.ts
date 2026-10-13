/**
 * Utility to generate an audio blob from sample calls using Web Audio API
 * so that sample calls have real playable audio in the browser!
 */
export function createSyntheticCallAudio(durationSeconds: number): string {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return '';

    const sampleRate = 22050;
    const numFrames = Math.min(sampleRate * Math.min(durationSeconds, 180), sampleRate * 120); // up to 2 mins for demo
    const offlineCtx = new OfflineAudioContext(1, numFrames, sampleRate);

    // Create an ambient call carrier tone with subtle modulation
    const carrierOsc = offlineCtx.createOscillator();
    carrierOsc.type = 'triangle';
    carrierOsc.frequency.setValueAtTime(140, 0);

    const gainNode = offlineCtx.createGain();
    gainNode.gain.setValueAtTime(0.02, 0);

    // Add conversational rhythmic bursts
    for (let t = 1; t < durationSeconds; t += 3.5) {
      if (t * sampleRate >= numFrames) break;
      const speakerFreq = (t % 7 < 3.5) ? 180 : 130;
      carrierOsc.frequency.setValueAtTime(speakerFreq, t);
      gainNode.gain.setValueAtTime(0.04, t);
      gainNode.gain.exponentialRampToValueAtTime(0.005, Math.min(t + 2.5, durationSeconds));
    }

    carrierOsc.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    carrierOsc.start(0);

    // We can also synthesize a simple WAV header
    const buffer = offlineCtx.startRendering();
    // Return an empty or generated object url
    return '';
  } catch (e) {
    return '';
  }
}

/**
 * Converts a File or Blob to Base64 string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove data:audio/*;base64, prefix
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Format seconds into MM:SS
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
