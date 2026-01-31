import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FileText, Clock, Star } from 'lucide-react-native';
import { theme } from '../utils/theme';
import { getRecents, getFavorites } from '../utils/storage';
import * as MediaLibrary from 'expo-media-library';

export default function PdfListScreen({ route, navigation }) {
    const { type } = route.params;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

    const loadData = async () => {
        setLoading(true);
        if (type === 'recents') {
            const recents = await getRecents();
            setData(recents);
            setLoading(false);
        } else if (type === 'favorites') {
            const favorites = await getFavorites();
            setData(favorites);
            setLoading(false);
        } else if (type === 'all') {
            // Logic for All Files
            if (!permissionResponse?.granted) {
                const perm = await requestPermission();
                if (!perm.granted) {
                    Alert.alert('Permissão necessária', 'Precisamos de permissão para aceder aos seus arquivos.');
                    setLoading(false);
                    return;
                }
            }

            try {
                const assets = await MediaLibrary.getAssetsAsync({
                    mediaType: ['unknown'], // PDFs are often unknown or we check extension
                    extensions: ['.pdf'], // Filter by extension directly if supported or filter later
                    first: 100, // Limit for now
                    sortBy: ['modificationTime']
                });

                // Expo MediaLibrary 'extensions' option might not work for unknown types on all versions, 
                // but let's try. If not, we filter manually.
                let files = assets.assets;

                // Manual filter if needed (double check)
                files = files.filter(f => f.filename.toLowerCase().endsWith('.pdf'));

                const mapped = files.map(f => ({
                    uri: f.uri,
                    name: f.filename,
                    id: f.id,
                    date: f.modificationTime
                }));
                setData(mapped);
            } catch (e) {
                console.error(e);
                Alert.alert('Erro', 'Não foi possível carregar os arquivos.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Reload when screen gains focus (e.g. back from viewer)
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [type, permissionResponse]) // Dependency on permission to retry if granted
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('PdfViewer', { uri: item.uri, name: item.name })}
        >
            <View style={styles.iconContainer}>
                <FileText color={theme.colors.primary} size={24} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>{item.uri.split('/').slice(0, -1).pop()}</Text>
            </View>
        </TouchableOpacity>
    );

    const EmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum arquivo encontrado.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.uri + index}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={EmptyComponent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: theme.spacing.m,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
        elevation: 1,
    },
    iconContainer: {
        marginRight: theme.spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '500',
    },
    itemSubtitle: {
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
    }
});
