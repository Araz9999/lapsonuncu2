import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLanguageStore } from '@/store/languageStore';
import { useListingStore } from '@/store/listingStore';
import ListingCard from './ListingCard';
import Colors from '@/constants/colors';

export default function FeaturedListings() {
  const { language } = useLanguageStore();
  const { listings } = useListingStore();
  
  const featuredListings = listings.filter(listing => listing.isFeatured);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'az' ? 'VIP Elanlar' : 'VIP Объявления'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {featuredListings.map(item => (
          <View key={item.id} style={styles.cardContainer}>
            <ListingCard listing={item} />
          </View>
        ))}
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
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    marginRight: 12,
    width: 200,
  },
});