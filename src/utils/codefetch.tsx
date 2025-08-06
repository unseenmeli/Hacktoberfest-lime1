import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from "react-native";

const CodeGeneratorApp = () => {
  const [description, setDescription] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);

  const SERVER_URL = "http://10.0.2.2:3000";

  const generateApp = async () => {
    if (!description.trim()) {
      Alert.alert("Error", "Please enter an app description");
      return;
    }

    setLoading(true);
    setGeneratedCode("");

    try {
      const response = await fetch(`${SERVER_URL}/create_app`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedCode(data.code);
        Alert.alert("Success", "Code generated successfully!");
      } else {
        Alert.alert("Error", data.error || "Failed to generate code");
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert(
        "Connection Error",
        "Could not connect to server. Make sure your server is running and the URL is correct."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      Clipboard.setString(generatedCode);
      Alert.alert("Copied!", "Code copied to clipboard");
    }
  };

  const reloadInstructions = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/reload-instructions`);
      const data = await response.json();
      Alert.alert("Success", data.message);
    } catch (error) {
      Alert.alert("Error", "Failed to reload instructions");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ padding: 20 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: 8,
              }}
            >
              AI Code Generator
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#6b7280",
                marginBottom: 24,
              }}
            >
              Generate React Native code with AI
            </Text>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                App Description
              </Text>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: "white",
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                placeholder="Describe the app you want to create..."
                value={description}
                onChangeText={setDescription}
                multiline
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              onPress={generateApp}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  Generate Code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={reloadInstructions}
              style={{
                backgroundColor: "#f3f4f6",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#d1d5db",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Reload Instructions File
              </Text>
            </TouchableOpacity>

            {generatedCode ? (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Generated Code:
                  </Text>

                  <TouchableOpacity
                    onPress={copyToClipboard}
                    style={{
                      backgroundColor: "#10b981",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "500" }}>
                      Copy
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 8,
                    padding: 16,
                    maxHeight: 400,
                  }}
                  horizontal
                  showsHorizontalScrollIndicator={true}
                >
                  <Text
                    style={{
                      color: "#e5e7eb",
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                      fontSize: 12,
                      lineHeight: 20,
                    }}
                  >
                    {generatedCode}
                  </Text>
                </ScrollView>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CodeGeneratorApp;
