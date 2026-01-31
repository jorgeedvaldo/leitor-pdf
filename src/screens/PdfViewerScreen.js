import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { addToRecents, isFavorite, toggleFavorite } from '../utils/storage';
import { Star, ArrowLeft } from 'lucide-react-native';

export default function PdfViewerScreen({ route, navigation }) {
    const { uri, name, fromIntent } = route.params;
    const [loading, setLoading] = useState(true);
    const [favorite, setFavorite] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const init = async () => {
            // Prepare file object safely
            const fileObj = {
                uri: uri,
                name: name || uri.split('/').pop(),
                lastOpened: new Date().toISOString()
            };

            await addToRecents(fileObj);
            const fav = await isFavorite(uri);
            setFavorite(fav);
            setLoading(false);
        };
        init();
    }, [uri]);

    const handleFavorite = async () => {
        const fileObj = {
            uri: uri,
            name: name || uri.split('/').pop(),
        };
        const newStatus = await toggleFavorite(fileObj);
        setFavorite(newStatus);
    };

    const source = { uri: uri, cache: true };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <ArrowLeft color={theme.colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{name || "Document"}</Text>
                <TouchableOpacity onPress={handleFavorite} style={styles.iconButton}>
                    <Star
                        color={favorite ? '#FFD700' : theme.colors.white}
                        fill={favorite ? '#FFD700' : 'transparent'}
                        size={24}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.pdfContainer}>
                {error ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>Erro ao abrir o arquivo: {error}</Text>
                    </View>
                ) : (
                    <Pdf
                        source={source}
                        onLoadComplete={(numberOfPages, filePath) => {
                            console.log(`Number of pages: ${numberOfPages}`);
                        }}
                        onPageChanged={(page, numberOfPages) => {
                            console.log(`Current page: ${page}`);
                        }}
                        onError={(error) => {
                            console.error(error);
                            setError(error?.message || "Erro desconhecido");
                        }}
                        onPressLink={(uri) => {
                            console.log(`Link pressed: ${uri}`);
                        }}
                        style={styles.pdf}
                        trustAllCerts={false}
                    />
                )}

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        height: 60,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
    },
    headerTitle: {
        flex: 1,
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: theme.spacing.m,
    },
    iconButton: {
        padding: theme.spacing.s,
    },
    pdfContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 16,
        textAlign: 'center'
    }
});
