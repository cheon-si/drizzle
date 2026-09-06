import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;
let cached: Db | undefined;

/** 첫 쿼리 시점에 연결 (빌드 타임에 DATABASE_URL 없어도 통과) */
export const db: Db = new Proxy({} as Db, {
  get(_, prop) {
    cached ??= drizzle(neon(process.env.DATABASE_URL!), { schema });
    return Reflect.get(cached, prop);
  },
});
