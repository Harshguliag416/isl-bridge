import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../AppContext';
import { BACKEND_URL, HAS_BACKEND_URL } from '../config';
import { WEB_DISPLAY_FONT, WEB_FONT_FAMILY } from '../design';

const DEMO_PRESETS = [
  { id: 'A', label: 'A', sequence: ['A'], word: 'A' },
  { id: 'B', label: 'B', sequence: ['B'], word: 'B' },
  { id: 'H', label: 'H', sequence: ['H'], word: 'H' },
  { id: 'W', label: 'W', sequence: ['W'], word: 'W' },
  { id: 'Y', label: 'Y', sequence: ['Y'], word: 'Y' },
  { id: 'HI', label: 'HI', sequence: ['H', 'I'], word: 'HI' },
  { id: 'HELLO', label: 'HELLO', sequence: ['H', 'E', 'L', 'L', 'O'], word: 'HELLO' },
  { id: 'YES', label: 'YES', sequence: ['Y', 'E', 'S'], word: 'YES' },
  { id: 'NO', label: 'NO', sequence: ['N', 'O'], word: 'NO' },
  { id: 'HELP', label: 'HELP', sequence: ['H', 'E', 'L', 'P'], word: 'HELP' },
  { id: 'WATER', label: 'WATER', sequence: ['W', 'A', 'T', 'E', 'R'], word: 'WATER' },
];

const SIGN_TO_HINDI = {
  A: 'A',
  B: 'B',
  H: 'H',
  W: 'W',
  Y: 'Y',
  HI: 'HI',
  HELLO: 'HELLO',
  YES: 'YES',
  NO: 'NO',
  HELP: 'HELP',
  WATER: 'WATER',
};

const LANG = {
  en: {
    title: 'Mute -> Hearing',
    subtitle: 'Use the camera preview for live framing and use the demo controls for a reliable working showcase in the browser.',
    cameraReady: 'Camera active',
    cameraWaiting: 'Camera waiting',
    cameraBlocked: 'Camera blocked',
    backendReady: 'AI backend ready',
    backendOffline: 'AI backend offline',
    backendMissing: 'Backend URL missing',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    startSigning: 'Start Signing',
    stopSigning: 'Stop Signing',
    clear: 'Clear',
    demoTitle: 'Demo Showcase',
    demoHint: 'Use these buttons for the judge demo. They are stable and do not depend on live landmark tracking.',
    outputLabel: 'Detected Sign',
    outputPlaceholder: 'Result will appear here.',
    confidence: 'Confidence',
    demoWord: 'Demo word',
    browserNote: 'Web mode is currently running in simplified browser mode for reliability.',
    liveReady: 'Browser preview is live. Use the demo buttons for reliable judge-ready recognition.',
    liveOffline: 'Camera preview is live, but the backend health check is offline right now.',
    liveMissing: 'Camera preview is live, but the backend URL is not configured for this deployment.',
  },
  hi: {
    title: 'Mute -> Hearing',
    subtitle: 'Camera preview se framing karein aur browser mein reliable demo ke liye demo controls use karein.',
    cameraReady: 'Camera chalu hai',
    cameraWaiting: 'Camera wait par hai',
    cameraBlocked: 'Camera blocked hai',
    backendReady: 'AI backend tayyar hai',
    backendOffline: 'AI backend offline hai',
    backendMissing: 'Backend URL missing hai',
    startCamera: 'Camera Chalu Karein',
    stopCamera: 'Camera Band Karein',
    startSigning: 'Signing Chalu Karein',
    stopSigning: 'Signing Rokein',
    clear: 'Saaf Karein',
    demoTitle: 'Demo Showcase',
    demoHint: 'Judge demo ke liye in buttons ko use karein. Yeh live landmark tracking par depend nahi karte.',
    outputLabel: 'Pehchana Gaya Sign',
    outputPlaceholder: 'Result yahan dikhai dega.',
    confidence: 'Confidence',
    demoWord: 'Demo word',
    browserNote: 'Web mode reliability ke liye simplified browser mode mein chal raha hai.',
    liveReady: 'Browser preview live hai. Reliable judge demo ke liye demo buttons use karein.',
    liveOffline: 'Camera preview live hai, lekin backend health check abhi offline hai.',
    liveMissing: 'Camera preview live hai, lekin is deployment ke liye backend URL configured nahin hai.',
  },
};

