import "../global.css";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventsProvider } from "../lib/EventsContext";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <EventsProvider>
        <Slot />
      </EventsProvider>
    </GestureHandlerRootView>
  );
}
