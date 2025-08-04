import React from "react";
import { Text, View, Image, TouchableOpacity } from "react-native";

function AppDetail({ appData, setPage, panther }) {
  const { appId, appName, appDesc } = appData;

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
        <View className="mx-1 p-2 flex-col gap">
          <View>
            <Text className="p-3 font-serif font-bold text-xl">App Name</Text>
          </View>
          <View className="bg-white shadow-lg w-96 h-12 rounded-xl justify-center px-4">
            <Text className="font-serif text-lg">{appName}</Text>
          </View>
          <View>
            <Text className="p-3 font-serif font-bold text-xl">
              App Description
            </Text>
          </View>
          <View className="bg-white shadow-lg w-96 h-32 rounded-xl p-4">
            <Text className="font-serif text-base">{appDesc}</Text>
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

export default AppDetail;
