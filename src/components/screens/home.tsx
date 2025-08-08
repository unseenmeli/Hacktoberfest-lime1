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
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import db from "../../app/db";
import { id } from "@instantdb/react-native";

function Home({
  page,
  setPage,
  panther,
  apps,
  setApps,
  isActive,
  setIsActive,
}) {
  const { width } = useWindowDimensions();
  const { user } = db.useAuth();

  const { isLoading, error, data } = db.useQuery(
    user ? { 
      appslist: { $: { where: { creatorId: user.id } } } 
    } : null
  );

  if (!user || isLoading) {
    return null;
  }
  if (error) {
    return null;
  }
  if (!data || !data.appslist) {
    return null;
  }
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
        <View className="flex-row mx-2 py-2 gap-2.5 flex-wrap justify-center">
          {data.appslist.toReversed().map((element) => {
            return (
              <TouchableOpacity
                key={element.id}
                onPress={() => {
                  setPage(
                    `App_${element.id}_${encodeURIComponent(element.code)}` // so basically giving a name thats connected with _ and in index.tsx we split it when _ appears into parts -- if multiple 1,2,3,4,... so on.
                  );
                }}
              >
                <View className="items-center">
                  <View
                    style={{
                      width: 88,
                      height: 88,
                      backgroundColor: isActive
                        ? "rgba(0, 0, 0, 0.85)"
                        : "rgba(255, 255, 255, 0.95)",
                      borderRadius: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    {element.logo ? (
                      <Image
                        source={{
                          uri: `data:image/jpeg;base64,${element.logo}`,
                        }}
                        style={{ width: 88, height: 88, borderRadius: 12 }}
                      />
                    ) : (
                      <Text
                        style={{
                          fontSize: 36,
                          fontFamily: "serif",
                          fontWeight: "bold",
                          color: isActive ? "#ffffff" : "#000000",
                        }}
                      >
                        {element.appname.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      marginTop: 4,
                      backgroundColor: isActive
                        ? "rgba(0, 0, 0, 0.85)"
                        : "rgba(255, 255, 255, 0.9)",
                      borderRadius: 12,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.22,
                      shadowRadius: 2.22,
                      elevation: 3,
                    }}
                  >
                    <Text
                      className={`font-serif font-bold text-sm ${
                        isActive ? "color-white" : null
                      } `}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{ width: 84, textAlign: "center" }}
                    >
                      {element.appname}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => setPage("AddApp")}>
            <View className="items-center">
              <View
                style={{
                  width: 88,
                  height: 88,
                  backgroundColor: isActive
                    ? "rgba(0, 0, 0, 0.9)"
                    : "rgba(255, 255, 255, 0.9)",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    width: 6,
                    height: 72,
                    backgroundColor: isActive ? "#ffffff" : "#000000",
                    borderRadius: 12,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    width: 72,
                    height: 6,
                    backgroundColor: isActive ? "#ffffff" : "#000000",
                    borderRadius: 12,
                  }}
                />
              </View>
              <View
                style={{
                  marginTop: 4,
                  backgroundColor: isActive
                    ? "rgba(0, 0, 0, 0.8)"
                    : "rgba(255, 255, 255, 0.8)",
                  borderRadius: 12,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.22,
                  shadowRadius: 2.22,
                  elevation: 3,
                }}
              >
                <Text
                  className={`font-serif font-bold text-sm ${
                    isActive ? "color-white" : null
                  } `}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ width: 84, textAlign: "center" }}
                >
                  Add App
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View
        className={`shadow-lg w-full h-24 items-center ${
          isActive ? "bg-black/95" : "bg-white/95"
        }`}
      >
        <TouchableOpacity>
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

export default Home;
