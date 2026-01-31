import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Star, FileText, Info, X } from 'lucide-react-native';
import { theme } from '../utils/theme';

export default function HomeScreen({ navigation }) {

    const handleCloseApp = () => {
        BackHandler.exitApp();
    };

    const menuItems = [
        { title: 'Recentes', icon: Clock, screen: 'PdfList', params: { type: 'recents', title: 'Recentes' }, color: '#EF5350' },
        { title: 'Favoritos', icon: Star, screen: 'PdfList', params: { type: 'favorites', title: 'Favoritos' }, color: '#FFA726' },
        { title: 'Todos os Ficheiros', icon: FileText, screen: 'PdfList', params: { type: 'all', title: 'Todos os Ficheiros' }, color: '#42A5F5' },
        { title: 'Info', icon: Info, screen: 'Info', params: {}, color: '#78909C' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Leitor PDF</Text>
                <TouchableOpacity onPress={handleCloseApp} style={styles.closeButton}>
                    <X color={theme.colors.white} size={24} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.card, { borderLeftColor: item.color }]}
                            onPress={() => navigation.navigate(item.screen, item.params)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                <item.icon color={item.color} size={32} />
                            </View>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <Text style={styles.footerText}>PDF Reader App © 2026</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.m,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4,
    },
    headerTitle: {
        color: theme.colors.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    content: {
        padding: theme.spacing.m,
        flexGrow: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        marginBottom: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        borderLeftWidth: 4,
    },
    iconContainer: {
        padding: theme.spacing.m,
        borderRadius: 50,
        marginBottom: theme.spacing.m,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
    },
    footerText: {
        textAlign: 'center',
        padding: theme.spacing.m,
        color: theme.colors.textSecondary,
        fontSize: 12,
    }
});