export default function ModeAWebScreen() {
  const { theme, lang, isDark, setIsDark, setLang } = useContext(AppContext);
  const t = LANG[lang];

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const demoTimerRef = useRef(null);

  const [cameraState, setCameraState] = useState('waiting');
  const [backendState, setBackendState] = useState('waiting');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState(null);
  const [demoPresetId, setDemoPresetId] = useState(null);
  const [liveMessage, setLiveMessage] = useState('');

  const statusText = useMemo(() => {
    if (!HAS_BACKEND_URL) {
      return t.backendMissing;
    }

    return backendState === 'ready' ? t.backendReady : t.backendOffline;
  }, [backendState, t]);

  const checkBackend = async () => {
    if (!HAS_BACKEND_URL) {
      setBackendState('missing');
      return 'missing';
    }

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
      window.clearTimeout(timeoutId);
      const data = await response.json();
      const nextState = data?.status === 'healthy' ? 'ready' : 'offline';
      setBackendState(nextState);
      return nextState;
    } catch {
      setBackendState('offline');
      return 'offline';
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    checkBackend();
    const intervalId = window.setInterval(checkBackend, 15000);

    return () => {
      window.clearInterval(intervalId);
      stopDemo();
      stopCamera();
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  const speakText = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const stopDemo = () => {
    if (demoTimerRef.current) {
      window.clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    setDemoPresetId(null);
  };

  const stopCamera = () => {
    setSigning(false);
    setLiveMessage('');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStarted(false);
    setCameraState('waiting');
  };

  const startCamera = async () => {
    stopDemo();
    setLiveMessage('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('blocked');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 960 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStarted(true);
      setCameraState('ready');
      return true;
    } catch {
      setCameraStarted(false);
      setCameraState('blocked');
      return false;
    }
  };

  const startSigning = async () => {
    stopDemo();
    setResult(null);

    if (!cameraStarted) {
      const cameraOk = await startCamera();
      if (!cameraOk) {
        setSigning(false);
        return;
      }
    }

    const nextBackendState = await checkBackend();

    if (nextBackendState === 'missing') {
      setSigning(true);
      setLiveMessage(t.liveMissing);
      return;
    }

    setSigning(true);
    setLiveMessage(nextBackendState === 'ready' ? t.liveReady : t.liveOffline);
  };

  const stopSigning = () => {
    setSigning(false);
    setLiveMessage('');
  };

  const clearAll = () => {
    stopSigning();
    stopDemo();
    setResult(null);
    window.speechSynthesis?.cancel?.();
  };

  const runDemo = (preset) => {
    stopSigning();
    stopDemo();

    let index = 0;
    setDemoPresetId(preset.id);

    const applyStep = () => {
      const sign = preset.sequence[index];
      const confidence = Math.max(92, 98 - index);
      setResult({
        sign,
        confidence,
        mode: 'demo',
        demoWord: preset.word,
        step: index + 1,
        totalSteps: preset.sequence.length,
      });

      if (index === preset.sequence.length - 1) {
        window.clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
        window.setTimeout(() => speakText(preset.word), 300);
        return;
      }

      index += 1;
    };

    applyStep();
    demoTimerRef.current = window.setInterval(applyStep, 1000);
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { borderColor: theme.border, backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: theme.accentABg, borderColor: theme.border }]}>
            <Text style={[styles.logoMarkText, { color: theme.accentA }]}>AI</Text>
          </View>
          <View>
            <Text style={[styles.logoName, { color: theme.text }]}>ISL Bridge</Text>
            <Text style={[styles.logoSub, { color: theme.subtext }]}>{t.browserNote}</Text>
          </View>
        </View>

        <View style={styles.topButtons}>
          <TouchableOpacity
            style={[styles.smallBtn, { borderColor: theme.border, backgroundColor: theme.bg }]}
            onPress={() => setIsDark((current) => !current)}>
            <Text style={[styles.smallBtnText, { color: theme.text }]}>{isDark ? 'Light' : 'Dark'} Theme</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, { borderColor: theme.accentA, backgroundColor: theme.bg }]}
            onPress={() => setLang((current) => (current === 'en' ? 'hi' : 'en'))}>
            <Text style={[styles.smallBtnText, { color: theme.accentA }]}>{lang === 'en' ? 'Hindi' : 'English'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainGrid}>
        <View style={styles.leftColumn}>
          <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.heroEyebrow, { color: theme.accentA }]}>Mode A</Text>
            <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>{t.subtitle}</Text>
          </View>

          <View style={[styles.cameraCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={[styles.cameraBadge, { backgroundColor: theme.bg }]}>
              <Text style={[styles.cameraBadgeText, { color: cameraState === 'ready' ? theme.accentA : theme.subtext }]}>
                {cameraState === 'ready' ? t.cameraReady : cameraState === 'blocked' ? t.cameraBlocked : t.cameraWaiting}
              </Text>
            </View>

            <div style={videoShellStyle(theme)}>
              <video ref={videoRef} playsInline muted autoPlay style={videoStyle} />
              {!cameraStarted && (
                <div style={videoOverlayStyle(theme)}>
                  <div style={videoOverlayCardStyle(theme)}>
                    <div style={cameraIconStyle}>CAM</div>
                    <div style={cameraOverlayTextStyle(theme)}>
                      {cameraState === 'blocked' ? t.cameraBlocked : t.cameraWaiting}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: cameraStarted ? theme.card : theme.accentA, borderColor: theme.accentA }]}
                onPress={cameraStarted ? stopCamera : startCamera}>
                <Text style={[styles.primaryBtnText, { color: cameraStarted ? theme.accentA : '#FFFFFF' }]}>
                  {cameraStarted ? t.stopCamera : t.startCamera}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: signing ? theme.card : theme.accentB, borderColor: theme.accentB }]}
                onPress={signing ? stopSigning : startSigning}>
                <Text style={[styles.primaryBtnText, { color: signing ? theme.accentB : '#FFFFFF' }]}>
                  {signing ? t.stopSigning : t.startSigning}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={clearAll}>
                <Text style={[styles.clearBtnText, { color: theme.text }]}>{t.clear}</Text>
              </TouchableOpacity>
            </View>

            {liveMessage ? (
              <Text style={[styles.liveNote, { color: theme.subtext }]}>{liveMessage}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={[styles.sideCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardLabel, { color: theme.subtext }]}>System Status</Text>
            <Text style={[styles.sideStatus, { color: cameraState === 'ready' ? theme.accentA : theme.subtext }]}>
              Camera: {cameraState === 'ready' ? t.cameraReady : cameraState === 'blocked' ? t.cameraBlocked : t.cameraWaiting}
            </Text>
            <Text style={[styles.sideStatus, { color: backendState === 'ready' ? theme.accentA : theme.subtext }]}>
              Backend: {statusText}
            </Text>
            <Text style={[styles.sideNote, { color: theme.subtext }]}>Live browser mode is simplified so the demo stays responsive and clickable.</Text>
          </View>

          <View style={[styles.sideCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardLabel, { color: theme.subtext }]}>{t.demoTitle}</Text>
            <Text style={[styles.sideNote, { color: theme.subtext }]}>{t.demoHint}</Text>
            <View style={styles.demoGrid}>
              {DEMO_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.demoBtn,
                    {
                      borderColor: demoPresetId === preset.id ? theme.accentA : theme.border,
                      backgroundColor: demoPresetId === preset.id ? theme.accentABg : theme.bg,
                    },
                  ]}
                  onPress={() => runDemo(preset)}>
                  <Text style={[styles.demoBtnText, { color: demoPresetId === preset.id ? theme.accentA : theme.text }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.sideCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardLabel, { color: theme.subtext }]}>{t.outputLabel}</Text>
            {result ? (
              <>
                <Text style={[styles.outputText, { color: theme.text }]}>
                  {lang === 'hi' ? (SIGN_TO_HINDI[result.sign] || result.sign) : result.sign}
                </Text>
                {result.demoWord && (
                  <Text style={[styles.sideNote, { color: theme.subtext }]}>
                    {t.demoWord}: {result.demoWord} ({result.step}/{result.totalSteps})
                  </Text>
                )}
                <View style={styles.metaRow}>
                  <View style={[styles.metaBadge, { borderColor: theme.accentA, backgroundColor: theme.accentABg }]}>
                    <Text style={[styles.metaBadgeText, { color: theme.accentA }]}>
                      {t.confidence}: {result.confidence}%
                    </Text>
                  </View>
                  <View style={[styles.metaBadge, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                    <Text style={[styles.metaBadgeText, { color: theme.subtext }]}>
                      {result.mode === 'demo' ? 'Demo' : 'Preview'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.speakBtn, { borderColor: theme.accentA, backgroundColor: theme.accentABg }]}
                  onPress={() => speakText(result.demoWord || result.sign)}>
                  <Text style={[styles.speakBtnText, { color: theme.accentA }]}>Speak</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={[styles.sideNote, { color: theme.subtext }]}>{t.outputPlaceholder}</Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function videoShellStyle(theme) {
  return {
    position: 'relative',
    width: '100%',
    minHeight: '360px',
    borderRadius: '26px',
    overflow: 'hidden',
    border: `1px solid ${theme.border}`,
    background: theme.bg,
  };
}

const videoStyle = {
  width: '100%',
  minHeight: '360px',
  objectFit: 'cover',
  display: 'block',
  transform: 'scaleX(-1)',
};

function videoOverlayStyle(theme) {
  return {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.bg,
  };
}

function videoOverlayCardStyle(theme) {
  return {
    width: '220px',
    height: '220px',
    borderRadius: '28px',
    border: `1px solid ${theme.border}`,
    background: theme.card,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '12px',
  };
}

const cameraIconStyle = {
  fontFamily: WEB_DISPLAY_FONT,
  fontSize: '42px',
  fontWeight: 800,
};

function cameraOverlayTextStyle(theme) {
  return {
    fontFamily: WEB_FONT_FAMILY,
    fontSize: '14px',
    color: theme.subtext,
    textAlign: 'center',
    padding: '0 16px',
  };
}

const styles = StyleSheet.create({
  root: {
    padding: 18,
    gap: 18,
  },
  topBar: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: WEB_DISPLAY_FONT,
  },
  logoName: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: WEB_DISPLAY_FONT,
  },
  logoSub: {
    fontSize: 12,
    fontFamily: WEB_FONT_FAMILY,
  },
  topButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  smallBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    cursor: 'pointer',
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  leftColumn: {
    flex: 1.25,
    minWidth: 320,
    gap: 18,
  },
  rightColumn: {
    flex: 0.85,
    minWidth: 300,
    gap: 18,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 8,
    fontFamily: WEB_FONT_FAMILY,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: WEB_DISPLAY_FONT,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: WEB_FONT_FAMILY,
  },
  cameraCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
  },
  cameraBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  cameraBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    cursor: 'pointer',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  clearBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    cursor: 'pointer',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  liveNote: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    fontFamily: WEB_FONT_FAMILY,
  },
  sideCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: WEB_FONT_FAMILY,
  },
  sideStatus: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: WEB_FONT_FAMILY,
  },
  sideNote: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: WEB_FONT_FAMILY,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  demoBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 74,
    alignItems: 'center',
    cursor: 'pointer',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  outputText: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 10,
    fontFamily: WEB_DISPLAY_FONT,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 14,
  },
  metaBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  speakBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginTop: 14,
    cursor: 'pointer',
  },
  speakBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
});
