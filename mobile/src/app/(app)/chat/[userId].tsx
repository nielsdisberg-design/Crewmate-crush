import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";
import type { Message } from "@/lib/types";
import { CREWMATE_COLORS } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";

export default function ChatScreen() {
  const { userId, name, color } = useLocalSearchParams<{
    userId: string;
    name: string;
    color: string;
  }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);
  const colorHex =
    CREWMATE_COLORS.find((c) => c.id === color)?.hex || "#C51111";

  const { data: messages } = useQuery({
    queryKey: ["messages", userId],
    queryFn: () => api.get<Message[]>(`/api/messages/${userId}`),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (msgText: string) =>
      api.post<Message>(`/api/messages/${userId}`, { text: msgText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMutation.mutate(text.trim());
    setText("");
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === session?.user?.id;
    return (
      <View
        style={{
          alignSelf: isMe ? "flex-end" : "flex-start",
          maxWidth: "78%",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            backgroundColor: isMe ? "#C51111" : "#1E2340",
            borderRadius: 18,
            borderBottomRightRadius: isMe ? 4 : 18,
            borderBottomLeftRadius: isMe ? 18 : 4,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              color: "#FFFFFF",
              lineHeight: 21,
            }}
          >
            {item.text}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 10,
            color: "#3D4460",
            marginTop: 4,
            alignSelf: isMe ? "flex-end" : "flex-start",
          }}
        >
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <View
      testID="chat-screen"
      style={{ flex: 1, backgroundColor: "#0B0E1A" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#1E2340",
            gap: 10,
          }}
        >
          <TouchableOpacity
            testID="chat-back-button"
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <ChevronLeft size={28} color="#8B92A5" />
          </TouchableOpacity>
          <View style={{ width: 36, height: 42 }}>
            <CrewmateSvg color={colorHex} size={32} />
          </View>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 17,
              color: "#FFFFFF",
              flex: 1,
            }}
          >
            {name}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              paddingBottom: 16,
              gap: 10,
              borderTopWidth: 1,
              borderTopColor: "#1E2340",
            }}
          >
            <TextInput
              testID="chat-input"
              value={text}
              onChangeText={setText}
              placeholder="Send a message..."
              placeholderTextColor="#3D4460"
              style={{
                flex: 1,
                backgroundColor: "#151929",
                borderRadius: 20,
                paddingHorizontal: 18,
                paddingVertical: 12,
                fontSize: 15,
                color: "#FFFFFF",
                fontFamily: "Inter_400Regular",
                maxHeight: 100,
              }}
              multiline
            />
            <TouchableOpacity
              testID="send-button"
              onPress={handleSend}
              disabled={!text.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: text.trim() ? "#C51111" : "#1E2340",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Send
                size={20}
                color={text.trim() ? "#FFFFFF" : "#3D4460"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
