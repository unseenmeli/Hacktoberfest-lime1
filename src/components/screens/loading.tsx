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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Loading({ onLoadingComplete, isActive, panther }) {
  const textSlide = useRef(new Animated.Value(-500)).current;
  useEffect(() => {
    Animated.timing(textSlide, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [textSlide]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 3000);
  });

  return (
    <View className={`flex-1 ${isActive ? "bg-black" : "bg-white"}`}>
      <Image
        className="flex-1 absolute rotate-90 -mx-96 p-10 -my-10 opacity-60"
        source={panther}
      />
      <View className="flex-1 justify-center items-center">
        <Animated.Text
          className={`py-1 px-3 shadow-lg font-serif text-3xl font-bold rounded-md ${
            isActive ? "bg-black color-white shadow-white" : "bg-white"
          }`}
          style={{
            transform: [{ translateX: textSlide }],
          }}
        >
          Welcome to OneShot!
        </Animated.Text>
      </View>
    </View>
  );
}

export default Loading;
