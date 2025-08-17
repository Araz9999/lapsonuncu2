import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Users,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  Share2,
  Target,
  Clock,
  Star,
  MapPin,
  Phone
} from 'lucide-react-native';
import { useStoreStore } from '@/store/storeStore';
import { useUserStore } from '@/store/userStore';
import { useListingStore } from '@/store/listingStore';
import { useLanguageStore } from '@/store/languageStore';
import { getColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import { LocalizedText } from '@/types/category';

// Helper function to get localized text
const getLocalizedText = (text: LocalizedText | string, language: 'az' | 'ru'): string => {
  if (typeof text === 'string') return text;
  return text[language] || text.az || '';
};

const { width } = Dimensions.get('window');

interface AnalyticsData {
  views: number;
  viewsChange: number;
  favorites: number;
  favoritesChange: number;
  messages: number;
  messagesChange: number;
  followers: number;
  followersChange: number;
  sales: number;
  salesChange: number;
  revenue: number;
  revenueChange: number;
  avgRating: number;
  ratingChange: number;
  activeListings: number;
  totalListings: number;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const timeRanges = [
  { id: '7d', label: '7 gün' },
  { id: '30d', label: '30 gün' },
  { id: '90d', label: '3 ay' },
  { id: '1y', label: '1 il' }
];

export default function StoreAnalyticsScreen() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { currentUser } = useUserStore();
  const { stores, getUserStore } = useStoreStore();
  const { listings } = useListingStore();
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const colors = getColors(themeMode, colorTheme);

  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    views: 12450,
    viewsChange: 15.2,
    favorites: 234,
    favoritesChange: 8.7,
    messages: 89,
    messagesChange: -3.2,
    followers: 156,
    followersChange: 12.5,
    sales: 45,
    salesChange: 22.1,
    revenue: 2340,
    revenueChange: 18.9,
    avgRating: 4.7,
    ratingChange: 0.3,
    activeListings: 23,
    totalListings: 45
  });

  const store = storeId ? stores.find(s => s.id === storeId) : getUserStore(currentUser?.id || '');
  const storeListings = listings.filter(l => l.storeId === store?.id);

  useEffect(() => {
    // Simulate loading analytics data based on time range
    const loadAnalytics = () => {
      // In a real app, this would fetch data from API
      const multiplier = selectedTimeRange === '7d' ? 0.3 : 
                        selectedTimeRange === '30d' ? 1 : 
                        selectedTimeRange === '90d' ? 2.5 : 8;
      
      setAnalyticsData(prev => ({
        ...prev,
        views: Math.floor(prev.views * multiplier),
        favorites: Math.floor(prev.favorites * multiplier),
        messages: Math.floor(prev.messages * multiplier),
        sales: Math.floor(prev.sales * multiplier),
        revenue: Math.floor(prev.revenue * multiplier)
      }));
    };

    loadAnalytics();
  }, [selectedTimeRange]);

  const styles = createStyles(colors);

  if (!store) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Mağaza Analitikası' }} />
        <Text style={styles.errorText}>Mağaza tapılmadı</Text>
      </View>
    );
  }

  const viewsChartData: ChartData[] = [
    { label: 'B.', value: 1200, color: colors.primary },
    { label: 'Ç.A.', value: 1800, color: colors.primary },
    { label: 'Ç.', value: 1500, color: colors.primary },
    { label: 'C.A.', value: 2200, color: colors.primary },
    { label: 'C.', value: 1900, color: colors.primary },
    { label: 'Ş.', value: 2800, color: colors.primary },
    { label: 'B.', value: 2100, color: colors.primary }
  ];

  const topPerformingListings = storeListings
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const renderStatCard = (
    title: string,
    value: string | number,
    change: number,
    icon: React.ComponentType<any>,
    color: string = colors.primary
  ) => {
    const isPositive = change >= 0;
    const IconComponent = icon;
    
    return (
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
            <IconComponent size={20} color={color} />
          </View>
          <View style={styles.statChange}>
            {isPositive ? (
              <TrendingUp size={16} color={colors.success} />
            ) : (
              <TrendingDown size={16} color={colors.error} />
            )}
            <Text style={[
              styles.changeText,
              { color: isPositive ? colors.success : colors.error }
            ]}>
              {Math.abs(change)}%
            </Text>
          </View>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    );
  };

  const renderChart = () => {
    const maxValue = Math.max(...viewsChartData.map(d => d.value));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Həftəlik Baxışlar</Text>
        <View style={styles.chart}>
          {viewsChartData.map((data, index) => {
            const height = (data.value / maxValue) * 120;
            return (
              <View key={index} style={styles.chartBar}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: data.color
                    }
                  ]}
                />
                <Text style={styles.barLabel}>{data.label}</Text>
                <Text style={styles.barValue}>{data.value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTopListings = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ən Çox Baxılan Elanlar</Text>
        {topPerformingListings.map((listing, index) => (
          <TouchableOpacity
            key={listing.id}
            style={styles.listingItem}
            onPress={() => router.push(`/listing/${listing.id}`)}
          >
            <View style={styles.listingRank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.listingContent}>
              <Text style={styles.listingTitle} numberOfLines={1}>
                {getLocalizedText(listing.title, language)}
              </Text>
              <Text style={styles.listingPrice}>{listing.price} AZN</Text>
            </View>
            <View style={styles.listingStats}>
              <View style={styles.statItem}>
                <Eye size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{listing.views || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Heart size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{(listing as any).favorites || 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderInsights = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Təhlil və Tövsiyələr</Text>
        
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Target size={20} color={colors.primary} />
            <Text style={styles.insightTitle}>Performans Təhlili</Text>
          </View>
          <Text style={styles.insightText}>
            Mağazanızın performansı son 30 gündə 18.9% artıb. Ən çox baxılan elanlarınız 
            şənbə günləri daha aktiv olur.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Clock size={20} color={colors.warning} />
            <Text style={styles.insightTitle}>Optimal Vaxt</Text>
          </View>
          <Text style={styles.insightText}>
            Elanlarınızı saat 18:00-21:00 arası yerləşdirdikdə 35% daha çox baxış alırsınız.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Star size={20} color={colors.success} />
            <Text style={styles.insightTitle}>Reytinq Təkmilləşdirmə</Text>
          </View>
          <Text style={styles.insightText}>
            Müştəri rəylərini tez cavabladığınız üçün reytinqiniz yüksəkdir. 
            Bu tempi saxlayın!
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Mağaza Analitikası',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Share2 size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Download size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range.id && styles.activeTimeRange
              ]}
              onPress={() => setSelectedTimeRange(range.id)}
            >
              <Text style={[
                styles.timeRangeText,
                selectedTimeRange === range.id && styles.activeTimeRangeText
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard('Baxışlar', analyticsData.views.toLocaleString(), analyticsData.viewsChange, Eye)}
          {renderStatCard('Sevimlilər', analyticsData.favorites, analyticsData.favoritesChange, Heart, colors.error)}
          {renderStatCard('Mesajlar', analyticsData.messages, analyticsData.messagesChange, MessageSquare, colors.warning)}
          {renderStatCard('İzləyicilər', analyticsData.followers, analyticsData.followersChange, Users, colors.success)}
          {renderStatCard('Satışlar', analyticsData.sales, analyticsData.salesChange, ShoppingCart, colors.primary)}
          {renderStatCard('Gəlir', `${analyticsData.revenue} AZN`, analyticsData.revenueChange, BarChart3, colors.success)}
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Store Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mağaza Ümumi Məlumat</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{analyticsData.activeListings}</Text>
              <Text style={styles.overviewLabel}>Aktiv Elanlar</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{analyticsData.totalListings}</Text>
              <Text style={styles.overviewLabel}>Ümumi Elanlar</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{analyticsData.avgRating}</Text>
              <Text style={styles.overviewLabel}>Orta Reytinq</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{store.followers.length}</Text>
              <Text style={styles.overviewLabel}>İzləyicilər</Text>
            </View>
          </View>
        </View>

        {/* Top Performing Listings */}
        {renderTopListings()}

        {/* Insights */}
        {renderInsights()}

        {/* Demographics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ziyarətçi Demografikası</Text>
          <View style={styles.demographicsContainer}>
            <View style={styles.demographicItem}>
              <Text style={styles.demographicLabel}>Yaş Qrupları</Text>
              <View style={styles.demographicBar}>
                <View style={[styles.demographicSegment, { flex: 3, backgroundColor: colors.primary }]} />
                <View style={[styles.demographicSegment, { flex: 4, backgroundColor: colors.success }]} />
                <View style={[styles.demographicSegment, { flex: 2, backgroundColor: colors.warning }]} />
                <View style={[styles.demographicSegment, { flex: 1, backgroundColor: colors.error }]} />
              </View>
              <View style={styles.demographicLegend}>
                <Text style={styles.legendItem}>18-25 (30%)</Text>
                <Text style={styles.legendItem}>26-35 (40%)</Text>
                <Text style={styles.legendItem}>36-45 (20%)</Text>
                <Text style={styles.legendItem}>45+ (10%)</Text>
              </View>
            </View>

            <View style={styles.demographicItem}>
              <Text style={styles.demographicLabel}>Şəhərlər</Text>
              <View style={styles.cityStats}>
                <View style={styles.cityItem}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={styles.cityName}>Bakı</Text>
                  <Text style={styles.cityPercentage}>65%</Text>
                </View>
                <View style={styles.cityItem}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={styles.cityName}>Gəncə</Text>
                  <Text style={styles.cityPercentage}>15%</Text>
                </View>
                <View style={styles.cityItem}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={styles.cityName}>Sumqayıt</Text>
                  <Text style={styles.cityPercentage}>12%</Text>
                </View>
                <View style={styles.cityItem}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={styles.cityName}>Digər</Text>
                  <Text style={styles.cityPercentage}>8%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 50,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  activeTimeRange: {
    backgroundColor: colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: colors.card,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  statCard: {
    width: (width - 48) / 2,
    margin: 8,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  overviewItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  overviewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.card,
  },
  listingContent: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  listingPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  listingStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  insightCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  demographicsContainer: {
    marginTop: 8,
  },
  demographicItem: {
    marginBottom: 24,
  },
  demographicLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  demographicBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  demographicSegment: {
    height: '100%',
  },
  demographicLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 16,
    marginBottom: 4,
  },
  cityStats: {
    marginTop: 8,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cityName: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  cityPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});