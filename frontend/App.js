import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PermissionScreen from './screens/PermissionScreen';
import LoginScreen from './screens/LoginScreen';
import MainTabs from './screens/MainTabs';
import { AppContext } from './AppContext';
import { THEME, WEB_FONT_FAMILY } from './design';

const Stack = createNativeStackNavigator();

function ensureWebFonts() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  if (!document.getElementById('isl-bridge-fonts')) {
    const preconnectA = document.createElement('link');
    preconnectA.rel = 'preconnect';
    preconnectA.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnectA);

    const preconnectB = document.createElement('link');
    preconnectB.rel = 'preconnect';
    preconnectB.href = 'https://fonts.gstatic.com';
    preconnectB.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectB);

    const fontLink = document.createElement('link');
    fontLink.id = 'isl-bridge-fonts';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap';
    document.head.appendChild(fontLink);
  }
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState('en');

  const theme = isDark ? THEME.dark : THEME.light;

  useEffect(() => {
    ensureWebFonts();

    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    document.body.style.margin = '0';
    document.body.style.fontFamily = WEB_FONT_FAMILY;
    document.body.style.background = isDark
      ? 'radial-gradient(circle at top left, rgba(34, 199, 201, 0.14), transparent 30%), linear-gradient(180deg, #08121C, #0D1A26)'
      : 'radial-gradient(circle at top left, rgba(14, 165, 167, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 24%), linear-gradient(180deg, #F6FBFC, #EDF5F6)';
  }, [isDark]);

  const sharedProps = {
    isDark,
    setIsDark,
    lang,
    setLang,
    theme,
  };

  return (
    <SafeAreaProvider>
      <AppContext.Provider value={sharedProps}>
        <NavigationContainer>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Permission" component={PermissionScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}
