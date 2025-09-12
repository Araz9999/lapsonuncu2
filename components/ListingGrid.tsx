import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useListingStore } from '@/store/listingStore';
import { useLanguageStore } from '@/store/languageStore';
import ListingCard from './ListingCard';
import Colors from '@/constants/colors';

export default function ListingGrid() {
  const { filteredListings, applyFilters } = useListingStore();
  const { language } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial load
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Apply filters to get initial data
        applyFilters();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    applyFilters();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [applyFilters]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {language === 'az' ? 'Yüklənir...' : 'Загрузка...'}
        </Text>
      </View>
    );
  }

  if (filteredListings.length === 0) {
    return (
      <ScrollView 
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.emptyText}>
          {language === 'az' 
            ? 'Heç bir elan tapılmadı' 
            : 'Объявления не найдены'}
        </Text>
        <Text style={styles.emptySubText}>
          {language === 'az' 
            ? 'Filtrləri dəyişdirməyə cəhd edin' 
            : 'Попробуйте изменить фильтры'}
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.grid}>
        {filteredListings.map((item) => (
          <View key={item.id} style={styles.gridItem}>
            <ListingCard listing={item} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 12,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '49%',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});