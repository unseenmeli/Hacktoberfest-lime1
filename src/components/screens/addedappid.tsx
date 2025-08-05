import React, { useState, useEffect } from "react";
import { Text, View, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import db from "../../app/db";
import * as Babel from "@babel/standalone";

function AppDetail({ appData, setPage, panther, isActive }) {
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
    if (displayCode) {
      try {
        const cleanCode = displayCode.trim();
        
        const transformed = Babel.transform(cleanCode, {
          presets: ['react', 'typescript'],
          filename: 'component.tsx',
          plugins: [['transform-modules-commonjs', { strict: false }]]
        }).code;
        
        const moduleCode = `
          const exports = {};
          const module = { exports };
          const require = (name) => {
            if (name === 'react') return React;
            if (name === 'react-native') return { View, Text, TouchableOpacity, Alert, ScrollView };
            throw new Error('Module not found: ' + name);
          };
          
          ${transformed}
          
          return module.exports.default || module.exports;
        `;
        
        const getComponent = new Function(
          'React', 'View', 'Text', 'TouchableOpacity', 'Alert', 'ScrollView', 
          moduleCode
        );
        
        const Component = getComponent(React, View, Text, TouchableOpacity, Alert, ScrollView);
        const element = React.createElement(Component);
        
        setCodeResult(element);
        setCodeError(null);
      } catch (err) {
        setCodeError(err.message);
        setCodeResult(null);
      }
    }
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
              {displayAppName}
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
              {displayAppDesc}
            </Text>
          </View>
          <View className={` rounded-xl ${isActive ? "bg-black/20" : null}`}>
            <Text
              className={`p-3 font-serif font-bold text-xl ${
                isActive ? "color-white" : null
              }`}
            >
              Code
            </Text>
          </View>
          <View
            className={`bg-white shadow-lg w-96 h-32 rounded-xl p-4 ${
              isActive ? "bg-black/95" : null
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
