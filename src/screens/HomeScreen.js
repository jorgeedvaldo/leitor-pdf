import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ScrollView, FlatList, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, FileText, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../utils/theme';
import { getRecents } from '../utils/storage';

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [recentFiles, setRecentFiles] = useState([]);

    const handleCloseApp = () => {
        BackHandler.exitApp();
    };

    useFocusEffect(
        useCallback(() => {
            const loadRecents = async () => {
                const recents = await getRecents();
                setRecentFiles(recents.slice(0, 5)); // Show up to 5 recent files
            };
            loadRecents();
        }, [])
    );

    const handleSearch = () => {
        if (searchQuery.trim().length > 0) {
            navigation.navigate('PdfList', {
                type: 'search',
                title: 'Pesquisa',
                query: searchQuery
            });
            setSearchQuery('');
        }
    };

    const renderRecentItem = ({ item }) => (
        <TouchableOpacity
            style={styles.recentItem}
            onPress={() => navigation.navigate('PdfViewer', { uri: item.uri, name: item.name })}
        >
            <View style={styles.recentIconContainer}>
                <FileText color={theme.colors.primary} size={24} />
            </View>
            <View style={styles.recentTextContainer}>
                <Text style={styles.recentItemTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.recentItemSubtitle}>PDF Document</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: 0 }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Leitor PDF</Text>
                <TouchableOpacity onPress={handleCloseApp} style={styles.closeButton}>
                    <X color={theme.colors.white} size={24} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search color={theme.colors.textSecondary} size={20} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar PDF no telemóvel..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>

                {/* Recent Files */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Arquivos Recentes</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('FilesTab', { screen: 'PdfList', params: { type: 'recents', title: 'Recentes' } })}>
                        <Text style={styles.seeAllText}>Ver todos</Text>
                    </TouchableOpacity>
                </View>

                {recentFiles.length > 0 ? (
                    <FlatList
                        data={recentFiles}
                        renderItem={renderRecentItem}
                        keyExtractor={(item, index) => (item.id || item.uri) + index}
                        contentContainerStyle={styles.recentListContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Clock color={theme.colors.textSecondary} size={48} />
                        <Text style={styles.emptyText}>Nenhum arquivo recente.</Text>
                    </View>
                )}
            </View>
        </View>
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
        flex: 1,
        padding: theme.spacing.m,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        paddingHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchIcon: {
        marginRight: theme.spacing.s,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: theme.colors.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    seeAllText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    recentListContent: {
        paddingBottom: theme.spacing.xl,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
        elevation: 1,
    },
    recentIconContainer: {
        marginRight: theme.spacing.m,
        backgroundColor: theme.colors.primaryLight,
        padding: theme.spacing.s,
        borderRadius: theme.borderRadius.s,
    },
    recentTextContainer: {
        flex: 1,
    },
    recentItemTitle: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '500',
    },
    recentItemSubtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        marginTop: theme.spacing.m,
    }
});
