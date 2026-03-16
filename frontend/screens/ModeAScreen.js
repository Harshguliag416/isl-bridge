import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';

// ── Backend URL ────────────────────────────────────────────
const BACKEND_URL = 'http://192.168.0.242:5000';

// ── translations ───────────────────────────────────────────
const LANG = {
  en: {
    title:       'Deaf → Hearing',
    subtitle:    'Sign in front of camera — AI speaks it out',
    startBtn:    'Start Signing',
    stopBtn:     'Stop',
    clearBtn:    'Clear',
    outputLabel: 'DETECTED SIGN',
    placeholder: 'Sign output will appear here...',
    detecting:   '🟢 Detecting sign...',
    ready:       '⚪ Ready — press Start Signing',
    confidence:  'Confidence',
    speakBtn:    'Speak Again',
    allowCamera: 'Tap to allow camera',
    permHint:    'Camera permission required for sign detection',
    switchMode:  '↔ Switch to Voice Mode',
    connecting:  '🔄 Connecting to AI...',
    noHand:      '✋ Show your hand clearly',
    mode:        'Mode',
  },
  hi: {
    title:       'बधिर → सुनने वाला',
    subtitle:    'कैमरे के सामने साइन करें — AI बोलेगा',
    startBtn:    'साइन करें',
    stopBtn:     'रोकें',
    clearBtn:    'साफ़ करें',
    outputLabel: 'पहचाना गया संकेत',
    placeholder: 'साइन का अनुवाद यहाँ दिखेगा...',
    detecting:   '🟢 संकेत पहचान रहे हैं...',
    ready:       '⚪ तैयार — साइन करें दबाएँ',
    confidence:  'सटीकता',
    speakBtn:    'दोबारा बोलें',
    allowCamera: 'कैमरा अनुमति दें',
    permHint:    'साइन पहचान के लिए कैमरा जरूरी है',
    switchMode:  '↔ वॉयस मोड पर जाएं',
    connecting:  '🔄 AI से जोड़ रहे हैं...',
    noHand:      '✋ हाथ साफ दिखाएं',
    mode:        'मोड',
  },
};

// ── ISL sign to Hindi translation ─────────────────────────
const SIGN_TO_HINDI = {
  A: 'अ', B: 'ब', C: 'क', D: 'ड', E: 'ए',
  F: 'फ', G: 'ग', H: 'ह', I: 'इ', J: 'ज',
  K: 'क', L: 'ल', M: 'म', N: 'न', O: 'ओ',
  P: 'प', Q: 'क्यू', R: 'र', S: 'स', T: 'त',
  U: 'यू', V: 'व', W: 'व', X: 'एक्स', Y: 'य',
  Z: 'ज़', del: 'मिटाएं', nothing: 'कुछ नहीं', space: 'स्पेस'
};

