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
import RenderHtml from "react-native-render-html";

// const htmlContent = `
//     <h1>Welcome to My App</h1>
//     <p>This is a <strong>paragraph</strong> with some <em>styled text</em>.</p>
//     <ul>
//       <h2>we imported html into jsx</h2>
//       <h2>arent we cool chat</h2>
//     </ul>
//     <div>
//       <p>This is a styled div</p>
//     </div>
//   `;

// const tagsStyles = {
//   h1: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
//   p: { fontSize: 16, marginBottom: 10 },
//   strong: { fontWeight: "bold" },
//   em: { fontStyle: "italic" },
//   ul: { marginLeft: 20 },
//   li: { marginBottom: 5 },
// };

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
        className="flex-1 absolute rotate-90 -mx-96 p-10 -my-10"
        source={panther}
      />
      <View
        className={`bg-white/80 shadow-lg w-full h-32 flex justify-end ${
          isActive ? "bg-black/95 shadow-white" : null
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
      <View className="flex-1">
        <View className="flex-row mx-1 p-2 gap-3.5 flex-wrap">
          {data.appslist.toReversed().map((element) => {
            return (
              <TouchableOpacity
                key={element.id}
                onPress={() => {
                  setPage(
                    `App_${element.id}_${element.appname}_${
                      element.appdesc
                    }_${encodeURIComponent(element.code)}` // so basically giving a name thats connected with _ and in index.tsx we split it when _ appears into parts -- if multiple 1,2,3,4,... so on.
                  );
                }}
              >
                <View
                  className={`shadow-lg w-24 h-24 bg-white/95 justify-center items-center rounded-xl ${
                    isActive ? "bg-black/85" : null
                  }`}
                ></View>
                <View
                  className={`items-center my-1 bg-white/90 shadow-lg rounded-xl ${
                    isActive ? "bg-black/85" : null
                  } `}
                >
                  <Text
                    className={`font-serif font-bold text-base ${
                      isActive ? "color-white" : null
                    } `}
                  >
                    {element.appname}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            className="px-0.5"
            onPress={() => setPage("AddApp")}
          >
            <View
              className={`shadow-lg w-24 h-24 bg-white/90 justify-center items-center rounded-xl ${
                isActive ? "bg-black/90" : null
              }`}
            >
              <View
                className={`absolute bg-black w-1.5 h-20 rounded-xl ${
                  isActive ? "bg-white" : null
                } `}
              ></View>
              <View
                className={`absolute bg-black w-1.5 h-20 rounded-xl rotate-90 ${
                  isActive ? "bg-white" : null
                } `}
              ></View>
            </View>
            <View
              className={`items-center my-1 bg-white/80 shadow-lg rounded-xl ${
                isActive ? "bg-black/80" : null
              } `}
            >
              <Text
                className={`font-serif font-bold text-base ${
                  isActive ? "color-white" : null
                } `}
              >
                Add App
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View
        className={`bg-white opacity-90 shadow-lg w-full h-24 items-center ${
          isActive ? "bg-black/90" : null
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
/* <RenderHtml
              contentWidth={width}
              // source={{ html: htmlContent }}
              // tagsStyles={tagsStyles}
            /> */
