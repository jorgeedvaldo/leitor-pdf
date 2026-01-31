import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import PdfListScreen from '../screens/PdfListScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import InfoScreen from '../screens/InfoScreen';
import { theme } from '../utils/theme';

const Stack = createStackNavigator();
export const navRef = createNavigationContainerRef();

export default function AppNavigator() {
    return (
        <NavigationContainer ref={navRef}>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.colors.primary,
                    },
                    headerTintColor: theme.colors.white,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="PdfList"
                    component={PdfListScreen}
                    options={({ route }) => ({ title: route.params?.title || 'Arquivos' })}
                />
                <Stack.Screen
                    name="PdfViewer"
                    component={PdfViewerScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Info"
                    component={InfoScreen}
                    options={{ title: 'Informações' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
