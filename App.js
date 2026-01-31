import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import AppNavigator, { navRef } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function App() {

  useEffect(() => {
    const handleDeepLink = async (event) => {
      let data = event.url;
      if (data) {
        if (data.startsWith('content://') || data.startsWith('file://')) {
          setTimeout(() => {
            if (navRef.current && navRef.current.isReady()) {
              navRef.current.navigate('PdfViewer', { uri: data, name: 'Documento Externo', fromIntent: true });
            }
          }, 1000); // Check if navigation is ready
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#E53935" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
