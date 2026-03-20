import { useContext, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppContext } from '../AppContext';
import { WEB_DISPLAY_FONT, WEB_FONT_FAMILY } from '../design';

const LANG = {
  en: {
    team: 'TEAM ALPHA',
    welcome: 'Who are you?',
    subtitle: 'Choose the communication role that fits you best. The app will open in that mode and only ask for the permissions needed for it.',
    deafTitle: 'Deaf / Sign User',
    deafDesc: 'Use sign-to-speech so your signs can be spoken for a hearing person.',
    hearingTitle: 'Hearing / Speaker',
    hearingDesc: 'Use speech-to-text so your spoken words appear for a deaf person to read.',
    bothTitle: 'Both',
    bothDesc: 'Keep both modes available and switch during the conversation.',
    continueBtn: 'Continue',
    selectMode: 'Select your role to continue',
  },
  hi: {
    team: 'TEAM ALPHA',
    welcome: 'Aap kaun hain?',
    subtitle: 'Apni communication role chunen. App ussi ke hisaab se mode set karega aur sirf zaroori permissions maangega.',
    deafTitle: 'Badhir / Sign User',
    deafDesc: 'Sign-to-speech mode use karein taaki aapke signs hearing user ke liye bole ja saken.',
    hearingTitle: 'Hearing / Speaker',
    hearingDesc: 'Speech-to-text mode use karein taaki aapki awaaz text ban kar saamne dikhe.',
    bothTitle: 'Dono',
    bothDesc: 'Dono modes available rakhein aur zarurat par switch karein.',
    continueBtn: 'Aage badhein',
    selectMode: 'Aage badhne ke liye role chunen',
  },
};

export default function OnboardingScreen({ navigation }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const { theme, lang } = useContext(AppContext);
  const t = LANG[lang];

  const modes = [
    {
      id: 'A',
      badge: 'A',
      title: t.deafTitle,
      desc: t.deafDesc,
      accent: theme.accentA,
      accentBg: theme.accentABg,
      screen: 'ModeA',
    },
    {
      id: 'B',
      badge: 'B',
      title: t.hearingTitle,
      desc: t.hearingDesc,
      accent: theme.accentB,
      accentBg: theme.accentBBg,
      screen: 'ModeB',
    },
    {
      id: 'BOTH',
      badge: 'AB',
      title: t.bothTitle,
      desc: t.bothDesc,
      accent: theme.accentC,
      accentBg: theme.accentCBg,
      screen: 'ModeA',
    },
  ];

  const handleContinue = () => {
    if (!selectedMode) {
      return;
    }

    const mode = modes.find((item) => item.id === selectedMode);
    if (Platform.OS === 'web') {
      navigation.navigate('Main', {
        screen: mode.screen,
        mode: selectedMode,
      });
      return;
    }

    navigation.navigate('Permission', {
      targetScreen: 'Main',
      mode: selectedMode,
      initialTab: mode.screen,
    });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.orbA, { backgroundColor: theme.accentA + '18' }]} />
      <View style={[styles.orbB, { backgroundColor: theme.accentB + '16' }]} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.team, { color: theme.accentA }]}>{t.team}</Text>
          <Text style={[styles.welcome, { color: theme.text }]}>{t.welcome}</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>{t.subtitle}</Text>
        </View>

        {modes.map((mode) => {
          const selected = selectedMode === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              onPress={() => setSelectedMode(mode.id)}
              style={[
                styles.modeCard,
                {
                  backgroundColor: theme.card,
                  borderColor: selected ? mode.accent : theme.border,
                  borderWidth: selected ? 2 : 1,
                },
              ]}>
              <View style={[styles.badge, { backgroundColor: mode.accentBg, borderColor: mode.accent + '40' }]}>
                <Text style={[styles.badgeText, { color: mode.accent }]}>{mode.badge}</Text>
              </View>

              <View style={styles.modeContent}>
                <Text style={[styles.modeTitle, { color: selected ? mode.accent : theme.text }]}>{mode.title}</Text>
                <Text style={[styles.modeDesc, { color: theme.subtext }]}>{mode.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.continueBtn,
            {
              backgroundColor: selectedMode ? theme.accentA : theme.card,
              borderColor: selectedMode ? theme.accentA : theme.border,
            },
          ]}
          onPress={handleContinue}>
          <Text style={[styles.continueBtnText, { color: selectedMode ? theme.bg : theme.subtext }]}>
            {selectedMode ? t.continueBtn : t.selectMode}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  orbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    right: -90,
  },
  orbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: 100,
    left: -80,
  },
  scroll: { padding: 20, paddingBottom: 40 },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 34,
    elevation: 8,
  },
  team: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: 12,
    fontFamily: WEB_FONT_FAMILY,
  },
  welcome: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: WEB_DISPLAY_FONT,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: WEB_FONT_FAMILY,
  },
  modeCard: {
    borderRadius: 26,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#08121C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: WEB_DISPLAY_FONT,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: WEB_DISPLAY_FONT,
  },
  modeDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: WEB_FONT_FAMILY,
  },
  continueBtn: {
    borderRadius: 999,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
    shadowColor: '#08121C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
});
