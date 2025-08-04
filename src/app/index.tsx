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
import AppDetail from "../components/screens/addedappid";
import SettingsP from "@/components/screens/settings";
import { init, i, InstaQLEntity, id } from "@instantdb/react-native";
import db from "./db";

export default function App() {
  const [page, setPage] = useState("load");
  const [apps, setApps] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const lightpanther = require("../media/panther.jpg");
  const darkpanther = require("../media/panther1.png");

  const panther = isActive ? darkpanther : lightpanther;

  if (page === "load") {
    return <Loading onLoadingComplete={() => setPage("home")} />;
  }

  if (page.startsWith("App_")) {
    const parts = page.split("_");
    const appData = {
      appId: parts[1],
      appName: parts[2],
      appDesc: parts[3],
    };
    return (
      <AppDetail
        appData={appData}
        setPage={setPage}
        panther={panther}
        isActive={isActive}
        setIsActive={setIsActive}
      />
    );
  }

  if (page === "AddApp") {
    return (
      <AddApp
        page={page}
        setPage={setPage}
        panther={panther}
        apps={apps}
        setApps={setApps}
        isActive={isActive}
        setIsActive={setIsActive}
      />
    );
  }

  if (page === "settings")
    return (
      <SettingsP
        panther={panther}
        page={page}
        setPage={setPage}
        apps={apps}
        setApps={setApps}
        isActive={isActive}
        setIsActive={setIsActive}
      />
    );
  return (
    <Home
      panther={panther}
      page={page}
      setPage={setPage}
      apps={apps}
      setApps={setApps}
      isActive={isActive}
      setIsActive={setIsActive}
    />
  );
}
