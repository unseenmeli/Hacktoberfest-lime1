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
import db from "../../app/db";
import { id } from "@instantdb/react-native";

function savedapp(aname, adesc) {
  return `
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  
  const handlePress = () => {
    setCount(count + 1);
    Alert.alert('Pressed!', \`You've pressed the button \${count + 1} times\`);
  };
  
  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 10 }}>
        ${aname}
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        ${adesc}
      </Text>
      <TouchableOpacity 
        onPress={handlePress}
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 10, 
          borderRadius: 5,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Press me! (Count: {count})
        </Text>
      </TouchableOpacity>
    </View>
  );
}
  `;
}

function AddApp({
  page,
  setPage,
  panther,
  apps,
  setApps,
  isActive,
  setIsActive,
}) {
  const [newApp, setNewApp] = useState({ title: "", desc: "" });
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
        <View className="mx-1 p-2 flec-col gap">
          <View className="h-72 items-center flex-row">
            <View className="absolute -mx-2">
              <Text
                className={`shadow-xl font-serif mx-36 font-bold text-8xl ${
                  isActive ? "color-white" : null
                }`}
              >
                Logo
              </Text>
            </View>
            <View className="absolute">
              <Text
                className={`shadow-xl font-serif -mx-1 font-bold text-8xl ${
                  isActive ? "color-white" : null
                }`}
              >
                Logo
              </Text>
            </View>
            <View className="absolute">
              <View
                className={`-my-20 mx-28 absolute bg-white shadow-2xl h-40 w-40 rounded-full ${
                  isActive ? "bg-stone-800" : null
                }`}
              ></View>
            </View>
            <TouchableOpacity>
              <View
                className={`-my-20 mx-28 absolute bg-white shadow-2xl h-40 w-40 rounded-full ${
                  isActive ? "bg-black/95" : null
                }`}
              >
                <View className="flex-1 justify-center items-center">
                  <View
                    className={`absolute bg-black w-1.5 h-20 rounded-xl ${
                      isActive ? "bg-white" : null
                    }`}
                  ></View>
                  <View
                    className={`absolute bg-black w-20 h-1.5 rounded-xl ${
                      isActive ? "bg-white" : null
                    }`}
                  ></View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <View>
            <Text
              className={`p-3 font-serif font-bold text-xl ${
                isActive ? "color-white" : null
              }`}
            >
              App Name
            </Text>
          </View>
          <View className="bg-white shadow-lg w-96 h-12 rounded-xl">
            <TextInput
              className="p-3 font-serif italic font-bold"
              placeholder="App name here"
              onChangeText={(newText) => {
                setNewApp({ ...newApp, title: newText });
              }}
              value={newApp.title}
            ></TextInput>
          </View>
          <View>
            <Text
              className={`p-3 font-serif font-bold text-xl ${
                isActive ? "color-white" : null
              }`}
            >
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
              onChangeText={(newText) => {
                setNewApp({ ...newApp, desc: newText });
              }}
            ></TextInput>
          </View>
          <TouchableOpacity
            onPress={() => {
              db.transact(
                db.tx.appslist[id()].create({
                  appname: newApp.title,
                  appdesc: newApp.desc,
                  code: savedapp(newApp.title, newApp.desc),
                })
              );
              setPage("home");
            }}
          >
            <View
              className={`bg-white mx-24 my-4 w-48 h-20 rounded-xl shadow-lg justify-center items-center ${
                isActive ? "bg-black/70" : null
              }`}
            >
              <Text
                className={`font-bold font-serif text-xl ${
                  isActive ? "color-white" : null
                }`}
              >
                Submit
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

export default AddApp;
