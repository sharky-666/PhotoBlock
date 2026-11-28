import { useEffect, useRef } from 'react';

const INTRO_SOURCE = '/audio/gallery-intro.mp3';
const SHUTTER_SOURCE = '/audio/shutter.mp3';

let introAudio: HTMLAudioElement | null = null;
let shutterAudio: HTMLAudioElement | null = null;

function createAudio(source: string, volume: number): HTMLAudioElement {
  const audio = new Audio(source);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

function getIntroAudio(): HTMLAudioElement {
  introAudio ??= createAudio(INTRO_SOURCE, 0.26);
  return introAudio;
}

function getShutterAudio(): HTMLAudioElement {
  shutterAudio ??= createAudio(SHUTTER_SOURCE, 0.28);
  return shutterAudio;
}

export function playEntranceSound(): void {
  const audio = getIntroAudio();
  audio.currentTime = 0;
  audio.volume = 0.26;
  void audio.play().catch(() => {
    // Autoplay can be blocked until the first user gesture.
  });
}

export function playPageTransitionSound(): void {
  const audio = getShutterAudio();
  audio.currentTime = 0;
  audio.volume = 0.28;
  void audio.play().catch(() => {
    // The browser may still be waiting for the first user gesture.
  });
}

export function useShutterSound(): void {
  useEffect(() => {
    playEntranceSound();
  }, []);
}

export function usePageTransitionSound(pathname: string): void {
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    playPageTransitionSound();
  }, [pathname]);
}
