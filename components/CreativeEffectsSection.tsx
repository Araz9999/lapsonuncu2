import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform
} from 'react-native';
import {
  Sparkles,
  Zap,
  Star,
  Crown,
  Heart,
  File,
  Check,
  Circle,
  Flower2,
  Gem,
  Award,
  Snowflake,
  Gift
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useLanguageStore } from '@/store/languageStore';

interface CreativeEffect {
  id: string;
  name: { az: string; ru: string };
  description: { az: string; ru: string };
  icon: React.ReactNode;
  color: string;
  price: number;
  duration: number; // in days
  type: 'glow' | 'sparkle' | 'pulse' | 'rainbow' | 'fire' | 'star' | 'frame-blinking' | 'frame-glowing' | 'frame-floral' | 'frame-diamond' | 'frame-golden' | 'frame-neon' | 'star-rain' | 'fireworks' | 'heart-rain' | 'rose-rain' | 'snow-fall' | 'confetti' | 'bubble-float' | 'sparkle-burst';
  isActive?: boolean;
}

const creativeEffects: CreativeEffect[] = [
  {
    id: 'glow',
    name: { az: 'Parlaq Halo', ru: 'Яркое Свечение' },
    description: { az: 'Elanınız parlaq halo ilə diqqət çəkəcək', ru: 'Ваше объявление будет привлекать внимание ярким свечением' },
    icon: <Sparkles size={24} color="#FFD700" />,
    color: '#FFD700',
    price: 1,
    duration: 7,
    type: 'glow'
  },
  {
    id: 'sparkle',
    name: { az: 'Parıltı Effekti', ru: 'Эффект Блеска' },
    description: { az: 'Elanınız parıltılı animasiya ilə görünəcək', ru: 'Ваше объявление будет сверкать анимацией' },
    icon: <Star size={24} color="#FF6B9D" />,
    color: '#FF6B9D',
    price: 1.5,
    duration: 10,
    type: 'sparkle'
  },
  {
    id: 'pulse',
    name: { az: 'Nabız Effekti', ru: 'Пульсирующий Эффект' },
    description: { az: 'Elanınız ritmik şəkildə yanıb-sönəcək', ru: 'Ваше объявление будет ритмично пульсировать' },
    icon: <Heart size={24} color="#FF4757" />,
    color: '#FF4757',
    price: 1.2,
    duration: 5,
    type: 'pulse'
  },
  {
    id: 'rainbow',
    name: { az: 'Göy Qurşağı', ru: 'Радужный Эффект' },
    description: { az: 'Elanınız rəngarəng göy qurşağı ilə bəzənəcək', ru: 'Ваше объявление украсится радужными цветами' },
    icon: <Zap size={24} color="#5F27CD" />,
    color: '#5F27CD',
    price: 2,
    duration: 14,
    type: 'rainbow'
  },
  {
    id: 'fire',
    name: { az: 'Alov Effekti', ru: 'Огненный Эффект' },
    description: { az: 'Elanınız alov animasiyası ilə "yanacaq"', ru: 'Ваше объявление будет "гореть" огненной анимацией' },
    icon: <File size={24} color="#FF6348" />,
    color: '#FF6348',
    price: 1.8,
    duration: 12,
    type: 'fire'
  },
  {
    id: 'crown',
    name: { az: 'Kral Tacı', ru: 'Королевская Корона' },
    description: { az: 'Elanınız kral tacı ilə VIP görünəcək', ru: 'Ваше объявление будет выглядеть VIP с королевской короной' },
    icon: <Crown size={24} color="#FFD700" />,
    color: '#FFD700',
    price: 2.5,
    duration: 21,
    type: 'star'
  },
  {
    id: 'frame-floral',
    name: { az: 'Güllü Çərçivə', ru: 'Цветочная Рамка' },
    description: { az: 'Gözəl gül naxışları ilə bəzədilmiş çərçivə', ru: 'Рамка украшенная красивыми цветочными узорами' },
    icon: <Flower2 size={24} color="#FF69B4" />,
    color: '#FF69B4',
    price: 0.8,
    duration: 7,
    type: 'frame-floral'
  },
  {
    id: 'frame-glowing',
    name: { az: 'Işıqlı Çərçivə', ru: 'Светящаяся Рамка' },
    description: { az: 'Parlaq işıqla yanıb-sönən çərçivə effekti', ru: 'Рамка с ярким светящимся эффектом' },
    icon: <Sparkles size={24} color="#00BFFF" />,
    color: '#00BFFF',
    price: 1.0,
    duration: 10,
    type: 'frame-glowing'
  },
  {
    id: 'frame-blinking',
    name: { az: 'Yanıb Sönən Çərçivə', ru: 'Мигающая Рамка' },
    description: { az: 'Diqqət çəkmək üçün yanıb-sönən çərçivə', ru: 'Мигающая рамка для привлечения внимания' },
    icon: <Zap size={24} color="#FFD700" />,
    color: '#FFD700',
    price: 0.9,
    duration: 8,
    type: 'frame-blinking'
  },
  {
    id: 'frame-diamond',
    name: { az: 'Almaz Çərçivə', ru: 'Алмазная Рамка' },
    description: { az: 'Almaz parıltısı ilə lüks çərçivə', ru: 'Роскошная рамка с алмазным блеском' },
    icon: <Gem size={24} color="#E6E6FA" />,
    color: '#E6E6FA',
    price: 1.5,
    duration: 14,
    type: 'frame-diamond'
  },
  {
    id: 'frame-golden',
    name: { az: 'Qızıl Çərçivə', ru: 'Золотая Рамка' },
    description: { az: 'Klassik qızıl rəngdə zərif çərçivə', ru: 'Элегантная рамка в классическом золотом цвете' },
    icon: <Award size={24} color="#FFD700" />,
    color: '#FFD700',
    price: 1.2,
    duration: 12,
    type: 'frame-golden'
  },
  {
    id: 'frame-neon',
    name: { az: 'Neon Çərçivə', ru: 'Неоновая Рамка' },
    description: { az: 'Gecə klubu tərzi neon işıqlı çərçivə', ru: 'Неоновая рамка в стиле ночного клуба' },
    icon: <Circle size={24} color="#FF1493" />,
    color: '#FF1493',
    price: 1.3,
    duration: 9,
    type: 'frame-neon'
  },
  {
    id: 'star-rain',
    name: { az: 'Ulduz Yağışı', ru: 'Звездный Дождь' },
    description: { az: 'Şəkilin üzərində ulduzlar yağacaq', ru: 'Звезды будут падать поверх изображения' },
    icon: <Star size={24} color="#FFD700" />,
    color: '#FFD700',
    price: 2.2,
    duration: 15,
    type: 'star-rain'
  },
  {
    id: 'fireworks',
    name: { az: 'Havayi Fişək', ru: 'Фейерверк' },
    description: { az: 'Rəngarəng havayi fişək effekti', ru: 'Красочный эффект фейерверка' },
    icon: <Sparkles size={24} color="#FF6B35" />,
    color: '#FF6B35',
    price: 2.8,
    duration: 18,
    type: 'fireworks'
  },
  {
    id: 'heart-rain',
    name: { az: 'Ürək Yağışı', ru: 'Дождь Сердец' },
    description: { az: 'Romantik ürək yağışı animasiyası', ru: 'Романтичная анимация дождя из сердец' },
    icon: <Heart size={24} color="#FF69B4" />,
    color: '#FF69B4',
    price: 2.0,
    duration: 12,
    type: 'heart-rain'
  },
  {
    id: 'rose-rain',
    name: { az: 'Gül Yağışı', ru: 'Дождь Роз' },
    description: { az: 'Zərif gül yarpaqları yağışı', ru: 'Нежный дождь из лепестков роз' },
    icon: <Flower2 size={24} color="#FF1493" />,
    color: '#FF1493',
    price: 2.5,
    duration: 16,
    type: 'rose-rain'
  },
  {
    id: 'snow-fall',
    name: { az: 'Qar Yağışı', ru: 'Снегопад' },
    description: { az: 'Sakit qar yağışı effekti', ru: 'Спокойный эффект снегопада' },
    icon: <Snowflake size={24} color="#87CEEB" />,
    color: '#87CEEB',
    price: 1.8,
    duration: 14,
    type: 'snow-fall'
  },
  {
    id: 'confetti',
    name: { az: 'Konfeti', ru: 'Конфетти' },
    description: { az: 'Bayram konfeti effekti', ru: 'Праздничный эффект конфетти' },
    icon: <Gift size={24} color="#FF6347" />,
    color: '#FF6347',
    price: 2.3,
    duration: 10,
    type: 'confetti'
  },
  {
    id: 'bubble-float',
    name: { az: 'Uçan Qabarcıqlar', ru: 'Плавающие Пузыри' },
    description: { az: 'Yavaş-yavaş yuxarı qalxan qabarcıqlar', ru: 'Медленно поднимающиеся пузыри' },
    icon: <Circle size={24} color="#40E0D0" />,
    color: '#40E0D0',
    price: 1.6,
    duration: 11,
    type: 'bubble-float'
  },
  {
    id: 'sparkle-burst',
    name: { az: 'Parıltı Partlayışı', ru: 'Взрыв Блесток' },
    description: { az: 'Mərkəzdən yayılan parıltı effekti', ru: 'Эффект блесток, расходящихся от центра' },
    icon: <Zap size={24} color="#9370DB" />,
    color: '#9370DB',
    price: 2.1,
    duration: 13,
    type: 'sparkle-burst'
  }
];

