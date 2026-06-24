import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Github, Instagram, Mail } from 'lucide-react-native';
import { theme } from '../utils/theme';

const DEVELOPER = {
    name: 'Edivaldo Jorge',
    github: 'jorgeedvaldo',
    instagram: 'jorgeedvaldo',
    email: 'edivaldo.jorge@empregosyoyota.net',
};

function ContactRow({ icon, label, value, onPress }) {
    return (
        <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.contactIcon}>{icon}</View>
            <View style={styles.contactText}>
                <Text style={styles.contactLabel}>{label}</Text>
                <Text style={styles.contactValue}>{value}</Text>
            </View>
        </TouchableOpacity>
    );
}

export default function InfoScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Leitor de PDF</Text>
                <Text style={styles.version}>Versão 1.0.0</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Desenvolvedor</Text>
                    <Text style={styles.developerName}>{DEVELOPER.name}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Contacto</Text>
                    <ContactRow
                        icon={<Github color={theme.colors.text} size={20} />}
                        label="GitHub"
                        value={`@${DEVELOPER.github}`}
                        onPress={() => Linking.openURL(`https://github.com/${DEVELOPER.github}`)}
                    />
                    <View style={styles.divider} />
                    <ContactRow
                        icon={<Instagram color={theme.colors.text} size={20} />}
                        label="Instagram"
                        value={`@${DEVELOPER.instagram}`}
                        onPress={() => Linking.openURL(`https://instagram.com/${DEVELOPER.instagram}`)}
                    />
                    <View style={styles.divider} />
                    <ContactRow
                        icon={<Mail color={theme.colors.text} size={20} />}
                        label="Email"
                        value={DEVELOPER.email}
                        onPress={() => Linking.openURL(`mailto:${DEVELOPER.email}`)}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Sobre</Text>
                    <Text style={styles.aboutText}>
                        Um leitor de PDF simples e eficiente para as suas necessidades diárias.
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
        width: '88%',
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
    sectionLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
        marginBottom: theme.spacing.s,
    },
    developerName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.s,
    },
    contactIcon: {
        width: 36,
        alignItems: 'center',
    },
    contactText: {
        flex: 1,
        marginLeft: theme.spacing.s,
    },
    contactLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    contactValue: {
        fontSize: 15,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginLeft: 44,
    },
    aboutText: {
        fontSize: 15,
        color: theme.colors.text,
        lineHeight: 22,
    },
});
