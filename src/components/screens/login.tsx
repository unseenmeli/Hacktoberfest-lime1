import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import db from "../../app/db";

interface LoginProps {
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

function Login({ isActive, setIsActive }: LoginProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <View className={`flex-1 ${isActive ? "bg-black" : "bg-white"}`}>
      <View className="flex-1 justify-center items-center px-8">
        <View
          className={`bg-white/95 rounded-2xl shadow-2xl p-8 w-full max-w-md ${
            isActive ? "bg-black/95" : ""
          }`}
        >
          <Text
            className={`font-serif font-bold text-3xl text-center mb-8 ${
              isActive ? "color-white" : ""
            }`}
          >
            Login
          </Text>

          {!sentEmail ? (
            <>
              <Text
                className={`font-serif text-base mb-4 ${
                  isActive ? "color-white" : ""
                }`}
              >
                Enter your email to get started
              </Text>
              <TextInput
                className={`border-2 border-gray-300 rounded-xl p-4 mb-6 font-serif ${
                  isActive ? "border-white color-white" : ""
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
                  isActive ? "bg-white" : ""
                } ${isLoading ? "opacity-50" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator color={isActive ? "#000000" : "#ffffff"} />
                ) : (
                  <Text
                    className={`font-serif font-bold text-center text-white text-lg ${
                      isActive ? "color-black" : ""
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
                  isActive ? "color-white" : ""
                }`}
              >
                Enter the code sent to {sentEmail}
              </Text>
              <TextInput
                className={`border-2 border-gray-300 rounded-xl p-4 mb-6 font-serif text-center text-2xl ${
                  isActive ? "border-white color-white" : ""
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
                  isActive ? "bg-white" : ""
                } ${isLoading ? "opacity-50" : ""}`}
              >
                {isLoading ? (
                  <ActivityIndicator color={isActive ? "#000000" : "#ffffff"} />
                ) : (
                  <Text
                    className={`font-serif font-bold text-center text-white text-lg ${
                      isActive ? "color-black" : ""
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

          <TouchableOpacity
            onPress={() => setIsActive(!isActive)}
            className="mt-6"
          >
            <Text
              className={`font-serif text-center ${
                isActive ? "color-white" : "color-gray-600"
              }`}
            >
              Toggle {isActive ? "Light" : "Dark"} Mode
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default Login;
