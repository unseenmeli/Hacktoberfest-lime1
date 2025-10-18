import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Login from "../components/screens/login";
import db from "./db";

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const { user, isLoading: authLoading } = db.useAuth();

  const handleSignOut = async () => {
    await db.auth.signOut();
  };

  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="font-serif text-xl">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <Login
        isActive={isActive}
        setIsActive={setIsActive}
      />
    );
  }

  return (
    <View className={`flex-1 justify-center items-center ${isActive ? "bg-black" : "bg-white"}`}>
      <View className={`bg-white/95 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-8 ${isActive ? "bg-black/95" : ""}`}>
        <Text className={`font-serif font-bold text-3xl text-center mb-8 ${isActive ? "color-white" : ""}`}>
          Welcome!
        </Text>
        <Text className={`font-serif text-base mb-6 text-center ${isActive ? "color-white" : ""}`}>
          You are logged in as:
        </Text>
        <Text className={`font-serif text-lg mb-8 text-center font-bold ${isActive ? "color-white" : ""}`}>
          {user.email}
        </Text>
        <TouchableOpacity
          onPress={handleSignOut}
          className={`bg-black rounded-xl p-4 ${isActive ? "bg-white" : ""}`}
        >
          <Text className={`font-serif font-bold text-center text-white text-lg ${isActive ? "color-black" : ""}`}>
            Sign Out
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsActive(!isActive)}
          className="mt-6"
        >
          <Text className={`font-serif text-center ${isActive ? "color-white" : "color-gray-600"}`}>
            Toggle {isActive ? "Light" : "Dark"} Mode
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
