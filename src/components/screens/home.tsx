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
import db from "../../app/db";
import { id } from "@instantdb/react-native";

function Home({ page, setPage, panther, apps, setApps }) {
  console.log("Apps", apps);
  const { isLoading, error, data } = db.useQuery({ appslist: {} });
  if (isLoading) {
    return null;
  }
  if (error) {
    return null;
  }
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
          {data.appslist.reverse().map((element) => {
            return (
              <TouchableOpacity
                key={element.id}
                onPress={() => {
                  setPage(
                    `App_${element.id}_${element.appname}_${element.appdesc}` // so basically giving a name thats connected with _ and in index.tsx we split it when _ appears into parts -- if multiple 1,2,3,4,... so on.
                  );
                }}
              >
                <View className="shadow-lg w-24 h-24 bg-white/90 justify-center items-center rounded-xl"></View>
                <View className="items-center my-1 bg-white/80 shadow-lg rounded-xl">
                  <Text className="font-serif font-bold text-base">
                    {element.appname}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => setPage("AddApp")}>
            <View className="shadow-lg w-24 h-24 bg-white/90 justify-center items-center rounded-xl">
              <View className="absolute bg-black w-1.5 h-20 rounded-xl"></View>
              <View className="absolute bg-black w-20 h-1.5 rounded-xl"></View>
            </View>
            <View className="items-center my-1 bg-white/80 shadow-lg rounded-xl">
              <Text className="font-serif font-bold text-base">Add App</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View className="bg-white opacity-90 shadow-lg w-full h-24 items-center">
        <TouchableOpacity>
          <Text className="p-2 font-serif font-bold text-xl">Apps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Home;
