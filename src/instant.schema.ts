import { init, i } from "@instantdb/react-native";

const schema = i.schema({
  entities: {
    appslist: i.entity({
      appname: i.string(),
      appdesc: i.string(),
      code: i.string(),
      logo: i.string().optional(),
    }),
  },
});

export default schema;