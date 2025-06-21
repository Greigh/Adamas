// Audio utility functions
let audioContext;
let timerSoundSource = null;
let activeAudio = null; // Declare this only once

// Sound URLs
const AUDIO_URLS = {
  beep: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  ding: 'https://assets.mixkit.co/active_storage/sfx/255/255-preview.mp3',
  alarm: 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
  chime: 'https://assets.mixkit.co/active_storage/sfx/133/133-preview.mp3',
};

/**
 * Initialize the audio context
 */
export function initAudio() {
  try {
    // Create audio context with auto-suspend to save resources
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive',
      sampleRate: 44100,
    });

    // Remove or comment out noisy console logs in production
    // (audio.js:25) Remove 'Audio context initialized' log

    // Resume context on user interaction
    document.addEventListener(
      'click',
      function resumeAudio() {
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
        }
        document.removeEventListener('click', resumeAudio);
      },
      { once: true }
    );
  } catch (e) {
    console.error('Web Audio API not supported:', e);
  }
}

// Generate a beep sound
export function playBeep(frequency = 440, duration = 0.5, volume = 0.5) {
  if (!audioContext) {
    console.warn('Audio context not initialized');
    return null;
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  try {
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    // Create gain node for volume and fade out
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and stop with slight fade out
    const now = audioContext.currentTime;
    oscillator.start(now);

    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.stop(now + duration);

    return oscillator;
  } catch (e) {
    console.error('Error generating beep:', e);
    return null;
  }
}

// This is the first missing export
export function playTimerExpiredSound() {
  // Stop any existing sound first
  stopTimerSound();

  // Create a timer alarm sound (multiple beeps)
  if (!audioContext) {
    initAudio();
    if (!audioContext) return; // Still no audio context
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Create a repeating beep pattern
  const beepCount = 3;
  const beepDuration = 0.2;
  const beepSpacing = 0.3;
  const beepFrequency = 880; // Higher pitched beep for alarm

  for (let i = 0; i < beepCount; i++) {
    // Schedule each beep with increasing delay
    setTimeout(() => {
      timerSoundSource = playBeep(beepFrequency, beepDuration, 0.7);
    }, i * beepSpacing * 1000);
  }
}

// This is the second missing export
export function stopTimerSound() {
  // Stop any currently playing timer sound
  if (timerSoundSource) {
    try {
      timerSoundSource.stop();
    } catch (e) {
      // Ignore errors if sound has already stopped
    }
    timerSoundSource = null;
  }

  // Also stop any active audio element
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
}

// Sound URLs for different sound types
const SOUND_URLS = {
  beep: null, // Uses oscillator
  bell: 'https://assets.mixkit.co/active_storage/sfx/255/255-preview.mp3',
  alarm: 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
};

// Play a sound from URL
export function playSound(
  soundType = 'beep',
  customUrl = null,
  isTest = false
) {
  // Stop any existing sound
  stopTimerSound();

  // Use oscillator for beep type
  if (soundType === 'beep') {
    if (isTest) {
      playBeep(440, 0.2, 0.3);
    } else {
      playTimerExpiredSound();
    }
    return;
  }

  // Get the appropriate URL
  let soundUrl = soundType === 'custom' ? customUrl : SOUND_URLS[soundType];

  // Fallback to beep if no URL is available
  if (!soundUrl) {
    console.warn('No sound URL for type:', soundType);
    if (isTest) {
      playBeep(440, 0.2, 0.3);
    } else {
      playTimerExpiredSound();
    }
    return;
  }

  try {
    // Create new audio element
    const audio = new Audio(soundUrl);
    activeAudio = audio; // Use the already declared variable

    // Shorter duration for test sounds
    if (isTest) {
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 1000);
    }

    audio.play().catch((e) => {
      console.error('Error playing audio:', e);
      // Fallback to beep on error
      playBeep(440, 0.5, 0.5);
    });
  } catch (e) {
    console.error('Error creating audio element:', e);
    // Fallback to beep
    playBeep(440, 0.5, 0.5);
  }
}

// Make sure the playAlertSound function is exported
export function playAlertSound(soundType, customUrl, isTest = false) {
  // Determine which sound to play based on type
  switch (soundType) {
    case 'beep':
      // Play a simple beep
      if (isTest) {
        // Shorter test sound
        playBeep(440, 0.2, 0.3);
      } else {
        // Full alarm
        playTimerExpiredSound();
      }
      break;

    case 'bell':
      // Play a bell sound
      playSound('bell', null, isTest);
      break;

    case 'alarm':
      // Play an alarm sound
      playSound('alarm', null, isTest);
      break;

    case 'custom':
      // Play custom sound URL if provided
      if (customUrl) {
        playSound('custom', customUrl, isTest);
      } else {
        // Fall back to beep
        playBeep(440, 0.5, 0.5);
      }
      break;

    default:
      // Default to beep
      playBeep(440, 0.5, 0.5);
  }
}
