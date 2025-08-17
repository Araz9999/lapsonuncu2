import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguageStore, Language } from '@/store/languageStore';
import Colors from '@/constants/colors';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.languageButton,
          language === 'az' && styles.activeLanguage,
        ]}
        onPress={() => handleLanguageChange('az')}
      >
        <Text
          style={[
            styles.languageText,
            language === 'az' && styles.activeLanguageText,
          ]}
        >
          AZ
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.languageButton,
          language === 'ru' && styles.activeLanguage,
        ]}
        onPress={() => handleLanguageChange('ru')}
      >
        <Text
          style={[
            styles.languageText,
            language === 'ru' && styles.activeLanguageText,
          ]}
        >
          RU
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: Colors.border,
    padding: 2,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeLanguage: {
    backgroundColor: Colors.primary,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeLanguageText: {
    color: 'white',
  },
});