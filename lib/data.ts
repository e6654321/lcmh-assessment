import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { epdProductSchema, type EpdProduct } from "./schema";

export async function loadProducts(): Promise<EpdProduct[]> {
  const dataDir = path.join(process.cwd(), "data");
  const files = (await readdir(dataDir)).filter((file) => file.endsWith(".json")).sort();
  const products = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(dataDir, file), "utf8");
      return epdProductSchema.parse(JSON.parse(raw));
    })
  );

  return products;
}
