import { init } from "@instantdb/react-native";
import schema from "./instant.schema";

const APP_ID = "ad946104-20ed-4c58-8173-2596cb9a72ad";

const db = init({
  appId: APP_ID,
  schema,
});

export default db;
