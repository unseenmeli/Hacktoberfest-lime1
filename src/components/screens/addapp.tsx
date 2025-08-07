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
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import db from "../../app/db";
import { id } from "@instantdb/react-native";
import * as ImagePicker from "expo-image-picker";

function AddApp({
  page,
  setPage,
  panther,
  apps,
  setApps,
  isActive,
  setIsActive,
}) {
  const [newApp, setNewApp] = useState({ title: "", desc: "", logo: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { user } = db.useAuth();

  const SERVER_URL = Platform.select({
    ios: "http://localhost:3000",
    android: "http://10.0.2.2:3000",
    default: "http://localhost:3000",
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to access your photos"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setNewApp({ ...newApp, logo: result.assets[0].base64 });
    }
  };

  const testServerConnection = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to access the server");
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.refresh_token}`,
        },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success",
          `Server is running! ${data.message || "Connected"}`
        );
      } else {
        Alert.alert("Error", data.error || "Authentication failed");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Cannot reach server at ${SERVER_URL}. Error: ${error.message}`
      );
    }
  };

  const generateAndSaveApp = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to generate apps");
      return;
    }

    if (!user.refresh_token) {
      Alert.alert(
        "Error",
        "Authentication token not available. Please sign out and sign in again."
      );
      console.error("User object missing refresh_token:", user);
      return;
    }

    if (!newApp.desc.trim() || !newApp.title.trim()) {
      Alert.alert("Error", "Please enter both app name and description");
      return;
    }

    setIsGenerating(true);

    console.log("Sending refresh_token:", user.refresh_token);

    try {
      const response = await fetch(`${SERVER_URL}/create_app`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.refresh_token}`,
        },
        body: JSON.stringify({
          description: newApp.desc,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        try {
          await db.transact(
            db.tx.appslist[id()].create({
              appname: newApp.title,
              appdesc: newApp.desc,
              code: data.code,
              logo: newApp.logo || "",
            })
          );
          Alert.alert("Success", "App created successfully!");
          setPage("home");
        } catch (dbError) {
          console.error("Database error:", dbError);
          Alert.alert(
            "Database Error",
            `Failed to save app: ${dbError.message}`
          );
        }
      } else {
        Alert.alert("Error", data.error || "Failed to generate code");
      }
    } catch (error) {
      console.error("Network error:", error);
      console.error("Server URL:", SERVER_URL);
      Alert.alert(
        "Connection Error",
        `Could not connect to server at ${SERVER_URL}. Make sure your server is running. Error: ${error.message}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

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
                  isActive ? "bg-white" : null
                }`}
              ></View>
            </View>
            <TouchableOpacity onPress={pickImage}>
              <View
                className={`-my-20 mx-28 absolute shadow-2xl h-40 w-40 rounded-full ${
                  isActive ? "bg-black" : "bg-white"
                } justify-center items-center`}
              >
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage }}
                    className="w-40 h-40 rounded-full"
                  />
                ) : (
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
                )}
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
          <View
            className={`shadow-lg w-96 h-12 rounded-xl ${
              isActive ? "bg-stone-950" : "bg-white"
            }`}
          >
            <TextInput
              className={`p-3 font-serif italic font-bold ${
                isActive ? "color-white" : "color-black"
              }`}
              placeholder="App name here"
              placeholderTextColor={isActive ? "white" : "#666"}
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
          <View
            className={`shadow-lg w-96 h-32 rounded-xl ${
              isActive ? "bg-stone-950" : "bg-white"
            }`}
          >
            <TextInput
              className={`p-3 font-serif italic font-bold ${
                isActive ? "color-white" : "color-black"
              }`}
              textAlignVertical="top"
              multiline={true}
              numberOfLines={6}
              placeholder="App description here"
              placeholderTextColor={isActive ? "white" : "#666"}
              onChangeText={(newText) => {
                setNewApp({ ...newApp, desc: newText });
              }}
            ></TextInput>
          </View>
          <TouchableOpacity
            onPress={testServerConnection}
            style={{
              width: 176,
              height: 64,
              marginTop: 10,
              marginBottom: -10,
              alignSelf: "center",
              alignItems: "center",
            }}
          >
            <View
              className={`w-44 h-16 rounded-xl shadow-lg justify-center items-center ${
                isActive ? "bg-black/95" : "bg-white/95"
              }`}
            >
              <Text
                className={`text-center font-serif font-bold ${
                  isActive ? "color-white" : "color-black"
                }`}
              >
                Test Connection
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={generateAndSaveApp}
            disabled={isGenerating}
          >
            <View
              className={`mx-24 my-4 w-48 h-20 rounded-xl shadow-lg justify-center items-center ${
                isActive ? "bg-black/95" : "bg-white/95"
              } ${isGenerating ? "opacity-50" : ""}`}
            >
              {isGenerating ? (
                <ActivityIndicator
                  size="small"
                  color={isActive ? "#ffffff" : "#000000"}
                />
              ) : (
                <Text
                  className={`font-bold font-serif text-xl ${
                    isActive ? "color-white" : null
                  }`}
                >
                  Submit
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View
        className={`shadow-lg w-full h-24 items-center ${
          isActive ? "bg-black/95" : "bg-white/95"
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
