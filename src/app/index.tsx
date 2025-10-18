import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Login from "../components/screens/login";
import Home from "../components/screens/homescreen";
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

  return <Home />;
}
