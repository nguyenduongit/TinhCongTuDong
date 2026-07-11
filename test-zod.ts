import { z } from "zod";
const schema = z.record(z.string(), z.number());
try {
  schema.parse({"5.2": 1.08});
  console.log("Success!");
} catch (e) {
  console.log(JSON.stringify(e.errors, null, 2));
}
