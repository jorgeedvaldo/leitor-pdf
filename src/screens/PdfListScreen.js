import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, PermissionsAndroid } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FileText, Clock, Star, Folder } from 'lucide-react-native';
import { theme } from '../utils/theme';
import { getRecents, getFavorites } from '../utils/storage';
import * as IntentLauncher from 'expo-intent-launcher';
import ReactNativeBlobUtil from 'react-native-blob-util';

export default function PdfListScreen({ route, navigation }) {
    const { type, items, title, path } = route.params;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

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
        } else if (type === 'all' || type === 'folder_explorer' || type === 'search') {
            const currentPath = type === 'all' || type === 'search' ? '/storage/emulated/0' : path;

            if (Platform.OS === 'android') {
                if (Platform.Version >= 30) {
                    try {
                        await ReactNativeBlobUtil.fs.ls('/storage/emulated/0/Download');
                    } catch (e) {
                        Alert.alert(
                            "Permissão Necessária",
                            "Para ler todas as pastas, o aplicativo precisa de acesso a todos os arquivos nas configurações.",
                            [
                                { text: "Cancelar", style: "cancel" },
                                {
                                    text: "Abrir Configurações", onPress: () => {
                                        IntentLauncher.startActivityAsync('android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION', {
                                            data: `package:com.leitorpdf.app`
                                        });
                                    }
                                }
                            ]
                        );
                        setLoading(false);
                        return;
                    }
                } else {
                    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        Alert.alert('Erro', 'Permissão negada.');
                        setLoading(false);
                        return;
                    }
                }
            }

            try {
                if (type === 'search') {
                    const query = route.params.query || '';
                    let tempResults = [];
                    let queue = ['/storage/emulated/0'];
                    let maxDirs = 200; // prevent too long search
                    let dirsChecked = 0;

                    while (queue.length > 0 && dirsChecked < maxDirs) {
                        let p = queue.shift();
                        dirsChecked++;
                        try {
                            const files = await ReactNativeBlobUtil.fs.lstat(p);
                            for (let file of files) {
                                if (file.filename.startsWith('.') || file.filename === 'Android' || file.filename === 'data') continue;

                                if (file.type === 'dir') {
                                    queue.push(file.path);
                                } else if (file.type === 'file' && file.filename.toLowerCase().endsWith('.pdf')) {
                                    if (file.filename.toLowerCase().includes(query.toLowerCase())) {
                                        tempResults.push({
                                            uri: 'file://' + file.path,
                                            name: file.filename,
                                            id: file.path,
                                            date: file.lastModified,
                                            isFolder: false,
                                            path: file.path
                                        });
                                    }
                                }
                            }
                        } catch (e) { }
                    }
                    tempResults.sort((a, b) => a.name.localeCompare(b.name));
                    setData(tempResults);
                } else {
                    const files = await ReactNativeBlobUtil.fs.lstat(currentPath);
                    let folderList = [];
                    let pdfList = [];

                    files.forEach(file => {
                        const isHidden = file.filename.startsWith('.');
                        if (isHidden) return;

                        if (file.type === 'dir') {
                            // Exclude Android root data/obb folders to avoid confusion
                            if (currentPath === '/storage/emulated/0' && (file.filename === 'Android' || file.filename === 'data')) return;

                            folderList.push({
                                uri: 'file://' + file.path,
                                name: file.filename,
                                id: file.path,
                                date: file.lastModified,
                                isFolder: true,
                                path: file.path
                            });
                        } else if (file.type === 'file' && file.filename.toLowerCase().endsWith('.pdf')) {
                            pdfList.push({
                                uri: 'file://' + file.path,
                                name: file.filename,
                                id: file.path,
                                date: file.lastModified,
                                isFolder: false,
                                path: file.path
                            });
                        }
                    });

                    folderList.sort((a, b) => a.name.localeCompare(b.name));
                    pdfList.sort((a, b) => a.name.localeCompare(b.name));

                    setData([...folderList, ...pdfList]);
                }
            } catch (e) {
                console.error(e);
                Alert.alert('Erro', 'Não foi possível carregar esta pasta.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Reload when screen gains focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [type, path, items])
    );

    const handleItemPress = (item) => {
        if (item.isFolder) {
            navigation.push('PdfList', {
                type: 'folder_explorer',
                title: item.name,
                path: item.path
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
                    <Text style={styles.itemSubtitle}>Pasta</Text>
                ) : (
                    <Text style={styles.itemSubtitle}>PDF Document</Text>
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
