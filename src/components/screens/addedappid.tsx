import React, { useState, useEffect } from "react";
import { Text, View, Image, TouchableOpacity, ScrollView } from "react-native";
import db from "../../app/db";
import { executeAppCode } from "../../utils/codeExecutor";

function AppDetail({ appData, setPage, panther, isActive, setIsActive }) {
  const { appId } = appData;
  const [codeResult, setCodeResult] = useState(null);
  const [codeError, setCodeError] = useState(null);

  const { isLoading, error, data } = db.useQuery({
    appslist: {
      $: {
        where: {
          id: appId,
        },
      },
    },
  });

  const app = data?.appslist?.[0];

  const displayAppName = app?.appname;
  const displayAppDesc = app?.appdesc;
  const displayCode = app?.code;

  useEffect(() => {
    executeAppCode(displayCode, setCodeResult, setCodeError);
  }, [displayCode]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text
          className={`font-serif text-xl ${
            isActive ? "color-white" : "color-black"
          }`}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text
          className={`font-serif text-xl ${
            isActive ? "color-white" : "color-black"
          }`}
        >
          Error loading app
        </Text>
      </View>
    );
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
      <View className="flex-1 items-center justify-center p-8">
        <View
          className={` shadow-lg w-full h-full rounded-xl p-4 ${
            isActive ? "bg-black/95" : "bg-white/95"
          }`}
        >
          {codeError ? (
            <Text
              className={`font-serif text-base ${
                isActive ? "color-red-400" : "color-red-600"
              }`}
            >
              Error: {codeError}
            </Text>
          ) : codeResult ? (
            <ScrollView>{codeResult}</ScrollView>
          ) : (
            <Text
              className={`font-serif font-bold text-base ${
                isActive ? "color-white" : null
              }`}
            >
              Evaluating...
            </Text>
          )}
        </View>
      </View>
      <View
        className={` opacity-90 shadow-lg w-full h-24 items-center ${
          isActive ? "bg-black/90" : "bg-white"
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
