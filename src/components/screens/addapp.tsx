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

function AddApp({ page, setPage, panther }) {
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
      <View className="flex-1 items-center">
        <View className="mx-1 p-2 flec-col gap">
          <View className="h-72 items-center flex-row">
            <View className="absolute -mx-2">
              <Text className="shadow-xl font-serif mx-36 font-bold text-8xl">
                Logo
              </Text>
            </View>
            <View className="absolute">
              <Text className="shadow-xl font-serif -mx-1 font-bold text-8xl">
                Logo
              </Text>
            </View>
            <View className="absolute">
              <View className="absolute mx-28 -my-20 bg-black shadow-2xl h-40 w-40 rounded-full"></View>
            </View>
            <TouchableOpacity>
              <View className="-my-20 mx-28 absolute bg-white shadow-2xl h-40 w-40 rounded-full">
                <View className="flex-1 justify-center items-center">
                  <View className="absolute bg-black w-1.5 h-20 rounded-xl"></View>
                  <View className="absolute bg-black w-20 h-1.5 rounded-xl"></View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <View>
            <Text className="p-3 font-serif font-bold text-xl">App Name</Text>
          </View>
          <View className="bg-white shadow-lg w-96 h-12 rounded-xl">
            <TextInput
              className="p-3 font-serif italic font-bold"
              placeholder="App name here"
            ></TextInput>
          </View>
          <View>
            <Text className="p-3 font-serif font-bold text-xl">
              App Description
            </Text>
          </View>
          <View className="bg-white shadow-lg w-96 h-32 rounded-xl">
            <TextInput
              className="p-3 font-serif italic font-bold"
              textAlignVertical="top"
              multiline={true}
              numberOfLines={6}
              placeholder="App description here"
            ></TextInput>
          </View>
        </View>
      </View>
      <View className="bg-white opacity-80 shadow-lg w-full h-24 items-center">
        <TouchableOpacity
          onPress={() => {
            setPage("home");
          }}
        >
          <Text className="p-2 font-serif font-bold text-xl">Apps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default AddApp;
