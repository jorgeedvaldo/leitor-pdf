import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FileText, Clock, Star, Folder } from 'lucide-react-native';
import { theme } from '../utils/theme';
import { getRecents, getFavorites } from '../utils/storage';
import * as MediaLibrary from 'expo-media-library';

export default function PdfListScreen({ route, navigation }) {
    const { type, items, title } = route.params;
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
        } else if (type === 'folder') {
            // Data passed from parent folder
            if (items) {
                setData(items);
            }
            setLoading(false);
        } else if (type === 'all') {
            // Logic for All Files - Group by Folder
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
                    mediaType: ['unknown'],
                    first: 1000, // Increased limit
                    sortBy: ['modificationTime']
                });

                let files = assets.assets;

                // Filter for PDFs
                files = files.filter(f => f.filename.toLowerCase().endsWith('.pdf'));

                // Group by folders
                const foldersMap = {};

                files.forEach(file => {
                    // Extract directory path. 
                    // Note: 'uri' usually looks like file:///storage/emulated/0/Download/file.pdf
                    const uri = file.uri;
                    const lastSlashIndex = uri.lastIndexOf('/');
                    const parentDir = uri.substring(0, lastSlashIndex);
                    // Get folder name (e.g. 'Download')
                    // Handle potential trailing slash or root
                    const parentDirName = parentDir.split('/').pop() || 'Root';

                    if (!foldersMap[parentDir]) {
                        foldersMap[parentDir] = {
                            id: parentDir,
                            name: parentDirName,
                            path: parentDir,
                            count: 0,
                            items: [],
                            isFolder: true
                        };
                    }

                    foldersMap[parentDir].items.push({
                        uri: file.uri,
                        name: file.filename,
                        id: file.id,
                        date: file.modificationTime,
                        isFolder: false
                    });
                    foldersMap[parentDir].count++;
                });

                const folderList = Object.values(foldersMap).sort((a, b) => a.name.localeCompare(b.name));
                setData(folderList);

            } catch (e) {
                console.error(e);
                Alert.alert('Erro', 'Não foi possível carregar os arquivos.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Reload when screen gains focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [type, permissionResponse, items])
    );

    const handleItemPress = (item) => {
        if (item.isFolder) {
            navigation.push('PdfList', {
                type: 'folder',
                title: item.name,
                items: item.items
            });
        } else {
            navigation.navigate('PdfViewer', { uri: item.uri, name: item.name });
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => handleItemPress(item)}
        >
            <View style={styles.iconContainer}>
                {item.isFolder ? (
                    <Folder color={theme.colors.primary} size={28} />
                ) : (
                    <FileText color={theme.colors.textSecondary} size={24} />
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                {item.isFolder ? (
                    <Text style={styles.itemSubtitle}>{item.count} arquivo(s)</Text>
                ) : (
                    <Text style={styles.itemSubtitle}>{item.uri.split('/').slice(0, -1).pop()}</Text>
                )}
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
                    keyExtractor={(item, index) => (item.id || item.uri) + index}
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
        width: 40,
        alignItems: 'center',
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
