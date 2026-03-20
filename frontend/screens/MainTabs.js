import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useContext, useState } from 'react';
import { AppContext } from '../AppContext';
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

  return (
    <View style={[styles.webRoot, { backgroundColor: theme.bg }]}>
      <View style={[styles.webSwitcher, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.webSwitcherButton,
            {
              backgroundColor: activeTab === 'ModeA' ? `${theme.accentA}20` : theme.bg,
              borderColor: activeTab === 'ModeA' ? theme.accentA : theme.border,
            },
          ]}
          onPress={() => setActiveTab('ModeA')}>
          <Text
            style={[
              styles.webSwitcherButtonText,
              { color: activeTab === 'ModeA' ? theme.accentA : theme.subtext },
            ]}>
            Sign to Speech
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.webSwitcherButton,
            {
              backgroundColor: activeTab === 'ModeB' ? `${theme.accentB}20` : theme.bg,
              borderColor: activeTab === 'ModeB' ? theme.accentB : theme.border,
            },
          ]}
          onPress={() => setActiveTab('ModeB')}>
          <Text
            style={[
              styles.webSwitcherButtonText,
              { color: activeTab === 'ModeB' ? theme.accentB : theme.subtext },
            ]}>
            Speech to Text
          </Text>
        </TouchableOpacity>
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
          <Text style={{ fontSize: focused ? 28 : 24, color, marginTop: 5 }}>{ICONS[currentRoute.name]}</Text>
        ),
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          height: 65,
          paddingBottom: 8,
          paddingTop: 5,
        },
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 11,
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
  },
  webSwitcher: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  webSwitcherButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  webSwitcherButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  webContent: {
    flex: 1,
    minHeight: 0,
  },
});
