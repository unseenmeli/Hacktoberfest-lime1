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
import Loading from "../components/screens/loading";
import Home from "../components/screens/home";
import AddApp from "../components/screens/addapp";

export default function App() {
  const panther = require("../media/panther.jpg");
  const [page, setPage] = useState("load");

  if (page === "AddApp") {
    return <AddApp page={page} setPage={setPage} panther={panther} />;
  }

  if (page === "load") {
    return <Loading onLoadingComplete={() => setPage("home")} />;
  }

  return <Home panther={panther} page={page} setPage={setPage} />;
}
