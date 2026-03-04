import React from "react";
import { View } from "react-native";

interface CrewmateSvgProps {
  color: string;
  size?: number;
}

export function CrewmateSvg({ color, size = 100 }: CrewmateSvgProps) {
  const scale = size / 100;
  return (
    <View style={{ width: size, height: size * 1.2, alignItems: "center" }}>
      {/* Body */}
      <View
        style={{
          width: 60 * scale,
          height: 80 * scale,
          backgroundColor: color,
          borderRadius: 30 * scale,
          borderBottomLeftRadius: 10 * scale,
          borderBottomRightRadius: 10 * scale,
          position: "absolute",
          top: 15 * scale,
        }}
      />
      {/* Visor */}
      <View
        style={{
          width: 35 * scale,
          height: 22 * scale,
          backgroundColor: "#94DBFA",
          borderRadius: 12 * scale,
          position: "absolute",
          top: 22 * scale,
          right: 12 * scale,
          borderWidth: 2 * scale,
          borderColor: "rgba(255,255,255,0.3)",
        }}
      />
      {/* Backpack */}
      <View
        style={{
          width: 18 * scale,
          height: 35 * scale,
          backgroundColor: color,
          borderRadius: 8 * scale,
          position: "absolute",
          top: 35 * scale,
          left: 2 * scale,
          opacity: 0.85,
        }}
      />
      {/* Left leg */}
      <View
        style={{
          width: 22 * scale,
          height: 20 * scale,
          backgroundColor: color,
          borderBottomLeftRadius: 10 * scale,
          borderBottomRightRadius: 10 * scale,
          position: "absolute",
          bottom: 0,
          left: 18 * scale,
        }}
      />
      {/* Right leg */}
      <View
        style={{
          width: 22 * scale,
          height: 20 * scale,
          backgroundColor: color,
          borderBottomLeftRadius: 10 * scale,
          borderBottomRightRadius: 10 * scale,
          position: "absolute",
          bottom: 0,
          right: 18 * scale,
        }}
      />
    </View>
  );
}
