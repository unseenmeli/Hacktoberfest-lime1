import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput } from "react-native";
import * as Babel from "@babel/standalone";

export function executeAppCode(
  displayCode: string,
  setCodeResult: (result: any) => void,
  setCodeError: (error: string | null) => void
) {
  if (!displayCode) return;

  try {
    const cleanCode = displayCode.trim();

    const transformed = Babel.transform(cleanCode, {
      presets: ["react", "typescript"],
      filename: "component.tsx",
      plugins: [["transform-modules-commonjs", { strict: false }]],
    }).code;

    const moduleCode = `
      const exports = {};
      const module = { exports };
      const require = (name) => {
        if (name === 'react') return React;
        if (name === 'react-native') return { View, Text, TouchableOpacity, Alert, ScrollView, TextInput };
        throw new Error('Module not found: ' + name);
      };
      
      ${transformed}
      
      return module.exports.default || module.exports;
    `;

    const getComponent = new Function(
      "React",
      "View",
      "Text",
      "TouchableOpacity",
      "Alert",
      "ScrollView",
      "TextInput",
      moduleCode
    );

    const Component = getComponent(
      React,
      View,
      Text,
      TouchableOpacity,
      Alert,
      ScrollView,
      TextInput
    );
    const element = React.createElement(Component);

    setCodeResult(element);
    setCodeError(null);
  } catch (err: any) {
    setCodeError(err.message);
    setCodeResult(null);
  }
}