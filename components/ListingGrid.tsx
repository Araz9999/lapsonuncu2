import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useListingStore } from '@/store/listingStore';
import { useLanguageStore } from '@/store/languageStore';
import ListingCard from './ListingCard';
import Colors from '@/constants/colors';

export default function ListingGrid() {
  const { filteredListings } = useListingStore();
  const { language } = useLanguageStore();

  if (filteredListings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {language === 'az' 
            ? 'Heç bir elan tapılmadı' 
            : 'Объявления не найдены'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {filteredListings.map((item, index) => (
          <View key={item.id} style={styles.gridItem}>
            <ListingCard listing={item} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});