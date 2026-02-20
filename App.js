import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import AppNavigator, { navRef } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function App() {

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          if (Platform.Version >= 30) {
            // Android 11+ Check if we have permission by reading Download folder
            try {
              await ReactNativeBlobUtil.fs.ls('/storage/emulated/0/Download');
            } catch (e) {
              Alert.alert(
                "Permissão de Armazenamento",
                "Para ler os arquivos PDF no seu dispositivo, o aplicativo precisa da permissão de 'Acesso a todos os arquivos'.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Conceder Permissão", onPress: () => {
                      IntentLauncher.startActivityAsync('android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION', {
                        data: `package:com.leitorpdf.app`
                      });
                    }
                  }
                ]
              );
            }
          } else {
            // Android 10 and below
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            if (!hasPermission) {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                {
                  title: "Permissão de Armazenamento",
                  message: "O aplicativo precisa acessar seus arquivos para encontrar PDFs.",
                  buttonNeutral: "Mais tarde",
                  buttonNegative: "Cancelar",
                  buttonPositive: "OK"
                }
              );
            }
          }
        }
      } catch (err) {
        console.warn(err);
      }
    };

    // Slight delay so the prompt opens after splash screen
    setTimeout(() => {
      requestPermissions();
    }, 1500);

    const handleDeepLink = async (event) => {
      let data = event.url;
      if (data && (data.startsWith('content://') || data.startsWith('file://'))) {
        // Function to attempt navigation
        const attemptNavigation = (retries = 0) => {
          // Limit retries to avoid infinite loops (e.g. 20 retries * 100ms = 2 seconds)
          if (retries > 20) return;

          if (navRef.current && navRef.current.isReady()) {
            navRef.current.navigate('PdfViewer', { uri: data, name: 'Documento Externo', fromIntent: true });
          } else {
            // Retry after 100ms if navigation is not ready
            setTimeout(() => attemptNavigation(retries + 1), 100);
          }
        };

        attemptNavigation();
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
