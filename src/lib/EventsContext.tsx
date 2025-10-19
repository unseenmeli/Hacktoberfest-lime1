import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import db from "../app/db";

interface EventsContextType {
  events: any[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isLoading: boolean;
  error: any;
  refetchEvents: () => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  // Fetch events from InstantDB with likes (including profile info)
  // This will only run once per session
  const { isLoading, error, data } = db.useQuery({
    events: {
      likes: {
        profile: {},
      },
    },
  });

  // Mark as fetched once data is loaded
  useEffect(() => {
    if (data && !hasFetchedOnce) {
      setHasFetchedOnce(true);
      console.log("Events fetched and cached for session");
    }
  }, [data, hasFetchedOnce]);

  // Manual refetch function in case user wants to refresh
  const refetchEvents = () => {
    setHasFetchedOnce(false);
    // The query will automatically refetch
  };

  const value: EventsContextType = {
    events: data?.events || [],
    currentIndex,
    setCurrentIndex,
    isLoading,
    error,
    refetchEvents,
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}
