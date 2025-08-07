import { transform } from "@babel/core";
import { Link } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  Text,
  View,
  Image,
  Animated,
  useAnimatedValue,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import db from "../../app/db";
import { id } from "@instantdb/react-native";

function SettingsP({
  panther,
  page,
  setPage,
  apps,
  setApps,
  isActive,
  setIsActive,
}) {
  const { user } = db.useAuth();
  return (
    <View className={`flex-1 ${isActive ? "bg-black" : "bg-white"}`}>
      <Image
        className="flex-1 absolute rotate-90 -mx-96 p-10 -my-10 opacity-60"
        source={panther}
      />
      <View
        className={`shadow-lg w-full h-32 flex justify-end ${
          isActive ? "bg-black/95 !important" : "bg-white/95"
        }`}
      >
        <View className="w-full h-16 justify-center">
          <View className="flex-row justify-between w-full h-12 items-center">
            <TouchableOpacity
              onPress={() => {
                setPage("home");
              }}
              className="flex-col gap-0.5 px-4"
            >
              <View
                className={`bg-black w-8 h-1 rounded-xl ${
                  isActive ? "bg-white" : null
                } `}
              ></View>
              <View
                className={`bg-black w-8 h-1 rounded-xl ${
                  isActive ? "bg-white" : null
                } `}
              ></View>
              <View
                className={`bg-black w-8 h-1 rounded-xl ${
                  isActive ? "bg-white" : null
                } `}
              ></View>
            </TouchableOpacity>
            <View className="absolute mx-44 px-2">
              <Text
                className={`font-serif font-bold text-xl ${
                  isActive ? "color-white" : null
                } `}
              >
                OneShot
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await db.auth.signOut();
                  setPage("login");
                } catch (error) {
                  console.error("Sign out error:", error);
                  setPage("login");
                }
              }}
            >
              <View className="px-4">
                <Text
                  className={`font-serif font-bold text-xl ${
                    isActive ? "color-white" : null
                  } `}
                >
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="flex-1">
        <View
          className={`m-10 flex-1 rounded-xl opacity-100 shadow-md items-center justify-center ${
            isActive ? "bg-black shadow-white" : "bg-white"
          }`}
        >
          <View className="flex-1 justify-center items-center">
            {user && (
              <View className="mb-8">
                <Text
                  className={`font-bold font-serif text-xl text-center mb-2 ${
                    isActive ? "color-white" : null
                  }`}
                >
                  Logged in as:
                </Text>
                <Text
                  className={`font-serif font-bold text-base text-center ${
                    isActive ? "color-white/80" : "color-gray-600"
                  }`}
                >
                  {user.email}
                </Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Text
                className={`font-bold font-serif text-xl ${
                  isActive ? "color-white" : null
                } `}
              >
                Dark theme:{" "}
              </Text>
              <View className="items-center justify-center ">
                <TouchableOpacity
                  onPress={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-lg ${
                    isActive ? "bg-white" : "bg-black"
                  }`}
                >
                  <Text
                    className={
                      isActive
                        ? "text-black font-bold font-serif"
                        : "text-white font-bold font-serif"
                    }
                  >
                    {isActive ? "On" : "Off"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View
        className={`shadow-lg w-full h-24 items-center ${
          isActive ? "bg-black/95 shadow-white" : "bg-white/95"
        } `}
      >
        <TouchableOpacity onPress={() => setPage("AddApp")}>
          <Text
            className={`p-2 font-serif font-bold text-xl ${
              isActive ? "color-white" : null
            }`}
          >
            Apps
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default SettingsP;
