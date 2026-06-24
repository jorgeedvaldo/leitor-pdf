import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, Platform, PermissionsAndroid,
    ScrollView, BackHandler, TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Folder, FileText, ChevronRight, Home, Search, X, HardDrive, Download, Image, Music, Video, ArrowLeft } from 'lucide-react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { theme } from '../utils/theme';

const ROOT_PATH = '/storage/emulated/0';

const QUICK_ACCESS = [
    { label: 'Downloads', path: ROOT_PATH + '/Download', icon: Download },
    { label: 'Documentos', path: ROOT_PATH + '/Documents', icon: FileText },
    { label: 'Imagens', path: ROOT_PATH + '/Pictures', icon: Image },
    { label: 'Música', path: ROOT_PATH + '/Music', icon: Music },
    { label: 'Vídeos', path: ROOT_PATH + '/Movies', icon: Video },
    { label: 'DCIM', path: ROOT_PATH + '/DCIM', icon: Image },
];

const EXCLUDED_AT_ROOT = new Set(['Android', 'data', 'obb']);

function pathLabel(path) {
    if (path === ROOT_PATH) return 'Armazenamento';
    return path.split('/').pop() || path;
}

function buildCrumbs(path) {
    if (path === ROOT_PATH) return [{ label: 'Armazenamento', path: ROOT_PATH }];
    const crumbs = [{ label: 'Armazenamento', path: ROOT_PATH }];
    let cur = ROOT_PATH;
    const rest = path.slice(ROOT_PATH.length + 1).split('/').filter(Boolean);
    for (const seg of rest) {
        cur = cur + '/' + seg;
        crumbs.push({ label: seg, path: cur });
    }
    return crumbs;
}

