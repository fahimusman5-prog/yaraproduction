import { getOrders } from "./data";
import { OrdersTable } from "./components/OrdersTable";
import { PageHeader } from "./components/PageHeader";

export async function AdminOrdersPage() { const orders = await getOrders(); return <><PageHeader eyebrow="Commerce" title="Online orders" description="Search customers, inspect payment details, and move orders through fulfillment." /><OrdersTable orders={orders} /></>; }
