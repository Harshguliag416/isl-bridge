import { useContext, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../AppContext';
import { WEB_DISPLAY_FONT, WEB_FONT_FAMILY } from '../design';
import ModeAScreen from './ModeAScreen';
import ModeAWebScreen from './ModeAWebScreen';
import ModeBScreen from './ModeBScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  ModeA: 'A',
  ModeB: 'B',
};

function WebModeSwitcher({ initialTab }) {
  const { theme } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState(initialTab);
  const ActiveComponent = activeTab === 'ModeB' ? ModeBScreen : ModeAWebScreen;

  useEffect(() => {
    const handleMessage = (event) => {
      const nextMode = event?.data?.mode;
      if (event?.data?.type === 'isl-bridge-switch-mode' && (nextMode === 'ModeA' || nextMode === 'ModeB')) {
        setActiveTab(nextMode);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }

    return undefined;
  }, []);

  return (
    <View style={[styles.webRoot, { backgroundColor: theme.bg }]}>
      <View style={[styles.webHero, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.webHeroCopy}>
          <Text style={[styles.webEyebrow, { color: theme.accentA }]}>Real-Time Sign Language Translator</Text>
          <Text style={[styles.webTitle, { color: theme.text }]}>ISL Bridge</Text>
          <Text style={[styles.webSubtitle, { color: theme.subtext }]}>
            One browser app for sign-to-text, sign-to-speech, and speech-to-text communication.
          </Text>
        </View>

        <View style={[styles.webModeRail, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {[
            { id: 'ModeA', title: 'Mute -> Hearing', accent: theme.accentA },
            { id: 'ModeB', title: 'Hearing -> Deaf', accent: theme.accentB },
          ].map((item) => {
            const selected = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.webSwitcherButton,
                  {
                    backgroundColor: selected ? theme.text : theme.card,
                    borderColor: selected ? theme.text : theme.border,
                  },
                ]}
                onPress={() => setActiveTab(item.id)}>
                <View style={[styles.modeBar, { backgroundColor: item.accent }]} />
                <Text
                  style={[
                    styles.webSwitcherButtonText,
                    { color: selected ? theme.card : theme.text },
                  ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.webContent}>
        <ActiveComponent />
      </View>
    </View>
  );
}

export default function MainTabs({ route }) {
  const { theme } = useContext(AppContext);
  const initialTab = route.params?.screen === 'ModeB' ? 'ModeB' : 'ModeA';
  const ModeAComponent = Platform.OS === 'web' ? ModeAWebScreen : ModeAScreen;

  if (Platform.OS === 'web') {
    return <WebModeSwitcher initialTab={initialTab} />;
  }

  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      screenOptions={({ route: currentRoute }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <Text style={{ fontSize: focused ? 26 : 22, color, marginTop: 6, fontFamily: WEB_DISPLAY_FONT }}>{ICONS[currentRoute.name]}</Text>
        ),
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          fontFamily: WEB_FONT_FAMILY,
        },
      })}>
      <Tab.Screen name="ModeA" component={ModeAComponent} options={{ title: 'Sign to Speech' }} />
      <Tab.Screen name="ModeB" component={ModeBScreen} options={{ title: 'Speech to Text' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    padding: 18,
    gap: 18,
  },
  webHero: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 22,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
    gap: 18,
  },
  webHeroCopy: {
    gap: 8,
  },
  webEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontFamily: WEB_FONT_FAMILY,
  },
  webTitle: {
    fontSize: 40,
    fontWeight: '800',
    fontFamily: WEB_DISPLAY_FONT,
  },
  webSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 680,
    fontFamily: WEB_FONT_FAMILY,
  },
  webModeRail: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: 28,
    borderWidth: 1,
  },
  webSwitcherButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  modeBar: {
    width: '100%',
    height: 8,
    borderRadius: 999,
  },
  webSwitcherButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: WEB_FONT_FAMILY,
  },
  webContent: {
    flex: 1,
    minHeight: 0,
  },
});
