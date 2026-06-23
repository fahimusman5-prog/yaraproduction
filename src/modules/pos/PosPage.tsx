import { requireStaff } from "@/lib/supabase/auth";
import { getPosProducts } from "./data";
import { PosTerminal } from "./PosTerminal";

export async function PosPage() { const [products, staff] = await Promise.all([getPosProducts(), requireStaff("/pos")]); return <PosTerminal products={products} staff={staff} />; }
