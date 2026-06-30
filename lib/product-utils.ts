import type { EpdProduct } from "./schema";

export function getStageValue(product: EpdProduct, stage: string) {
  return product.carbon.find((figure) => figure.stage === stage);
}

export function declaredLifecycleTotal(product: EpdProduct) {
  return product.carbon.reduce((sum, figure) => {
    if (figure.status !== "declared" || figure.value === null) return sum;
    if (figure.stage === "D") return sum;
    return sum + figure.value;
  }, 0);
}