interface CreativeEffectsSectionProps {
  onSelectEffect: (effect: CreativeEffect) => void;
  selectedEffects: CreativeEffect[];
  title: string;
}

const EffectPreview = ({ effect, isSelected }: { effect: CreativeEffect; isSelected: boolean }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const glowValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const sparkleValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    if (!isSelected) {
      // Reset all values when not selected
      animatedValue.setValue(0);
      glowValue.setValue(0);
      pulseValue.setValue(1);
      sparkleValue.setValue(0);
      return;
    }

    // Small delay to ensure proper initialization
    const initTimeout = setTimeout(() => {

    const startAnimations = () => {
      switch (effect.type) {
        case 'glow':
          glowValue.setValue(0);
          animationRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(glowValue, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: false,
              }),
              Animated.timing(glowValue, {
                toValue: 0.3,
                duration: 1200,
                useNativeDriver: false,
              }),
            ])
          );
          animationRef.current.start();
          break;
        case 'pulse':
        case 'frame-blinking':
          pulseValue.setValue(1);
          animationRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(pulseValue, {
                toValue: 1.15,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(pulseValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          );
          animationRef.current.start();
          break;
        case 'sparkle':
        case 'frame-glowing':
          sparkleValue.setValue(0);
          animationRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(sparkleValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
              }),
              Animated.timing(sparkleValue, {
                toValue: 0.2,
                duration: 1000,
                useNativeDriver: false,
              }),
            ])
          );
          animationRef.current.start();
          break;
        case 'rainbow':
          rotateAnim.setValue(0);
          animationRef.current = Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 5000,
              useNativeDriver: Platform.OS !== 'web',
            })
          );
          animationRef.current.start();
          break;
        case 'frame-floral':
        case 'frame-diamond':
        case 'frame-golden':
        case 'frame-neon':
          sparkleValue.setValue(0.5);
          animationRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(sparkleValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: false,
              }),
              Animated.timing(sparkleValue, {
                toValue: 0.5,
                duration: 1500,
                useNativeDriver: false,
              }),
            ])
          );
          animationRef.current.start();
          break;
        case 'star-rain':
        case 'heart-rain':
        case 'rose-rain':
        case 'snow-fall':
        case 'bubble-float':
          animatedValue.setValue(0);
          animationRef.current = Animated.loop(
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: false,
            })
          );
          animationRef.current.start();
          break;
        case 'fireworks':
        case 'confetti':
        case 'sparkle-burst':
          sparkleValue.setValue(0);
          animationRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(sparkleValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
              }),
              Animated.timing(sparkleValue, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: false,
              }),
            ])
          );
          animationRef.current.start();
          break;
      }
    };

      startAnimations();
    }, 50);

    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [isSelected, effect.type, animatedValue, glowValue, pulseValue, sparkleValue]);

  const getAnimatedStyle = () => {
    switch (effect.type) {
      case 'glow':
        return {
          shadowColor: effect.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowValue as unknown as number,
          shadowRadius: glowValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 10],
          }) as unknown as number,
          elevation: 6,
          borderWidth: 2,
          borderColor: effect.color,
        };
      case 'pulse':
      case 'frame-blinking':
        return {
          transform: [{ scale: pulseValue }],
          borderWidth: 2,
          borderColor: effect.color,
          shadowColor: effect.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: pulseValue.interpolate({
            inputRange: [1, 1.2],
            outputRange: [0.3, 0.8],
          }),
          shadowRadius: 6,
          elevation: 6,
        };
      case 'sparkle':
      case 'frame-glowing':
        return {
          opacity: sparkleValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.85, 1],
          }) as unknown as number,
          borderWidth: 2,
          borderColor: effect.color,
          shadowColor: effect.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'frame-floral':
        return {
          borderWidth: 3,
          borderColor: effect.color,
          borderStyle: 'dashed',
          opacity: sparkleValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }) as unknown as number,
          shadowColor: effect.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 6,
        };
      case 'frame-diamond':
        return {
          borderWidth: 2,
          borderColor: effect.color,
          opacity: sparkleValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1],
          }) as unknown as number,
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 6,
        };
      case 'frame-golden':
        return {
          borderWidth: 3,
          borderColor: effect.color,
          opacity: sparkleValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }) as unknown as number,
          shadowColor: '#FFD700',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 10,
          elevation: 8,
        };
      case 'frame-neon':
        return {
          borderWidth: 2,
          borderColor: effect.color,
          opacity: sparkleValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 1],
          }) as unknown as number,
          shadowColor: effect.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 14,
          elevation: 8,
        };
      case 'rainbow':
        return {
          borderWidth: 0,
        };
      case 'star-rain':
      case 'heart-rain':
      case 'rose-rain':
      case 'snow-fall':
      case 'bubble-float':
        return {
          borderWidth: 2,
          borderColor: effect.color,
          shadowColor: effect.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 10,
          elevation: 6,
          opacity: animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 1, 0.8],
          }) as unknown as number,
        };
      case 'fireworks':
      case 'confetti':
      case 'sparkle-burst':
        return {
          borderWidth: 2,
          borderColor: effect.color,
          transform: [{
            scale: sparkleValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.15],
            }) as unknown as number
          }],
          shadowColor: effect.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 12,
          elevation: 6,
        };
      default:
        return {};
    }
  };

  const renderParticleEffects = () => {
    if (!isSelected) return null;
    
    const particles = [];
    const particleCount = 8;
    
    switch (effect.type) {
      case 'star-rain':
        for (let i = 0; i < particleCount; i++) {
          const delay = (i * 0.1) % 1;
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: (i * 12) % 48,
                  top: -15,
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 70],
                      extrapolate: 'clamp',
                    })
                  }, {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]}
            >
              <Star size={6} color={effect.color} />
            </Animated.View>
          );
        }
        return particles;
      case 'heart-rain':
        for (let i = 0; i < particleCount; i++) {
          const delay = (i * 0.15) % 1;
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: (i * 10) % 40,
                  top: -12,
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 1, 1, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 65],
                      extrapolate: 'clamp',
                    })
                  }, {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.2, 0.8],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]}
            >
              <Heart size={5} color={effect.color} />
            </Animated.View>
          );
        }
        return particles;
      case 'rose-rain':
        for (let i = 0; i < particleCount; i++) {
          const delay = (i * 0.12) % 1;
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: (i * 11) % 44,
                  top: -15,
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 0.9, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 68],
                      extrapolate: 'clamp',
                    })
                  }, {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '270deg'],
                      extrapolate: 'clamp',
                    })
                  }, {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.3, 0.7],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]}
            >
              <Flower2 size={6} color={effect.color} />
            </Animated.View>
          );
        }
        return particles;
      case 'snow-fall':
        for (let i = 0; i < particleCount; i++) {
          const delay = (i * 0.08) % 1;
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: (i * 9) % 36,
                  top: -10,
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.1, 0.9, 1],
                    outputRange: [0, 0.9, 0.9, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 60],
                      extrapolate: 'clamp',
                    })
                  }, {
                    translateX: animatedValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, Math.sin(i) * 8, Math.sin(i) * 4],
                      extrapolate: 'clamp',
                    })
                  }, {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]}
            >
              <Snowflake size={5} color={effect.color} />
            </Animated.View>
          );
        }
        return particles;
      case 'bubble-float':
        for (let i = 0; i < 6; i++) {
          const delay = (i * 0.2) % 1;
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: (i * 14) % 42,
                  bottom: -15,
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 0.7, 0.7, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -70],
                      extrapolate: 'clamp',
                    })
                  }, {
                    translateX: animatedValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, Math.cos(i) * 6, Math.cos(i) * 3],
                      extrapolate: 'clamp',
                    })
                  }, {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1, 1.2],
                      extrapolate: 'clamp',
                    })
                  }]
                }
              ]}
            >
              <View style={[
                styles.bubble,
                {
                  borderColor: effect.color,
                  backgroundColor: effect.color + '20'
                }
              ]} />
            </Animated.View>
          );
        }
        return particles;
      case 'fireworks':
        for (let i = 0; i < 12; i++) {
          const angle = (i * 30) * Math.PI / 180;
          const colors = ['#FF6B35', '#FFD700', '#FF1493', '#00BFFF', '#32CD32', '#FF69B4'];
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: 18,
                  top: 18,
                  opacity: sparkleValue.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [{
                    translateX: sparkleValue.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0, Math.cos(angle) * 20, Math.cos(angle) * 30],
                    })
                  }, {
                    translateY: sparkleValue.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0, Math.sin(angle) * 20, Math.sin(angle) * 30],
                    })
                  }, {
                    scale: sparkleValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.2, 1.5, 0.5],
                    })
                  }]
                }
              ]}
            >
              <Sparkles size={3} color={colors[i % colors.length]} />
            </Animated.View>
          );
        }
        return particles;
      case 'confetti':
        for (let i = 0; i < 10; i++) {
          const colors = ['#FF6347', '#FFD700', '#FF69B4', '#00BFFF', '#32CD32', '#FF1493', '#FFA500'];
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: (i * 6) % 36,
                  top: -8,
                  opacity: sparkleValue.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [{
                    translateY: sparkleValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 55],
                    })
                  }, {
                    translateX: sparkleValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, Math.sin(i) * 10, Math.sin(i) * 5],
                    })
                  }, {
                    rotate: sparkleValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '720deg'],
                    })
                  }, {
                    scale: sparkleValue.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0.5, 1.2, 0.8],
                    })
                  }]
                }
              ]}
            >
              <View style={[
                styles.confettiPiece,
                { 
                  backgroundColor: colors[i % colors.length],
                  width: i % 2 === 0 ? 4 : 6,
                  height: i % 3 === 0 ? 3 : 5,
                }
              ]} />
            </Animated.View>
          );
        }
        return particles;
      case 'sparkle-burst':
        for (let i = 0; i < 8; i++) {
          const angle = (i * 45) * Math.PI / 180;
          particles.push(
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: 18,
                  top: 18,
                  opacity: sparkleValue.interpolate({
                    inputRange: [0, 0.2, 0.6, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [{
                    translateX: sparkleValue.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [0, Math.cos(angle) * 18, Math.cos(angle) * 25],
                    })
                  }, {
                    translateY: sparkleValue.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [0, Math.sin(angle) * 18, Math.sin(angle) * 25],
                    })
                  }, {
                    scale: sparkleValue.interpolate({
                      inputRange: [0, 0.4, 1],
                      outputRange: [0.3, 1.3, 0.6],
                    })
                  }, {
                    rotate: sparkleValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    })
                  }]
                }
              ]}
            >
              <Sparkles size={4} color={effect.color} />
            </Animated.View>
          );
        }
        return particles;
      default:
        return null;
    }
  };

  const renderFrameDecorations = () => {
    if (!isSelected) return null;
    
    switch (effect.type) {
      case 'frame-floral':
        return (
          <>
            {/* Corner flowers */}
            <View style={[styles.frameDecoration, { top: -6, left: -6 }]}>
              <Flower2 size={12} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: -6, right: -6 }]}>
              <Flower2 size={12} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -6, left: -6 }]}>
              <Flower2 size={12} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -6, right: -6 }]}>
              <Flower2 size={12} color={effect.color} />
            </View>
            {/* Side flowers */}
            <View style={[styles.frameDecoration, { top: -4, left: 15 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: -4, right: 15 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -4, left: 15 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -4, right: 15 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: 10, left: -4 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: 10, right: -4 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: 10, left: -4 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: 10, right: -4 }]}>
              <Flower2 size={10} color={effect.color} />
            </View>
          </>
        );
      case 'frame-diamond':
        return (
          <>
            <View style={[styles.frameDecoration, { top: -4, left: 8 }]}>
              <Gem size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: -4, right: 8 }]}>
              <Gem size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -4, left: 8 }]}>
              <Gem size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -4, right: 8 }]}>
              <Gem size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: 8, left: -3 }]}>
              <Gem size={8} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: 8, right: -3 }]}>
              <Gem size={8} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: 8, left: -3 }]}>
              <Gem size={8} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: 8, right: -3 }]}>
              <Gem size={8} color={effect.color} />
            </View>
          </>
        );
      case 'frame-golden':
        return (
          <>
            <View style={[styles.frameDecoration, { top: -4, left: 4 }]}>
              <Star size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: -4, right: 4 }]}>
              <Star size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -4, left: 4 }]}>
              <Star size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: -4, right: 4 }]}>
              <Star size={10} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: 8, left: -3 }]}>
              <Star size={8} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { top: 8, right: -3 }]}>
              <Star size={8} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: 8, left: -3 }]}>
              <Star size={8} color={effect.color} />
            </View>
            <View style={[styles.frameDecoration, { bottom: 8, right: -3 }]}>
              <Star size={8} color={effect.color} />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  const rainbowRing = useMemo(() => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.rainbowRing,
        {
          transform: [
            {
              rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) as unknown as string,
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF", "#FF0000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rainbowGradient}
      />
    </Animated.View>
  ), [rotateAnim]);

  return (
    <View style={{ position: 'relative', overflow: 'hidden' }}>
      <Animated.View testID={`effect-icon-${effect.id}`} style={[styles.effectIcon, { backgroundColor: effect.color + '20' }, getAnimatedStyle()]}>
        {effect.icon}
      </Animated.View>
      {effect.type === 'rainbow' && rainbowRing}
      {renderFrameDecorations()}
      {renderParticleEffects()}
    </View>
  );
};

