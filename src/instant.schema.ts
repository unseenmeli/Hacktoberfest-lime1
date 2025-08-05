import { init, i } from "@instantdb/react-native";

const schema = i.schema({
  entities: {
    appslist: i.entity({
      appname: i.string(),
      appdesc: i.string(),
      code: i.string(),
    }),
  },
});

export default schema;