import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform } from 'react-native';
import { Image } from 'expo-image'; // BUG FIX: Use expo-image for better performance
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useMessageStore } from '@/store/messageStore';
import { MessageAttachment } from '@/types/message';

type ImagePickerProps = {
  conversationId: string;
  onClose: () => void;
};

export default function ImagePickerComponent({ conversationId, onClose }: ImagePickerProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { addMessage } = useMessageStore();

  const pickImages = async () => {
    try {
      // BUG FIX: Request permissions with proper error handling
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          alert('Permission to access gallery is required!');
          return;
        }
      }

      // BUG FIX: Reduced quality for better performance and smaller file sizes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8, // Reduced from 1 to compress images
        allowsEditing: false,
      });

      // BUG FIX: Validate assets array exists and has items
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // BUG FIX: Limit to maximum 10 images to prevent memory issues
        const maxImages = 10;
        const currentCount = selectedImages.length;
        
        if (currentCount >= maxImages) {
          alert(`Maximum ${maxImages} images allowed`);
          return;
        }
        
        const availableSlots = maxImages - currentCount;
        const imageUris = result.assets.slice(0, availableSlots).map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...imageUris]);
      }
    } catch (error) {
      // BUG FIX: Added error handling
      console.error('Error picking images:', error);
      alert('Failed to pick images. Please try again.');
    }
  };

  const sendImages = () => {
    // BUG FIX: Added validation
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      selectedImages.forEach((uri, index) => {
        // BUG FIX: Added unique ID generation to prevent conflicts
        const uniqueId = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        
        const attachment: MessageAttachment = {
          id: uniqueId,
          type: 'image',
          uri: uri,
          name: `image_${index + 1}.jpg`,
          size: 0, // BUG FIX: TODO - Get actual file size for validation
          mimeType: 'image/jpeg'
        };

        const message = {
          id: uniqueId,
          senderId: 'user1', // BUG FIX: TODO - Get from actual user context
          receiverId: 'user2',
          listingId: '1',
          text: '',
          type: 'image' as const,
          attachments: [attachment],
          createdAt: new Date().toISOString(),
          isRead: false,
          isDelivered: true,
        };

        addMessage(conversationId, message);
      });
      
      setSelectedImages([]);
      onClose();
    } catch (error) {
      // BUG FIX: Added error handling
      console.error('Error sending images:', error);
      alert('Failed to send images. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image 
        source={{ uri: item }} 
        style={styles.selectedImage}
        // BUG FIX: Add caching and performance optimizations
        cachePolicy="memory-disk"
        transition={200}
        contentFit="cover"
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => setSelectedImages(prev => prev.filter(uri => uri !== item))}
      >
        <Text style={styles.removeButtonText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Images</Text>
      <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
        <Text style={styles.pickButtonText}>Pick Images from Gallery</Text>
      </TouchableOpacity>
      {selectedImages.length > 0 && (
        <>
          <FlatList
            data={selectedImages}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            style={styles.imageList}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendImages}>
            <Text style={styles.sendButtonText}>Send Images ({selectedImages.length})</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: '50%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  pickButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageList: {
    marginBottom: 15,
    maxHeight: 100,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: Colors.success,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  closeButtonText: {
    color: Colors.textSecondary,
  },
});