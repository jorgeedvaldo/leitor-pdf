import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../utils/theme';

export default function InfoScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Leitor PDF</Text>
                <Text style={styles.version}>Versão 1.0.0</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Desenvolvedor</Text>
                    <Text style={styles.text}>App Dev Team</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Sobre</Text>
                    <Text style={styles.text}>
                        Um leitor de PDF simples e eficiente para suas necessidades diárias.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        paddingTop: theme.spacing.xl,
    },
    content: {
        alignItems: 'center',
        width: '80%',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: theme.spacing.m,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: theme.spacing.xs,
    },
    version: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl,
    },
    section: {
        width: '100%',
        marginBottom: theme.spacing.l,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
    },
    label: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: theme.spacing.xs,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 16,
        color: theme.colors.text,
    },
});
