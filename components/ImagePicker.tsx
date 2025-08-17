import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, Platform } from 'react-native';
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
    if (Platform.OS !== 'web') {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access gallery is required!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const imageUris = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...imageUris]);
    }
  };

  const sendImages = () => {
    if (selectedImages.length > 0) {
      selectedImages.forEach(uri => {
        const attachment: MessageAttachment = {
          id: Date.now().toString(),
          type: 'image',
          uri: uri,
          name: 'image.jpg',
          size: 0,
          mimeType: 'image/jpeg'
        };

        const message = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          senderId: 'user1',
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
    }
  };

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.selectedImage} />
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