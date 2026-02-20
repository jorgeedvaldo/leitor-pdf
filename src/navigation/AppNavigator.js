import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Folder, Star, Info } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import PdfListScreen from '../screens/PdfListScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import InfoScreen from '../screens/InfoScreen';
import { theme } from '../utils/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
export const navRef = createNavigationContainerRef();

function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    if (route.name === 'HomeTab') return <Home color={color} size={size} />;
                    if (route.name === 'FilesTab') return <Folder color={color} size={size} />;
                    if (route.name === 'FavoritesTab') return <Star color={color} size={size} />;
                    if (route.name === 'InfoTab') return <Info color={color} size={size} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    paddingBottom: 5,
                    height: 60,
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{ title: 'Home', headerShown: false }}
            />
            <Tab.Screen
                name="FilesTab"
                component={PdfListScreen}
                initialParams={{ type: 'all', title: 'Todos os Ficheiros' }}
                options={{ title: 'Files' }}
            />
            <Tab.Screen
                name="FavoritesTab"
                component={PdfListScreen}
                initialParams={{ type: 'favorites', title: 'Favoritos' }}
                options={{ title: 'Favoritos' }}
            />
            <Tab.Screen
                name="InfoTab"
                component={InfoScreen}
                options={{ title: 'Info' }}
            />
        </Tab.Navigator>
    );
}

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
                    name="MainTabs"
                    component={MainTabNavigator}
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}
