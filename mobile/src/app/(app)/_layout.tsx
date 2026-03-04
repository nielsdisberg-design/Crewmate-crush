import React from "react";
import { Tabs } from "expo-router";
import { Rocket, Heart, User, Sparkles } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import type { Profile } from "@/lib/types";

export default function AppLayout() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<Profile | null>("/api/profiles/me"),
  });

  // If profile isn't complete, show onboarding instead of tabs
  if (!isLoading && (!profile || !profile.isComplete)) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="onboarding" options={{ href: "/onboarding" as any }} />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="likes" options={{ href: null }} />
        <Tabs.Screen name="matches" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="chat/[userId]" options={{ href: null }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D1020",
          borderTopColor: "#1E2340",
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#C51111",
        tabBarInactiveTintColor: "#3D4460",
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Rocket size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: "Likes",
          tabBarIcon: ({ color, size }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => (
            <Sparkles size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="chat/[userId]" options={{ href: null }} />
    </Tabs>
  );
}
