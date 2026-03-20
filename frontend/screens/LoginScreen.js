import { useContext, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../AppContext';
import { WEB_DISPLAY_FONT, WEB_FONT_FAMILY } from '../design';

const COPY = {
  en: {
    eyebrow: 'TEAM ALPHA',
    title: 'Choose your preferred language',
    subtitle: 'We will use this language for the next questions and setup.',
    continue: 'Continue',
    choose: 'Select a language to continue',
  },
  hi: {
    eyebrow: 'TEAM ALPHA',
    title: 'Apni pasand ki bhasha chunen',
    subtitle: 'Agale sawaal aur setup isi bhasha mein dikhaye jayenge.',
    continue: 'Aage badhein',
    choose: 'Aage badhne ke liye bhasha chunen',
  },
};

const LANGUAGE_OPTIONS = [
  { id: 'en', title: 'English', subtitle: 'Use English across the app.' },
  { id: 'hi', title: 'Hindi', subtitle: 'App Hindi mein chalega.' },
];

export default function LoginScreen({ navigation }) {
  const { theme, setLang } = useContext(AppContext);
  const [selectedLang, setSelectedLang] = useState(null);
  const t = COPY[selectedLang || 'en'];

  const handleContinue = () => {
    if (!selectedLang) {
      return;
    }

    setLang(selectedLang);
    navigation.navigate('Onboarding');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.orbA, { backgroundColor: theme.accentA + '20' }]} />
      <View style={[styles.orbB, { backgroundColor: theme.accentC + '18' }]} />

      <View style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.eyebrow, { color: theme.accentA }]}>{t.eyebrow}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>{t.subtitle}</Text>
        </View>

        <View style={styles.options}>
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = selectedLang === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedLang(option.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: selected ? theme.accentA : theme.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}>
                <Text style={[styles.optionTitle, { color: selected ? theme.accentA : theme.text }]}>{option.title}</Text>
                <Text style={[styles.optionSubtitle, { color: theme.subtext }]}>{option.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: selectedLang ? theme.accentA : theme.card,
            borderColor: selectedLang ? theme.accentA : theme.border,
          },
        ]}
        onPress={handleContinue}>
        <Text style={[styles.buttonText, { color: selectedLang ? theme.bg : theme.subtext }]}>
          {selectedLang ? t.continue : t.choose}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  orbA: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -40,
    left: -70,
  },
  orbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: 60,
    right: -80,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'left',
    fontFamily: WEB_FONT_FAMILY,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'left',
    marginBottom: 10,
    fontFamily: WEB_DISPLAY_FONT,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: WEB_FONT_FAMILY,
  },
  options: {
    gap: 14,
  },
  optionCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#08121C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: WEB_DISPLAY_FONT,
  },
  optionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: WEB_FONT_FAMILY,
  },
  button: {
    margin: 24,
    borderRadius: 999,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#08121C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
});
