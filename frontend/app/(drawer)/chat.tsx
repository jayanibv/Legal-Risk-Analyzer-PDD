import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { chatWithBot } from '../../services/api';
import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
};

const TypingIndicator = ({ isDark, colors }: any) => {
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={[styles.messageBubble, styles.botBubble, { backgroundColor: colors.cardAlt, flexDirection: 'row', alignItems: 'center', height: 44, width: 70, justifyContent: 'center' }]}>
      <ActivityIndicator color={colors.primary} size="small" />
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I am your Legal Assistant. How can I help you today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: input.trim(), isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await chatWithBot(userMsg.text);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: responseText, isUser: false };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), text: "Sorry, I couldn't reach the server.", isUser: false };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text: string, isUser: boolean) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : colors.text }]}>
        {boldParts.map((bPart, bIndex) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            return <Text key={bIndex} style={{ fontWeight: 'bold' }}>{bPart.slice(2, -2)}</Text>;
          }
          
          const italicParts = bPart.split(/(\*[^\n*]+\*)/g);
          return italicParts.map((iPart, iIndex) => {
            if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
              return <Text key={`${bIndex}-${iIndex}`} style={{ fontStyle: 'italic' }}>{iPart.slice(1, -1)}</Text>;
            }
            return iPart;
          });
        })}
      </Text>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isLatest = index === messages.length - 1;
    return (
      <Animated.View 
        entering={isLatest ? (item.isUser ? SlideInRight.duration(300).springify() : SlideInLeft.duration(300).springify()) : undefined}
        style={[
          styles.messageBubble, 
          item.isUser ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.botBubble, { backgroundColor: colors.cardAlt }]
        ]}
      >
        {renderMessageText(item.text, item.isUser)}
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.bg, colors.cardAlt]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.chatContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity 
              style={styles.menuIcon}
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            >
              <Ionicons name="menu" size={28} color={colors.text} />
            </TouchableOpacity>
            <Image source={require('../../assets/images/mascot.jpg')} style={styles.mascotImg} resizeMode="contain" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.text }]}>AI Legal Assistant</Text>
              <Text style={{ color: colors.success, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>● Online</Text>
            </View>
          </Animated.View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            ListFooterComponent={() => loading ? <TypingIndicator isDark={isDark} colors={colors} /> : null}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={{ backgroundColor: colors.card, borderTopColor: colors.divider, borderTopWidth: 1 }}>
            <View style={[styles.inputContainer, { borderTopWidth: 0, paddingBottom: 8 }]}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.bg }]}
                placeholder="Ask a legal question..."
                placeholderTextColor={colors.textSecondary}
                value={input}
                onChangeText={setInput}
                multiline={false}
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
                maxLength={500}
                returnKeyType="send"
              />
              <TouchableOpacity 
                disabled={!input.trim() || loading}
                onPress={sendMessage}
              >
                <LinearGradient
                  colors={input.trim() ? [colors.primaryGradientStart || colors.primary, colors.primaryGradientEnd || colors.primary] : [colors.divider, colors.divider]}
                  style={styles.sendButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Ionicons name="send" size={20} color={input.trim() ? "#FFFFFF" : colors.textSecondary} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
              AI can make mistakes. Please verify important information.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  chatContainer: { flex: 1 },
  header: { padding: 16, paddingTop: Platform.OS === 'ios' ? 10 : 40, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  menuIcon: { marginRight: 16 },
  mascotImg: { width: 44, height: 44, borderRadius: 22 },
  title: { fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  messageList: { padding: 16, paddingBottom: 32 },
  messageRow: { flexDirection: 'row', marginBottom: 24, alignItems: 'flex-end' },
  messageBubble: { maxWidth: '85%', padding: 16, borderRadius: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  messageText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  disclaimerText: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4, paddingHorizontal: 16, paddingBottom: 16 },
  avatarBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  botAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: '#252A4A', borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 48, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular', marginRight: 12 },
  sendButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  typingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginLeft: 8 },
  typingDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 }
});
