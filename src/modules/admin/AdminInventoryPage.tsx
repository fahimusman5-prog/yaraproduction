import { getInventory } from "./data";
import { InventoryManager } from "./components/InventoryManager";
import { PageHeader } from "./components/PageHeader";

export async function AdminInventoryPage() { const { products, movements } = await getInventory(); const low = products.filter((p) => p.stock_quantity <= p.low_stock_alert).length; return <><PageHeader eyebrow="Inventory" title="Stock control" description={`${low} product${low === 1 ? " is" : "s are"} currently at or below the low-stock threshold. Every adjustment is recorded.`} /><InventoryManager products={products} movements={movements} /></>; }
