import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MessageCircle } from "lucide-react-native";
import { api } from "@/lib/api/api";
import { CREWMATE_COLORS } from "@/lib/types";
import type { Profile } from "@/lib/types";
import { CrewmateSvg } from "@/components/CrewmateSvg";

export default function MatchesScreen() {
  const {
    data: matches,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["matches"],
    queryFn: () => api.get<Profile[]>("/api/matches"),
  });

  const renderMatch = ({
    item,
    index,
  }: {
    item: Profile;
    index: number;
  }) => {
    const colorHex =
      CREWMATE_COLORS.find((c) => c.id === item.crewmateColor)?.hex ||
      "#C51111";
    return (
      <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
        <TouchableOpacity
          testID={`match-${item.userId}`}
          onPress={() =>
            router.push({
              pathname: "/(app)/chat/[userId]" as any,
              params: {
                userId: item.userId,
                name: item.displayName,
                color: item.crewmateColor,
              },
            })
          }
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: "#151929",
            borderRadius: 16,
            marginBottom: 10,
            gap: 14,
          }}
        >
          <View
            style={{
              width: 56,
              height: 64,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CrewmateSvg color={colorHex} size={50} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              {item.displayName}
            </Text>
            {item.lastMessage ? (
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: "#8B92A5",
                  marginTop: 4,
                }}
              >
                {item.lastMessage.text}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: "#38FEDC",
                  marginTop: 4,
                }}
              >
                New match! Say hello
              </Text>
            )}
          </View>
          <MessageCircle size={20} color="#3D4460" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View
      testID="matches-screen"
      style={{ flex: 1, backgroundColor: "#0B0E1A" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 22,
              color: "#FFFFFF",
            }}
          >
            Matches
          </Text>
        </View>

        {isLoading ? (
          <View
            testID="matches-loading"
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#C51111" />
          </View>
        ) : !matches || matches.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 32,
            }}
          >
            <CrewmateSvg color="#3D4460" size={80} />
            <Text
              style={{
                fontFamily: "Orbitron_700Bold",
                fontSize: 18,
                color: "#8B92A5",
                marginTop: 24,
              }}
            >
              No matches yet
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#3D4460",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Keep swiping to find your crewmate!
            </Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
