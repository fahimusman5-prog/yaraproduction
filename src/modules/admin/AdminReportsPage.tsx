import { getReportsData } from "./data";
import { PageHeader } from "./components/PageHeader";
import { ReportsView } from "./components/ReportsView";

export async function AdminReportsPage() {
  const { orders, sales, saleItems, orderItems } = await getReportsData();
  const now = new Date();
  const periodData = (date: Date) => {
    const dateKey = (value: Date | string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(value));
    const key = dateKey(date);
    const online = orders.filter(
      (order) =>
        dateKey(order.created_at) === key &&
        order.payment_status === "paid" &&
        order.order_status !== "cancelled",
    );
    return {
      onlineLkr: online
        .filter((order) => order.currency === "LKR")
        .reduce((sum, order) => sum + Number(order.total_amount), 0),
      onlineAed: online
        .filter((order) => order.currency === "AED")
        .reduce((sum, order) => sum + Number(order.total_amount), 0),
      posLkr: sales
        .filter((sale) => new Date(sale.created_at).toDateString() === key)
        .reduce((sum, sale) => sum + Number(sale.total_amount), 0),
    };
  };
  const daily = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - offset));
    return {
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      ...periodData(date),
    };
  });
  const monthly = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const online = orders.filter((order) => {
      const created = new Date(order.created_at);
      return (
        created.getFullYear() === year &&
        created.getMonth() === month &&
        order.order_status !== "cancelled"
      );
    });
    return {
      label: date.toLocaleDateString("en", { month: "short" }),
      onlineLkr: online
        .filter((order) => order.currency === "LKR")
        .reduce((sum, order) => sum + Number(order.total_amount), 0),
      onlineAed: online
        .filter((order) => order.currency === "AED")
        .reduce((sum, order) => sum + Number(order.total_amount), 0),
      posLkr: sales
        .filter((sale) => {
          const created = new Date(sale.created_at);
          return created.getFullYear() === year && created.getMonth() === month;
        })
        .reduce((sum, sale) => sum + Number(sale.total_amount), 0),
    };
  });
  const productMap = new Map<
    string,
    { name: string; sku: string; quantity: number }
  >();
  [...saleItems, ...orderItems].forEach((item) => {
    const key = item.products?.sku ?? "unknown";
    const current = productMap.get(key) ?? {
      name: item.products?.name ?? "Unknown product",
      sku: key,
      quantity: 0,
    };
    current.quantity += item.quantity;
    productMap.set(key, current);
  });
  const bestSellers = [...productMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Sales reports"
        description="Daily and monthly performance across online orders and point-of-sale transactions."
      />
      <ReportsView
        orders={orders}
        sales={sales}
        bestSellers={bestSellers}
        monthly={monthly}
        daily={daily}
      />
    </>
  );
}
