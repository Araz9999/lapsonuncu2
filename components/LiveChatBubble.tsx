import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LiveChatMessage } from '@/types/liveChat';
import { Check, CheckCheck } from 'lucide-react-native';

interface LiveChatBubbleProps {
  message: LiveChatMessage;
  isCurrentUser: boolean;
}

export default function LiveChatBubble({ message, isCurrentUser }: LiveChatBubbleProps) {
  const getStatusIcon = () => {
    if (!isCurrentUser) return null;
    
    switch (message.status) {
      case 'sending':
        return <View style={styles.statusDot} />;
      case 'sent':
        return <Check size={14} color="#999" />;
      case 'delivered':
        return <CheckCheck size={14} color="#999" />;
      case 'seen':
        return <CheckCheck size={14} color="#4CAF50" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isCurrentUser ? styles.currentUser : styles.otherUser]}>
      <View style={[styles.bubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        <Text style={[styles.message, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
          {message.message}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.time, isCurrentUser ? styles.currentUserTime : styles.otherUserTime]}>
            {formatTime(message.timestamp)}
          </Text>
          {getStatusIcon()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  currentUser: {
    alignItems: 'flex-end',
  },
  otherUser: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  message: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTime: {
    color: '#999',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
  },
});
