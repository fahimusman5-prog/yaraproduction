import { getCommerceOperations } from "./commerce-data";
import { CommerceManager } from "./components/CommerceManager";
import { PageHeader } from "./components/PageHeader";

export async function AdminCommercePage() {
  const data = await getCommerceOperations();
  return <><PageHeader eyebrow="Operations" title="Shipping, coupons, returns & refunds" description="Configure regional delivery and manage post-order commerce without issuing provider refunds." /><CommerceManager {...data} /></>;
}
