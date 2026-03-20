import { useContext, useEffect, useRef, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../AppContext';
import { WEB_DISPLAY_FONT, WEB_FONT_FAMILY } from '../design';

const DEMO_PHRASES = {
  en: [
    'Hello judges, welcome to ISL Bridge.',
    'This mode turns speech into readable text.',
    'Please allow microphone access in the browser.',
    'Thank you for watching our demo.',
  ],
  hi: [
    'Namaste judges, ISL Bridge mein aapka swagat hai.',
    'Yeh mode speech ko readable text mein badalta hai.',
    'Kripya browser mein microphone access allow karein.',
    'Hamare demo dekhne ke liye dhanyavaad.',
  ],
};

const LANG = {
  en: {
    title: 'Hearing -> Deaf',
    subtitle: 'Use the browser microphone for live speech-to-text, and keep the demo chips ready as a judge-safe fallback.',
    micReady: 'Microphone ready',
    micListening: 'Listening live',
    micBlocked: 'Microphone blocked',
    micUnsupported: 'Browser speech not supported',
    startMic: 'Start Microphone',
    stopMic: 'Stop Microphone',
    clear: 'Clear',
    outputLabel: 'Live Transcript',
    outputPlaceholder: 'Speech will appear here in large text.',
    demoTitle: 'Demo Phrases',
    demoHint: 'Use these presets when the room is noisy or you need a guaranteed demo flow.',
    fullscreen: 'Show Full Screen',
    closeFullscreen: 'Back',
    helper: 'Chrome and Edge usually give the most reliable speech recognition on web.',
  },
  hi: {
    title: 'Hearing -> Deaf',
    subtitle: 'Live speech-to-text ke liye browser microphone use karein, aur judge-safe fallback ke liye demo chips ready rakhein.',
    micReady: 'Microphone tayyar hai',
    micListening: 'Live sun rahe hain',
    micBlocked: 'Microphone blocked hai',
    micUnsupported: 'Browser speech supported nahin hai',
    startMic: 'Microphone Chalu Karein',
    stopMic: 'Microphone Rokein',
    clear: 'Saaf Karein',
    outputLabel: 'Live Transcript',
    outputPlaceholder: 'Speech ka text yahan bade font mein dikhai dega.',
    demoTitle: 'Demo Phrases',
    demoHint: 'Room noisy ho ya guaranteed demo flow chahiye ho to in presets ko use karein.',
    fullscreen: 'Full Screen Dikhayein',
    closeFullscreen: 'Wapas',
    helper: 'Web par Chrome aur Edge speech recognition ke liye sabse reliable rehte hain.',
  },
};

const WEB_SPEECH_ERRORS = {
  aborted: 'Listening stopped.',
  'audio-capture': 'No microphone was detected on this device.',
  network: 'A network error interrupted speech recognition.',
  'not-allowed': 'Microphone access was blocked. Please allow mic permission in your browser.',
  'service-not-allowed': 'Speech recognition is blocked in this browser.',
  'no-speech': 'No speech was detected. Keep speaking and the app will continue listening.',
};

const getBrowserSpeechRecognition = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export default function ModeBWebScreen() {
  const { theme, lang, isDark, setIsDark, setLang } = useContext(AppContext);
  const t = LANG[lang];
  const locale = lang === 'hi' ? 'hi-IN' : 'en-US';

  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const shouldRestartRef = useRef(false);

  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [micState, setMicState] = useState('ready');
  const [fullscreen, setFullscreen] = useState(false);
  const [demoPhrase, setDemoPhrase] = useState('');

  const speechSupported = Boolean(getBrowserSpeechRecognition());

  const clearRestartTimer = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const stopListening = () => {
    shouldRestartRef.current = false;
    clearRestartTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
      }
    }

    setIsRecording(false);
    setMicState('ready');
  };

  const ensureRecognition = () => {
    const RecognitionCtor = getBrowserSpeechRecognition();
    if (!RecognitionCtor) {
      return null;
    }

    if (!recognitionRef.current) {
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setMicState('listening');
        setSpeechError('');
      };

      recognition.onresult = (event) => {
        const nextTranscript = Array.from(event.results)
          .map((result) => result[0]?.transcript?.trim() || '')
          .filter(Boolean)
          .join(' ')
          .trim();

        setTranscript(nextTranscript);
        setDemoPhrase('');
      };

      recognition.onerror = (event) => {
        const nextError = WEB_SPEECH_ERRORS[event.error] || `Speech recognition error: ${event.error}`;
        setSpeechError(nextError);
        setIsRecording(false);
        setMicState(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'blocked' : 'ready');

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldRestartRef.current = false;
        }
      };

      recognition.onend = () => {
        if (shouldRestartRef.current) {
          clearRestartTimer();
          restartTimeoutRef.current = setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              const message = String(error?.message || error || '');
              if (!/already started/i.test(message)) {
                shouldRestartRef.current = false;
                setIsRecording(false);
                setMicState('ready');
                setSpeechError('Unable to restart the microphone automatically.');
              }
            }
          }, 250);
          return;
        }

        setIsRecording(false);
        setMicState('ready');
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.lang = locale;
    return recognitionRef.current;
  };

  const startListening = async () => {
    const recognition = ensureRecognition();
    if (!recognition) {
      setMicState('unsupported');
      setSpeechError(t.helper);
      return;
    }

    shouldRestartRef.current = true;
    setSpeechError('');
    setDemoPhrase('');

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }

      recognition.start();
    } catch (error) {
      const message = String(error?.message || error || '');
      shouldRestartRef.current = false;
      setIsRecording(false);
      setMicState(/not allowed|permission|denied/i.test(message) ? 'blocked' : 'ready');
      setSpeechError('Unable to start microphone. Please allow browser access and try again.');
    }
  };

  const clearAll = () => {
    stopListening();
    setTranscript('');
    setSpeechError('');
    setDemoPhrase('');
    setFullscreen(false);
  };

  const applyDemoPhrase = (phrase) => {
    stopListening();
    setTranscript(phrase);
    setDemoPhrase(phrase);
    setSpeechError('');
  };

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      clearRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
        }
      }
    };
  }, []);

  if (Platform.OS !== 'web') {
    return null;
  }

  const statusText =
    micState === 'listening'
      ? t.micListening
      : micState === 'blocked'
        ? t.micBlocked
        : micState === 'unsupported'
          ? t.micUnsupported
          : t.micReady;

  const statusColor =
    micState === 'listening'
      ? theme.accentB
      : micState === 'blocked' || micState === 'unsupported'
        ? '#F72585'
        : theme.subtext;

  if (fullscreen && transcript) {
    return (
      <SafeAreaView style={[styles.fullRoot, { backgroundColor: isDark ? '#02070D' : '#F8FBFC' }]}>
        <TouchableOpacity style={styles.fullClose} onPress={() => setFullscreen(false)}>
          <Text style={[styles.fullCloseText, { color: theme.subtext }]}>{t.closeFullscreen}</Text>
        </TouchableOpacity>
        <View style={styles.fullContent}>
          <Text style={[styles.fullText, { color: theme.text }]}>{transcript}</Text>
        </View>
        <TouchableOpacity
          style={[styles.fullClear, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={clearAll}>
          <Text style={[styles.fullClearText, { color: theme.subtext }]}>{t.clear}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBar, { borderColor: theme.border, backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: theme.accentBBg, borderColor: theme.border }]}>
            <Text style={[styles.logoMarkText, { color: theme.accentB }]}>STT</Text>
          </View>
          <View>
            <Text style={[styles.logoName, { color: theme.text }]}>ISL Bridge</Text>
            <Text style={[styles.logoSub, { color: theme.subtext }]}>{t.helper}</Text>
          </View>
        </View>

        <View style={styles.topButtons}>
          <TouchableOpacity
            style={[styles.smallBtn, { borderColor: theme.border, backgroundColor: theme.bg }]}
            onPress={() => setIsDark((current) => !current)}>
            <Text style={[styles.smallBtnText, { color: theme.text }]}>{isDark ? 'Light' : 'Dark'} Theme</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, { borderColor: theme.accentB, backgroundColor: theme.bg }]}
            onPress={() => setLang((current) => (current === 'en' ? 'hi' : 'en'))}>
            <Text style={[styles.smallBtnText, { color: theme.accentB }]}>{lang === 'en' ? 'Hindi' : 'English'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainGrid}>
        <View style={styles.leftColumn}>
          <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.heroEyebrow, { color: theme.accentB }]}>Mode B</Text>
            <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>{t.subtitle}</Text>
          </View>

          <View style={[styles.micCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={[styles.micBadge, { backgroundColor: theme.bg }]}>
              <Text style={[styles.micBadgeText, { color: statusColor }]}>{statusText}</Text>
            </View>

            <View
              style={[
                styles.micPanel,
                {
                  backgroundColor: isRecording ? theme.accentBBg : theme.bg,
                  borderColor: isRecording ? theme.accentB : theme.border,
                },
              ]}>
              <Text style={[styles.micPanelLabel, { color: isRecording ? theme.accentB : theme.subtext }]}>
                {isRecording ? 'LIVE' : 'MIC'}
              </Text>
              <Text style={[styles.micPanelText, { color: theme.text }]}>{statusText}</Text>
              <View style={styles.waveRow}>
                {[14, 24, 34, 24, 14, 24, 34, 24, 14].map((height, index) => (
                  <View
                    key={index}
                    style={[
                      styles.wave,
                      {
                        height,
                        backgroundColor: isRecording ? theme.accentB : theme.border,
                        opacity: isRecording ? 1 : 0.6,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: isRecording ? theme.card : theme.accentB, borderColor: theme.accentB }]}
                onPress={isRecording ? stopListening : startListening}>
                <Text style={[styles.primaryBtnText, { color: isRecording ? theme.accentB : '#FFFFFF' }]}>
                  {isRecording ? t.stopMic : t.startMic}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                onPress={clearAll}>
                <Text style={[styles.clearBtnText, { color: theme.text }]}>{t.clear}</Text>
              </TouchableOpacity>
            </View>

            {!!speechError && <Text style={[styles.helperText, { color: statusColor }]}>{speechError}</Text>}
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={[styles.sideCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardLabel, { color: theme.subtext }]}>{t.demoTitle}</Text>
            <Text style={[styles.sideNote, { color: theme.subtext }]}>{t.demoHint}</Text>
            <View style={styles.demoGrid}>
              {DEMO_PHRASES[lang].map((phrase) => (
                <TouchableOpacity
                  key={phrase}
                  style={[
                    styles.demoBtn,
                    {
                      borderColor: demoPhrase === phrase ? theme.accentB : theme.border,
                      backgroundColor: demoPhrase === phrase ? theme.accentBBg : theme.bg,
                    },
                  ]}
                  onPress={() => applyDemoPhrase(phrase)}>
                  <Text style={[styles.demoBtnText, { color: demoPhrase === phrase ? theme.accentB : theme.text }]}>
                    {phrase}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.sideCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardLabel, { color: theme.subtext }]}>{t.outputLabel}</Text>
            {transcript ? (
              <>
                <Text style={[styles.outputText, { color: theme.text }]}>{transcript}</Text>
                <TouchableOpacity
                  style={[styles.showBtn, { borderColor: theme.accentB, backgroundColor: theme.accentBBg }]}
                  onPress={() => setFullscreen(true)}>
                  <Text style={[styles.showBtnText, { color: theme.accentB }]}>{t.fullscreen}</Text>
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
    fontSize: 16,
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
    flex: 1.1,
    minWidth: 320,
    gap: 18,
  },
  rightColumn: {
    flex: 0.9,
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
  micCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
  },
  micBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  micBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  micPanel: {
    borderWidth: 1,
    borderRadius: 26,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  micPanelLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: WEB_FONT_FAMILY,
  },
  micPanelText: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: WEB_DISPLAY_FONT,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  wave: {
    width: 6,
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flex: 1,
    minWidth: 180,
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
  helperText: {
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
  sideNote: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: WEB_FONT_FAMILY,
  },
  demoGrid: {
    gap: 10,
    marginTop: 12,
  },
  demoBtn: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    cursor: 'pointer',
  },
  demoBtnText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: WEB_FONT_FAMILY,
  },
  outputText: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 44,
    marginBottom: 14,
    fontFamily: WEB_DISPLAY_FONT,
  },
  showBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    cursor: 'pointer',
  },
  showBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  fullRoot: {
    flex: 1,
  },
  fullClose: {
    padding: 20,
  },
  fullCloseText: {
    fontSize: 14,
    fontFamily: WEB_FONT_FAMILY,
  },
  fullContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fullText: {
    fontSize: 52,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 68,
    fontFamily: WEB_DISPLAY_FONT,
  },
  fullClear: {
    margin: 24,
    borderRadius: 999,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    cursor: 'pointer',
  },
  fullClearText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
});
