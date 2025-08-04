import { init, i } from "@instantdb/react-native";

const APP_ID = "737da44f-e060-46c5-a28b-c1e2803a4590";

const schema = i.schema({
  entities: {
    appslist: i.entity({
      appname: i.string(),
      appdesc: i.string(),
    }),
  },
});
const db = init({appId: APP_ID, schema: schema})

export default db;