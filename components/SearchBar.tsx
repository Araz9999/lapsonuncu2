import React, { useState, memo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useListingStore } from '@/store/listingStore';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/constants/colors';

function SearchBar() {
  const { searchQuery, setSearchQuery, applyFilters } = useListingStore();
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const colors = getColors(themeMode, colorTheme);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = () => {
    // ✅ Trim and validate search query
    const trimmedQuery = localQuery.trim();
    
    // ✅ If empty, clear existing search
    if (trimmedQuery.length === 0) {
      if (searchQuery.length > 0) {
        handleClear();
      }
      return; // ✅ Don't set empty query
    }
    
    // ✅ Only set query if not empty
    setSearchQuery(trimmedQuery);
    applyFilters();
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    applyFilters();
  };

  const placeholder = language === 'az' 
    ? 'Nə axtarırsınız?' 
    : 'Что вы ищете?';

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={localQuery}
          onChangeText={setLocalQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {localQuery.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default memo(SearchBar);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});