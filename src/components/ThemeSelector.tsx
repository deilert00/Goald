import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ThemeType, THEMES, Theme } from '../types/Theme';

interface ThemeSelectorProps {
  selectedTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
  showPremiumBadge?: boolean;
}

export default function ThemeSelector({
  selectedTheme,
  onSelectTheme,
  showPremiumBadge = true,
}: ThemeSelectorProps) {
  const renderThemeOption = (theme: Theme) => {
    const isSelected = selectedTheme === theme.id;
    const isPremium = theme.isPremium && showPremiumBadge;

    return (
      <TouchableOpacity
        key={theme.id}
        style={[
          styles.themeCard,
          isSelected && styles.themeCardSelected,
          isPremium && styles.themeCardPremium,
        ]}
        onPress={() => onSelectTheme(theme.id)}
        activeOpacity={0.7}
      >
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>⭐ PRO</Text>
          </View>
        )}
        
        <Text style={styles.themeEmoji}>{theme.emoji}</Text>
        <Text style={[styles.themeName, isSelected && styles.themeNameSelected]}>
          {theme.name}
        </Text>
        <Text style={[styles.themeDescription, isSelected && styles.themeDescriptionSelected]}>
          {theme.description}
        </Text>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedCheckmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const allThemes = Object.values(THEMES);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Visual Theme</Text>
      <Text style={styles.subtitle}>
        Watch your goal come to life as you save
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allThemes.map(renderThemeOption)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  themeCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    position: 'relative',
  },
  themeCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  themeCardPremium: {
    borderColor: '#FFD700',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
  },
  themeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  themeNameSelected: {
    color: '#4CAF50',
  },
  themeDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  themeDescriptionSelected: {
    color: '#2E7D32',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
