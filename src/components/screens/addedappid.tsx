import React from "react";
import { Text, View, Image, TouchableOpacity } from "react-native";

function AppDetail({ appData, setPage, panther, isActive, setIsActive }) {
  const { appId, appName, appDesc } = appData;

  return (
    <View className="flex-1">
      <Image
        className="flex-1 absolute rotate-90 -mx-96 p-10 -my-10"
        source={panther}
      />
      <View
        className={`bg-white/80 shadow-lg w-full h-32 flex justify-end ${
          isActive ? "bg-black/95" : null
        }`}
      >
        <View className="w-full h-16 justify-center">
          <View className="flex-row justify-between w-full h-12 items-center">
            <TouchableOpacity
              onPress={() => {
                setPage("settings");
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
            <TouchableOpacity>
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
      <View className="flex-1 items-center">
        <View className="mx-1 p-2 flex-col gap">
          <View className={` rounded-xl ${isActive ? "bg-black/20" : null}`}>
            <Text
              className={`p-3 font-serif font-bold text-xl ${
                isActive ? "color-white" : null
              }`}
            >
              App Name
            </Text>
          </View>
          <View
            className={`bg-white shadow-lg w-96 h-32 rounded-xl p-4 ${
              isActive ? "bg-black/95" : null
            }`}
          >
            <Text
              className={`font-serif font-bold text-base ${
                isActive ? "color-white" : null
              }`}
            >
              {appName}
            </Text>
          </View>
          <View className={` rounded-xl ${isActive ? "bg-black/20" : null}`}>
            <Text
              className={`p-3 font-serif font-bold text-xl ${
                isActive ? "color-white" : null
              }`}
            >
              App Description
            </Text>
          </View>
          <View
            className={`bg-white shadow-lg w-96 h-32 rounded-xl p-4 ${
              isActive ? "bg-black/95" : null
            }`}
          >
            <Text
              className={`font-serif font-bold text-base ${
                isActive ? "color-white" : null
              }`}
            >
              {appDesc}
            </Text>
          </View>
        </View>
      </View>
      <View
        className={`bg-white opacity-90 shadow-lg w-full h-24 items-center ${
          isActive ? "bg-black/90" : null
        }`}
      >
        <TouchableOpacity
          onPress={() => {
            setPage("home");
          }}
        >
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

export default AppDetail;
