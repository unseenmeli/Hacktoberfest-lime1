
import { init } from "@instantdb/react-native";
import schema from "../instant.schema";

const APP_ID = "737da44f-e060-46c5-a28b-c1e2803a4590";
const db = init({ appId: APP_ID, schema });
export default db;

export type Schema = typeof schema;