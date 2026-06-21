import { useCallback, useRef, useEffect } from 'react';

export function useAudioFeedback() {
  const ctxRef = useRef<AudioContext | null>(null);

  const init = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtor) {
        ctxRef.current = new AudioCtor();
      }
    }
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, []);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playPlasticClick = useCallback(() => {
    try {
      init();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.015);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(t + 0.015);
    } catch (e) {}
  }, [init]);

  const playSiliconeClick = useCallback(() => {
    try {
      init();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.03);

      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(t + 0.03);
    } catch (e) {}
  }, [init]);

  const playPrinter = useCallback(() => {
    try {
      init();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      
      // Simulate mechanical stepping motor sound for printer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0, t);
      
      const duration = 0.4;
      const steps = 8;
      const stepTime = duration / steps;
      
      for (let i = 0; i < steps; i++) {
        const stepT = t + (i * stepTime);
        osc.frequency.setValueAtTime(150 + Math.random() * 50, stepT);
        gain.gain.linearRampToValueAtTime(0.04, stepT + 0.01);
        gain.gain.linearRampToValueAtTime(0, stepT + stepTime - 0.01);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }, [init]);

  const playError = useCallback(() => {
    try {
      init();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(t + 0.25);
    } catch (e) {}
  }, [init]);

  const playComplete = useCallback(() => {
    try {
      init();
      const ctx = ctxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.1);

      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(t + 0.15);
    } catch (e) {}
  }, [init]);

  return { playPlasticClick, playSiliconeClick, playPrinter, playError, playComplete };
}
