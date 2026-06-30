import { ProductComparison } from "../components/product-comparison";
import { loadProducts } from "../lib/data";

export default async function Home() {
  const products = await loadProducts();

  return (
    <main>
      <ProductComparison products={products} />
    </main>
  );
}
