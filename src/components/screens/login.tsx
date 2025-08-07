import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import db from "../../app/db";

function Login({ setPage, panther, isActive, setIsActive }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user, isLoading: authLoading } = db.useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      setPage("home");
    }
  }, [user, authLoading, setPage]);

  const sendMagicCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
      Alert.alert("Success", "Check your email for the magic code!");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send magic code");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithCode = async () => {
    if (!code.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setIsLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
    } catch (error) {
      Alert.alert("Error", error.message || "Invalid code");
      setCode("");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={isActive ? "#ffffff" : "#000000"} />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isActive ? "bg-black" : "bg-white"}`}>
      <Image
        className="flex-1 absolute rotate-90 -mx-96 p-10 -my-10 opacity-60"
        source={panther}
      />
      <View className="flex-1 justify-center items-center px-8">
        <View
          className={`bg-white/95 rounded-2xl shadow-2xl p-8 w-full max-w-md ${
            isActive ? "bg-black/95" : null
          }`}
        >
          <Text
            className={`font-serif font-bold text-3xl text-center mb-8 ${
              isActive ? "color-white" : null
            }`}
          >
            OneShot Login
          </Text>

          {!sentEmail ? (
            <>
              <Text
                className={`font-serif text-base mb-4 ${
                  isActive ? "color-white" : null
                }`}
              >
                Enter your email to get started
              </Text>
              <TextInput
                className={`border-2 border-gray-300 rounded-xl p-4 mb-6 font-serif ${
                  isActive ? "border-white color-white" : null
                }`}
                placeholder="your@email.com"
                placeholderTextColor={isActive ? "#999" : "#666"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={sendMagicCode}
                disabled={isLoading}
                className={`bg-black rounded-xl p-4 ${
                  isActive ? "bg-white" : null
                } ${isLoading ? "opacity-50" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator color={isActive ? "#000000" : "#ffffff"} />
                ) : (
                  <Text
                    className={`font-serif font-bold text-center text-white text-lg ${
                      isActive ? "color-black" : null
                    }`}
                  >
                    Send Magic Code
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                className={`font-serif text-base mb-4 ${
                  isActive ? "color-white" : null
                }`}
              >
                Enter the code sent to {sentEmail}
              </Text>
              <TextInput
                className={`border-2 border-gray-300 rounded-xl p-4 mb-6 font-serif text-center text-2xl ${
                  isActive ? "border-white color-white" : null
                }`}
                placeholder="000000"
                placeholderTextColor={isActive ? "#999" : "#666"}
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={signInWithCode}
                disabled={isLoading}
                className={`bg-black rounded-xl p-4 mb-4 ${
                  isActive ? "bg-white" : null
                } ${isLoading ? "opacity-50" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator color={isActive ? "#000000" : "#ffffff"} />
                ) : (
                  <Text
                    className={`font-serif font-bold text-center text-white text-lg ${
                      isActive ? "color-black" : null
                    }`}
                  >
                    Verify Code
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSentEmail("");
                  setCode("");
                }}
              >
                <Text
                  className={`font-serif text-center ${
                    isActive ? "color-white" : "color-gray-600"
                  }`}
                >
                  Use different email
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default Login;