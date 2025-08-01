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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AddApp({ page, setPage, panther }) {
  return (
    <View className="flex-1 justify-center items-center">
      <Text>hello this is AddApp</Text>
    </View>
  );
}

function Home({ page, setPage, panther }) {
  return (
    <View className="flex-1">
      <Image
        className="flex-1 absolute rotate-90 -mx-96 p-10 -my-10 opacity-60"
        source={panther}
      />
      <View className="bg-white/80 shadow-lg w-full h-32 flex justify-end">
        <View className="w-full h-16 justify-center">
          <View className="flex-row justify-between w-full h-12 items-center">
            <TouchableOpacity className="flex-col gap-0.5 px-4">
              <View className="bg-black w-8 h-1 rounded-xl"></View>
              <View className="bg-black w-8 h-1 rounded-xl"></View>
              <View className="bg-black w-8 h-1 rounded-xl"></View>
            </TouchableOpacity>
            <View className="absolute mx-44 px-2">
              <Text className="font-serif font-bold text-xl">OneShot</Text>
            </View>
            <TouchableOpacity>
              <View className="px-4">
                <Text className="font-serif font-bold text-xl">Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="flex-1">
        <View className="flex-row mx-1 p-2 gap-4 flex-wrap">
          <TouchableOpacity onPress={() => setPage("AddApp")}>
            <View className="shadow-lg w-24 h-24 bg-white/80 justify-center items-center rounded-xl">
              <View className="absolute bg-black w-1.5 h-20 rounded-xl"></View>
              <View className="absolute bg-black w-20 h-1.5 rounded-xl"></View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View className="bg-white opacity-80 shadow-lg w-full h-24 items-center">
        <TouchableOpacity>
          <Text className="p-2 font-serif font-bold text-xl">Apps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Home;
