import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useState } from "react";

const { height, width } = Dimensions.get("window");

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <View className="flex-1 relative bg-black">
      <View
        className="flex-1"
        style={{ paddingTop: height * 0.06, paddingBottom: 0 }}
      >
      {/* Dark gradient background */}
      <LinearGradient
        colors={["#0a1520", "#1a2f4a", "#1e3a5f", "#1a2f4a"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Bubbles decoration */}
      <Image
        source={require("../../../assets/images/bubbles.png")}
        className="absolute opacity-15"
        style={{
          top: -120,
          left: -60,
          width: width * 1.6,
          height: height * 0.65,
          tintColor: "#14b8a6",
        }}
        resizeMode="cover"
      />

      <View
        className="flex-1 bg-[#111] overflow-hidden rounded-t-3xl shadow-2xl"
        style={{
          marginHorizontal: width * 0.05,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
        {/* Image with dark vignette */}
        <View className="w-full relative" style={{ height: "70%" }}>
          <Image
            source={require("../../../assets/images/basiani.png")}
            className="w-full h-full"
            style={{ resizeMode: "cover" }}
          />
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.3)",
              "rgba(128,128,128,0.5)",
              "rgba(0,0,0,0.8)",
              "#000000",
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        {/* Event info section */}
        <View className="w-full flex-1 px-8 py-8 bg-black justify-center">
          <Text
            className="text-white uppercase mb-4"
            style={{
              fontSize: 52,
              fontWeight: "900",
              letterSpacing: -2,
              textShadowColor: "rgba(0,0,0,0.8)",
              textShadowOffset: { width: 0, height: 4 },
              textShadowRadius: 12,
            }}
          >
            BASIANI
          </Text>
          <View
            className="rounded-full self-start border border-white/20"
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text
              className="text-white"
              style={{
                fontSize: 15,
                fontWeight: "600",
                letterSpacing: 1.2,
              }}
            >
              17.10.25 • 23:59
            </Text>
          </View>
        </View>
      </View>
      </View>

      {/* Footer Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-black border-t border-white/10" style={{ paddingBottom: 20, paddingTop: 15 }}>
        <View className="flex-row justify-around items-center px-8">
          {/* Home Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab("home")}
            className="items-center flex-1"
          >
            <View className={`w-10 h-10 rounded-full items-center justify-center ${activeTab === "home" ? "bg-white/20" : ""}`}>
              <Text className={`text-2xl ${activeTab === "home" ? "text-white" : "text-white/40"}`}>🏠</Text>
            </View>
            <Text className={`text-xs mt-1 ${activeTab === "home" ? "text-white" : "text-white/40"}`} style={{ fontWeight: activeTab === "home" ? "600" : "400" }}>Home</Text>
          </TouchableOpacity>

          {/* Friends Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab("friends")}
            className="items-center flex-1"
          >
            <View className={`w-10 h-10 rounded-full items-center justify-center ${activeTab === "friends" ? "bg-white/20" : ""}`}>
              <Text className={`text-2xl ${activeTab === "friends" ? "text-white" : "text-white/40"}`}>👥</Text>
            </View>
            <Text className={`text-xs mt-1 ${activeTab === "friends" ? "text-white" : "text-white/40"}`} style={{ fontWeight: activeTab === "friends" ? "600" : "400" }}>Friends</Text>
          </TouchableOpacity>

          {/* Settings Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab("settings")}
            className="items-center flex-1"
          >
            <View className={`w-10 h-10 rounded-full items-center justify-center ${activeTab === "settings" ? "bg-white/20" : ""}`}>
              <Text className={`text-2xl ${activeTab === "settings" ? "text-white" : "text-white/40"}`}>⚙️</Text>
            </View>
            <Text className={`text-xs mt-1 ${activeTab === "settings" ? "text-white" : "text-white/40"}`} style={{ fontWeight: activeTab === "settings" ? "600" : "400" }}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