export default function CreativeEffectsSection({ onSelectEffect, selectedEffects, title }: CreativeEffectsSectionProps) {
  const { language } = useLanguageStore();

  const isEffectSelected = (effect: CreativeEffect) => {
    return selectedEffects.some(selected => selected.id === effect.id);
  };

  return (
    <View style={styles.container}>
      <Text testID="effects-section-title" style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>
        {language === 'az'
          ? 'Elanınızı daha cəlbedici etmək üçün kreativ effektlər əlavə edin'
          : 'Добавьте креативные эффекты, чтобы сделать ваше объявление более привлекательным'
        }
      </Text>
      
      <View style={styles.effectsGrid}>
        {creativeEffects.map((effect) => {
          const isSelected = isEffectSelected(effect);
          
          return (
            <TouchableOpacity
              testID={`effect-card-${effect.id}`}
              key={effect.id}
              style={[
                styles.effectCard,
                isSelected && { borderColor: effect.color, borderWidth: 2 }
              ]}
              onPress={() => onSelectEffect(effect)}
            >
              <View style={styles.effectHeader}>
                <EffectPreview effect={effect} isSelected={isSelected} />
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: effect.color }]}>
                    <Check size={14} color="white" />
                  </View>
                )}
              </View>
              
              <Text style={styles.effectName}>
                {effect.name[language as keyof typeof effect.name]}
              </Text>
              
              <Text style={styles.effectDescription}>
                {effect.description[language as keyof typeof effect.description]}
              </Text>
              
              <View style={styles.effectDetails}>
                <Text style={styles.effectPrice}>
                  {effect.price} AZN
                </Text>
                <Text style={styles.effectDuration}>
                  {effect.duration} {language === 'az' ? 'gün' : 'дней'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {selectedEffects.length > 0 && (
        <View style={styles.selectedEffectsContainer}>
          <Text style={styles.selectedTitle}>
            {language === 'az' ? 'Seçilmiş Effektlər:' : 'Выбранные эффекты:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedEffects}>
            {selectedEffects.map((effect) => (
              <View key={effect.id} style={[styles.selectedEffect, { borderColor: effect.color }]}>
                <EffectPreview effect={effect} isSelected={true} />
                <Text style={styles.selectedEffectName}>
                  {effect.name[language as keyof typeof effect.name]}
                </Text>
                <Text style={styles.selectedEffectPrice}>
                  {effect.price} AZN
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              {language === 'az' ? 'Ümumi:' : 'Итого:'} {selectedEffects.reduce((sum, effect) => sum + effect.price, 0)} AZN
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text || '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary || '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  effectCard: {
    width: '48%',
    backgroundColor: Colors.card || '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border || '#E5E7EB',
    minHeight: 140,
  },
  effectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  effectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rainbowRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 46,
    height: 46,
    borderRadius: 23,
    zIndex: 1,
  },
  rainbowGradient: {
    flex: 1,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frameDecoration: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 1,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  effectName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text || '#1F2937',
    marginBottom: 4,
  },
  effectDescription: {
    fontSize: 12,
    color: Colors.textSecondary || '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
    flex: 1,
  },
  effectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  effectPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary || '#0E7490',
  },
  effectDuration: {
    fontSize: 12,
    color: Colors.textSecondary || '#6B7280',
  },
  selectedEffectsContainer: {
    backgroundColor: Colors.card || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#1F2937',
    marginBottom: 12,
  },
  selectedEffects: {
    marginBottom: 12,
  },
  selectedEffect: {
    backgroundColor: Colors.background || '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  selectedEffectIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedEffectName: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text || '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectedEffectPrice: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary || '#0E7490',
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border || '#E5E7EB',
    paddingTop: 12,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary || '#0E7490',
  },
  particle: {
    position: 'absolute',
    zIndex: 5,
  },
  confettiPiece: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  bubble: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});

export { CreativeEffect };