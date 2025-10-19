import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import db from "../../app/db";

const { width } = Dimensions.get("window");

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
    <View className="flex-1 bg-black">
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo/Title Section */}
        <View className="mb-12">
          <Text
            className="text-white uppercase text-center"
            style={{
              fontSize: 56,
              fontWeight: "900",
              letterSpacing: -2,
            }}
          >
            SWIPE
          </Text>
          <Text
            className="text-white/60 uppercase text-center mt-2"
            style={{
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 2,
            }}
          >
            Event Discovery
          </Text>
        </View>

        {/* Login Form */}
        <View className="w-full max-w-md">
          {!sentEmail ? (
            <>
              <Text
                className="text-white/60 uppercase mb-4"
                style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
              >
                Enter Your Email
              </Text>
              <TextInput
                className="bg-white/5 rounded-2xl p-5 mb-6 text-white border border-white/10"
                placeholder="your@email.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                }}
              />
              <TouchableOpacity
                onPress={sendMagicCode}
                disabled={isLoading}
                className={`bg-white rounded-full py-5 items-center ${
                  isLoading ? "opacity-50" : ""
                }`}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text
                    className="text-black uppercase"
                    style={{ fontSize: 16, fontWeight: "800", letterSpacing: 1 }}
                  >
                    Send Magic Code
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                className="text-white/60 uppercase mb-4"
                style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5 }}
              >
                Enter Verification Code
              </Text>
              <Text
                className="text-white/40 mb-4"
                style={{ fontSize: 14, fontWeight: "400" }}
              >
                Sent to {sentEmail}
              </Text>
              <TextInput
                className="bg-white/5 rounded-2xl p-5 mb-6 text-white border border-white/10 text-center"
                placeholder="000000"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
                editable={!isLoading}
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  letterSpacing: 8,
                }}
              />
              <TouchableOpacity
                onPress={signInWithCode}
                disabled={isLoading}
                className={`bg-white rounded-full py-5 items-center mb-4 ${
                  isLoading ? "opacity-50" : ""
                }`}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text
                    className="text-black uppercase"
                    style={{ fontSize: 16, fontWeight: "800", letterSpacing: 1 }}
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
                className="py-3"
                activeOpacity={0.7}
              >
                <Text
                  className="text-white/60 text-center uppercase"
                  style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1 }}
                >
                  Use Different Email
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View className="absolute bottom-12">
          <Text
            className="text-white/30 text-center uppercase"
            style={{ fontSize: 10, fontWeight: "600", letterSpacing: 2 }}
          >
            Discover • Connect • Experience
          </Text>
        </View>
      </View>
    </View>
  );
}

export default Login;
