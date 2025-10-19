import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Login from "../components/screens/login";
import Home from "../components/screens/homescreen";
import Intro from "../components/screens/intro";
import db from "./db";

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);
  const { user, isLoading: authLoading } = db.useAuth();

  useEffect(() => {
    checkIntroStatus();
  }, []);

  const checkIntroStatus = async () => {
    try {
      const value = await AsyncStorage.getItem("hasSeenIntro");
      setHasSeenIntro(value === "true");
    } catch (error) {
      console.error("Error checking intro status:", error);
      setHasSeenIntro(false);
    }
  };

  const handleIntroComplete = async () => {
    try {
      await AsyncStorage.setItem("hasSeenIntro", "true");
      setHasSeenIntro(true);
    } catch (error) {
      console.error("Error saving intro status:", error);
    }
  };

  const handleSignOut = async () => {
    await db.auth.signOut();
  };

  if (authLoading || hasSeenIntro === null) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white text-xl">Loading...</Text>
      </View>
    );
  }

  if (!hasSeenIntro) {
    return <Intro onComplete={handleIntroComplete} />;
  }

  if (!user) {
    return (
      <Login
        isActive={isActive}
        setIsActive={setIsActive}
      />
    );
  }

  return <Home />;
}
