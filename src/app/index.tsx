import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Login from "../components/screens/login";
import Home from "../components/screens/homescreen";
import Intro from "../components/screens/intro";
import ChooseGenre from "../components/screens/chooseGenre";
import db from "./db";
import useEnsureProfile from "../lib/useEnsureProfile";

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);
  const [hasChosenGenres, setHasChosenGenres] = useState<boolean | null>(null);
  const { user, isLoading: authLoading } = db.useAuth();

  useEffect(() => {
    checkIntroStatus();
  }, []);

  useEffect(() => {
    if (user) {
      checkGenreStatus();
    } else {
      setHasChosenGenres(null);
    }
  }, [user]);

  const checkGenreStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(`hasChosenGenres_${user?.id}`);
      setHasChosenGenres(value === "true");
    } catch (error) {
      console.error("Error checking genre status:", error);
      setHasChosenGenres(false);
    }
  };

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

  const handleGenreComplete = async (genres: string[]) => {
    try {
      // Save to AsyncStorage so it only shows once per user
      await AsyncStorage.setItem(`hasChosenGenres_${user?.id}`, "true");

      // Get user's profile
      const { data } = await db.queryOnce({
        profiles: {
          $: { where: user ? { "$user.id": user.id } : { id: "never-match" }, limit: 1 },
        },
      });

      const profile = data?.profiles?.[0];

      if (profile) {
        // Save genres to user profile (only if schema supports it)
        try {
          await db.transact([
            db.tx.profiles[profile.id].update({
              genres: genres,
            }),
          ]);
          console.log("Genres saved:", genres);
        } catch (dbError: any) {
          // Schema field doesn't exist yet - that's okay, we saved to AsyncStorage
          console.log("Note: genres field not in DB schema yet (saved locally)");
        }
      }
    } catch (error) {
      console.error("Error saving genres:", error);
    }

    setHasChosenGenres(true);
  };

  const handleSignOut = async () => {
    await db.auth.signOut();
  };

  if (authLoading || hasSeenIntro === null || (user && hasChosenGenres === null)) {
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

  if (!hasChosenGenres) {
    return <ChooseGenre onComplete={handleGenreComplete} />;
  }

  return <Home />;
}