export default function FileExplorerScreen({ navigation }) {
    const [currentPath, setCurrentPath] = useState(ROOT_PATH);
    const [history, setHistory] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchInputRef = useRef(null);

    // --- Permission ---
    const checkPermission = useCallback(async () => {
        if (Platform.OS !== 'android') { setHasPermission(true); return true; }
        if (Platform.Version >= 30) {
            try {
                await ReactNativeBlobUtil.fs.ls(ROOT_PATH + '/Download');
                setHasPermission(true);
                return true;
            } catch {
                setHasPermission(false);
                return false;
            }
        } else {
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            if (granted) { setHasPermission(true); return true; }
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            const ok = result === PermissionsAndroid.RESULTS.GRANTED;
            setHasPermission(ok);
            return ok;
        }
    }, []);

    const requestPermission = async () => {
        if (Platform.Version >= 30) {
            IntentLauncher.startActivityAsync('android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION', {
                data: 'package:com.leitorpdf.app'
            });
        } else {
            await checkPermission();
        }
    };

    // --- Load directory ---
    const loadDirectory = useCallback(async (path) => {
        setLoading(true);
        setSearching(false);
        setSearchQuery('');
        try {
            const rawItems = await ReactNativeBlobUtil.fs.lstat(path);
            const folders = [];
            const pdfs = [];

            for (const f of rawItems) {
                if (f.filename.startsWith('.')) continue;
                if (path === ROOT_PATH && EXCLUDED_AT_ROOT.has(f.filename)) continue;

                if (f.type === 'dir') {
                    folders.push({
                        kind: 'folder',
                        name: f.filename,
                        path: f.path,
                        lastModified: f.lastModified,
                    });
                } else if (f.type === 'file' && f.filename.toLowerCase().endsWith('.pdf')) {
                    pdfs.push({
                        kind: 'pdf',
                        name: f.filename,
                        path: f.path,
                        uri: 'file://' + f.path,
                        size: f.size,
                        lastModified: f.lastModified,
                    });
                }
            }

            folders.sort((a, b) => a.name.localeCompare(b.name));
            pdfs.sort((a, b) => a.name.localeCompare(b.name));
            setItems([...folders, ...pdfs]);
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível abrir esta pasta.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Search ---
    const runSearch = useCallback(async (query) => {
        if (!query.trim()) return;
        setSearchLoading(true);
        setSearchResults([]);
        try {
            const results = [];
            const queue = [currentPath];
            let checked = 0;
            while (queue.length > 0 && checked < 300) {
                const dir = queue.shift();
                checked++;
                try {
                    const entries = await ReactNativeBlobUtil.fs.lstat(dir);
                    for (const f of entries) {
                        if (f.filename.startsWith('.')) continue;
                        if (f.type === 'dir') {
                            if (!(dir === ROOT_PATH && EXCLUDED_AT_ROOT.has(f.filename))) {
                                queue.push(f.path);
                            }
                        } else if (
                            f.type === 'file' &&
                            f.filename.toLowerCase().endsWith('.pdf') &&
                            f.filename.toLowerCase().includes(query.toLowerCase())
                        ) {
                            results.push({
                                kind: 'pdf',
                                name: f.filename,
                                path: f.path,
                                uri: 'file://' + f.path,
                                size: f.size,
                                lastModified: f.lastModified,
                            });
                        }
                    }
                } catch { /* skip inaccessible dirs */ }
            }
            results.sort((a, b) => a.name.localeCompare(b.name));
            setSearchResults(results);
        } finally {
            setSearchLoading(false);
        }
    }, [currentPath]);

    // --- Navigation ---
    const navigateTo = useCallback((path) => {
        setHistory(h => [...h, currentPath]);
        setCurrentPath(path);
        loadDirectory(path);
    }, [currentPath, loadDirectory]);

    const navigateBack = useCallback(() => {
        if (searching) { setSearching(false); setSearchQuery(''); return true; }
        if (history.length === 0) return false;
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setCurrentPath(prev);
        loadDirectory(prev);
        return true;
    }, [history, searching, loadDirectory]);

    const navigateCrumb = useCallback((path) => {
        const idx = history.indexOf(path);
        if (idx >= 0) {
            setHistory(h => h.slice(0, idx));
        } else {
            setHistory([]);
        }
        setCurrentPath(path);
        loadDirectory(path);
    }, [history, loadDirectory]);

    // --- Hardware back button ---
    useFocusEffect(useCallback(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', navigateBack);
        return () => sub.remove();
    }, [navigateBack]));

    // --- Initial load ---
    useFocusEffect(useCallback(() => {
        let cancelled = false;
        (async () => {
            const ok = await checkPermission();
            if (!cancelled && ok) loadDirectory(currentPath);
            else if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [])); // only on first focus

    // --- Handlers ---
    const openPdf = (item) => navigation.navigate('PdfViewer', { uri: item.uri, name: item.name });

    const handleItemPress = (item) => {
        if (item.kind === 'folder') navigateTo(item.path);
        else openPdf(item);
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) runSearch(searchQuery);
    };

    const cancelSearch = () => {
        setSearching(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // --- Helpers ---
    const formatSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // --- Render ---
    const crumbs = buildCrumbs(currentPath);
    const isAtRoot = currentPath === ROOT_PATH;
    const displayItems = searching ? searchResults : items;

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleItemPress(item)} activeOpacity={0.7}>
            <View style={[styles.itemIcon, item.kind === 'folder' ? styles.folderIcon : styles.pdfIcon]}>
                {item.kind === 'folder'
                    ? <Folder color={theme.colors.primary} size={22} />
                    : <FileText color="#E53935" size={20} />
                }
            </View>
            <View style={styles.itemText}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.kind === 'pdf' && item.size ? (
                    <Text style={styles.itemMeta}>{formatSize(Number(item.size))}</Text>
                ) : item.kind === 'pdf' && searching ? (
                    <Text style={styles.itemMeta} numberOfLines={1}>
                        {item.path.replace(ROOT_PATH, 'Armazenamento').replace(/\/[^/]+$/, '')}
                    </Text>
                ) : null}
            </View>
            {item.kind === 'folder' && (
                <ChevronRight color={theme.colors.textSecondary} size={18} />
            )}
        </TouchableOpacity>
    );

    const renderQuickAccess = () => (
        <View style={styles.quickSection}>
            <Text style={styles.sectionTitle}>Acesso Rápido</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                {QUICK_ACCESS.map(({ label, path, icon: Icon }) => (
                    <TouchableOpacity
                        key={path}
                        style={styles.quickItem}
                        onPress={() => navigateTo(path)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.quickIcon}>
                            <Icon color={theme.colors.primary} size={22} />
                        </View>
                        <Text style={styles.quickLabel}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Todos os Ficheiros</Text>
        </View>
    );

    if (hasPermission === false) {
        return (
            <View style={styles.centered}>
                <HardDrive color={theme.colors.textSecondary} size={56} />
                <Text style={styles.permTitle}>Acesso ao Armazenamento</Text>
                <Text style={styles.permDesc}>
                    Para explorar os seus ficheiros, o app precisa de permissão para aceder a todos os arquivos.
                </Text>
                <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
                    <Text style={styles.permButtonText}>Conceder Permissão</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Breadcrumb bar */}
            <View style={styles.breadcrumbBar}>
                {history.length > 0 && !searching && (
                    <TouchableOpacity style={styles.backBtn} onPress={navigateBack}>
                        <ArrowLeft color={theme.colors.primary} size={20} />
                    </TouchableOpacity>
                )}
                {!searching ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.crumbScroll}
                        contentContainerStyle={styles.crumbContent}
                        ref={r => r && r.scrollToEnd({ animated: false })}
                    >
                        {crumbs.map((crumb, i) => (
                            <React.Fragment key={crumb.path}>
                                {i > 0 && <ChevronRight color={theme.colors.textSecondary} size={14} style={styles.crumbSep} />}
                                <TouchableOpacity
                                    onPress={() => crumb.path !== currentPath && navigateCrumb(crumb.path)}
                                    disabled={crumb.path === currentPath}
                                >
                                    <Text style={[styles.crumbText, crumb.path === currentPath && styles.crumbActive]}>
                                        {i === 0 ? <Home size={14} color={crumb.path === currentPath ? theme.colors.primary : theme.colors.textSecondary} /> : null}
                                        {i === 0 ? null : crumb.label}
                                    </Text>
                                </TouchableOpacity>
                            </React.Fragment>
                        ))}
                    </ScrollView>
                ) : (
                    <Text style={styles.searchingIn} numberOfLines={1}>
                        Pesquisar em: {pathLabel(currentPath)}
                    </Text>
                )}
                <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={() => { setSearching(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                >
                    <Search color={theme.colors.primary} size={20} />
                </TouchableOpacity>
            </View>

            {/* Search bar */}
            {searching && (
                <View style={styles.searchBar}>
                    <Search color={theme.colors.textSecondary} size={18} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={`Pesquisar PDFs em "${pathLabel(currentPath)}"...`}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                            <X color={theme.colors.textSecondary} size={18} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.cancelBtn} onPress={cancelSearch}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            {loading || (searching && searchLoading) ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>{searching ? 'A pesquisar...' : 'A carregar...'}</Text>
                </View>
            ) : (
                <FlatList
                    data={displayItems}
                    keyExtractor={(item, i) => item.path + i}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.list, displayItems.length === 0 && styles.listEmpty]}
                    ListHeaderComponent={isAtRoot && !searching ? renderQuickAccess : null}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <FileText color={theme.colors.textSecondary} size={48} />
                            <Text style={styles.emptyText}>
                                {searching
                                    ? 'Nenhum PDF encontrado.'
                                    : 'Esta pasta está vazia.'}
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },

    // Breadcrumb
    breadcrumbBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingHorizontal: 8,
        paddingVertical: 6,
        minHeight: 44,
    },
    backBtn: { padding: 6, marginRight: 2 },
    crumbScroll: { flex: 1 },
    crumbContent: { alignItems: 'center', paddingHorizontal: 2 },
    crumbSep: { marginHorizontal: 2 },
    crumbText: { fontSize: 13, color: theme.colors.textSecondary, paddingHorizontal: 2 },
    crumbActive: { color: theme.colors.primary, fontWeight: '600' },
    searchingIn: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, marginHorizontal: 4 },
    searchBtn: { padding: 6, marginLeft: 4 },

    // Search bar
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: theme.colors.text, height: 36 },
    cancelBtn: { paddingLeft: 6 },
    cancelText: { color: theme.colors.primary, fontSize: 14, fontWeight: '500' },

    // Quick access
    quickSection: { paddingTop: 16, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    quickScroll: { marginBottom: 16 },
    quickItem: { alignItems: 'center', marginRight: 16, width: 64 },
    quickIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    quickLabel: { fontSize: 11, color: theme.colors.text, textAlign: 'center' },
    divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 12 },

    // List
    list: { paddingBottom: 24 },
    listEmpty: { flex: 1 },
    item: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    itemIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    folderIcon: { backgroundColor: theme.colors.primaryLight },
    pdfIcon: { backgroundColor: '#FFEBEE' },
    itemText: { flex: 1 },
    itemName: { fontSize: 15, color: theme.colors.text, fontWeight: '500' },
    itemMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },

    // Permission / empty / loading
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { marginTop: 12, color: theme.colors.textSecondary, fontSize: 14 },
    emptyBox: { alignItems: 'center', paddingTop: 60 },
    emptyText: { marginTop: 12, color: theme.colors.textSecondary, fontSize: 15 },
    permTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 20, marginBottom: 8, textAlign: 'center' },
    permDesc: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    permButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: theme.borderRadius.m },
    permButtonText: { color: theme.colors.white, fontWeight: '700', fontSize: 15 },
});