export default function ModeAScreen({
  navigation,
  theme,
  lang,
  isDark,
  setIsDark,
  setLang,
}) {
  const t = LANG[lang];
  const [active, setActive]         = useState(false);
  const [result, setResult]         = useState(null);
  const [status, setStatus]         = useState('ready');
  const [backendOk, setBackendOk]   = useState(false);
  const intervalRef                 = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  // ── Check backend on mount ─────────────────────────────
  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      setBackendOk(data.model === 'loaded');
    } catch {
      setBackendOk(false);
    }
  };

  const speakText = (text) => {
    Speech.stop();
    Speech.speak(text, {
      language: lang === 'hi' ? 'hi-IN' : 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  // ── Simulate landmark extraction + call backend ────────
  const startSigning = () => {
    setActive(true);
    setStatus('detecting');
    setResult(null);
    let i = 0;

    intervalRef.current = setInterval(async () => {
      try {
        // Simulate landmarks (63 random values between 0-1)
        // In real app these come from MediaPipe
        const fakeLandmarks = Array.from(
          { length: 63 },
          () => Math.random()
        );

        const res = await fetch(`${BACKEND_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarks: fakeLandmarks }),
          signal: AbortSignal.timeout(2000),
        });

        const data = await res.json();

        setResult({
          sign:       data.sign,
          confidence: data.confidence,
          mode:       data.mode,
          hindi:      SIGN_TO_HINDI[data.sign] || data.sign,
        });

        if (data.confidence > 80) {
          speakText(lang === 'hi'
            ? (SIGN_TO_HINDI[data.sign] || data.sign)
            : data.sign
          );
        }

      } catch (e) {
        setStatus('noHand');
      }
      i++;
    }, 2000);
  };

  const stop = () => {
    setActive(false);
    setStatus('ready');
    if (intervalRef.current) clearInterval(intervalRef.current);
    Speech.stop();
  };

  const clear = () => {
    stop();
    setResult(null);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.border, backgroundColor: theme.header }]}>
        <View style={styles.logoRow}>
          <Text style={[styles.logoAccent, { color: theme.accentA }]}>⚡</Text>
          <Text style={[styles.logoName, { color: theme.headerText }]}>ISL Bridge</Text>
          <View style={[styles.modeBadge, { backgroundColor: theme.accentABg, borderColor: theme.accentA + '40' }]}>
            <Text style={[styles.modeBadgeText, { color: theme.accentA }]}>Mode A</Text>
          </View>
          {/* Backend status dot */}
          <View style={[styles.backendDot, { backgroundColor: backendOk ? '#00F5D4' : '#F72585' }]} />
        </View>
        <View style={styles.topBtns}>
          <TouchableOpacity
            style={[styles.topBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => setIsDark(d => !d)}>
            <Text>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.topBtn, { borderColor: theme.accentA, backgroundColor: theme.card }]}
            onPress={() => setLang(l => l === 'en' ? 'hi' : 'en')}>
            <Text style={[styles.topBtnText, { color: theme.accentA }]}>
              {lang === 'en' ? 'हि' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header card */}
        <View style={[styles.headerCard, {
          backgroundColor: theme.card,
          borderColor: theme.accentA + '40',
          borderLeftColor: theme.accentA
        }]}>
          <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>{t.subtitle}</Text>
          <Text style={[styles.backendStatus, { color: backendOk ? theme.accentA : '#F72585' }]}>
            {backendOk ? '● AI Model: Ready (96.19% accuracy)' : '● AI Model: Connecting...'}
          </Text>
        </View>

        {/* Status */}
        <Text style={[styles.status, { color: theme.subtext }]}>
          {active ? t.detecting : t.ready}
        </Text>

        {/* Camera */}
        {permission?.granted ? (
          <CameraView style={styles.cameraBox} facing="front">
            <View style={[styles.cameraTopBar, { backgroundColor: '#00000080' }]}>
              <Text style={[styles.cameraTopText, { color: theme.accentA }]}>
                {active ? '🟢 Live — Detecting' : '⚪ Preview — Position your hand'}
              </Text>
            </View>
            {/* Hand guide overlay */}
            <View style={styles.handGuide}>
              <View style={[styles.handBox, { borderColor: active ? theme.accentA : '#ffffff40' }]} />
            </View>
            {active && result && (
              <View style={[styles.cameraOverlay, { backgroundColor: '#00000090' }]}>
                <Text style={[styles.cameraSign, { color: theme.accentA }]}>{result.sign}</Text>
                <Text style={[styles.cameraConf, { color: '#ffffff' }]}>{result.confidence}%</Text>
              </View>
            )}
          </CameraView>
        ) : (
          <TouchableOpacity
            style={[styles.cameraBox, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={requestPermission}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={[styles.cameraText, { color: theme.subtext }]}>{t.allowCamera}</Text>
            <Text style={[styles.cameraHint, { color: theme.muted }]}>{t.permHint}</Text>
          </TouchableOpacity>
        )}

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, {
              backgroundColor: active ? theme.bg : theme.accentA,
              borderColor: theme.accentA,
              borderWidth: active ? 1.5 : 0,
            }]}
            onPress={active ? stop : startSigning}>
            <Text style={[styles.primaryBtnText, { color: active ? theme.accentA : theme.bg }]}>
              {active ? t.stopBtn : t.startBtn}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={clear}>
            <Text style={[styles.clearBtnText, { color: theme.subtext }]}>{t.clearBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Output card */}
        <View style={[styles.outputCard, {
          backgroundColor: theme.card,
          borderColor: result ? theme.accentA : theme.border,
        }]}>
          <Text style={[styles.outputLabel, { color: theme.subtext }]}>{t.outputLabel}</Text>

          {result ? (
            <>
              <Text style={[styles.outputText, { color: theme.text }]}>
                {lang === 'hi' ? result.hindi : result.sign}
              </Text>
              {lang === 'hi' && (
                <Text style={[styles.outputSub, { color: theme.subtext }]}>{result.sign}</Text>
              )}
              <View style={styles.confRow}>
                <Text style={[styles.confBadge, { color: theme.accentA, borderColor: theme.accentA + '40' }]}>
                  {t.confidence}: {result.confidence}%
                </Text>
                <Text style={[styles.modeBadgeSmall, { color: theme.subtext, borderColor: theme.border }]}>
                  {result.mode === 'model' ? '🧠 AI' : '🎭 Demo'}
                </Text>
                <TouchableOpacity
                  style={[styles.speakBtn, { backgroundColor: theme.accentABg, borderColor: theme.accentA + '40' }]}
                  onPress={() => speakText(lang === 'hi' ? result.hindi : result.sign)}>
                  <Text style={[styles.speakBtnText, { color: theme.accentA }]}>
                    🔊 {t.speakBtn}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={[styles.placeholder, { color: theme.placeholder }]}>{t.placeholder}</Text>
          )}
        </View>

        {/* Switch mode */}
        <TouchableOpacity
          style={[styles.switchMode, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={() => navigation.navigate('ModeB')}>
          <Text style={[styles.switchModeText, { color: theme.subtext }]}>{t.switchMode}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1 },
  topBar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  logoRow:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoAccent:        { fontSize: 18 },
  logoName:          { fontSize: 15, fontWeight: 'bold' },
  modeBadge:         { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  modeBadgeText:     { fontSize: 10, fontWeight: 'bold' },
  backendDot:        { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  topBtns:           { flexDirection: 'row', gap: 8 },
  topBtn:            { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topBtnText:        { fontSize: 13, fontWeight: 'bold' },
  scroll:            { padding: 16, paddingBottom: 40 },
  headerCard:        { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderLeftWidth: 4 },
  title:             { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle:          { fontSize: 12, marginBottom: 6 },
  backendStatus:     { fontSize: 11, fontWeight: 'bold' },
  status:            { fontSize: 12, marginBottom: 12, marginLeft: 4 },
  cameraBox:         { borderRadius: 12, height: 280, marginBottom: 16, overflow: 'hidden', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cameraTopBar:      { position: 'absolute', top: 0, left: 0, right: 0, padding: 8 },
  cameraTopText:     { fontSize: 11, fontWeight: 'bold' },
  handGuide:         { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  handBox:           { width: 160, height: 200, borderWidth: 2, borderRadius: 12, borderStyle: 'dashed' },
  cameraOverlay:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, alignItems: 'center' },
  cameraSign:        { fontSize: 32, fontWeight: 'bold' },
  cameraConf:        { fontSize: 12 },
  cameraIcon:        { fontSize: 40, marginBottom: 8 },
  cameraText:        { fontSize: 14, marginBottom: 4 },
  cameraHint:        { fontSize: 11 },
  btnRow:            { flexDirection: 'row', gap: 12, marginBottom: 16 },
  primaryBtn:        { flex: 1, borderRadius: 10, padding: 15, alignItems: 'center' },
  primaryBtnText:    { fontSize: 15, fontWeight: 'bold' },
  clearBtn:          { borderRadius: 10, padding: 15, alignItems: 'center', borderWidth: 1, paddingHorizontal: 20 },
  clearBtnText:      { fontSize: 14 },
  outputCard:        { borderRadius: 12, padding: 20, borderWidth: 1, minHeight: 140, marginBottom: 16 },
  outputLabel:       { fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  outputText:        { fontSize: 48, fontWeight: 'bold', marginBottom: 6 },
  outputSub:         { fontSize: 14, marginBottom: 12 },
  placeholder:       { fontSize: 13, fontStyle: 'italic' },
  confRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  confBadge:         { fontSize: 11, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  modeBadgeSmall:    { fontSize: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  speakBtn:          { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  speakBtnText:      { fontSize: 11 },
  switchMode:        { borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1 },
  switchModeText:    { fontSize: 13 },
});