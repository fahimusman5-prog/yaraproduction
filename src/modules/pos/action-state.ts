export interface PosActionState {
  status: "idle" | "success" | "error";
  message: string;
  sale?: {
    id: string;
    number: string;
    total: number;
    cashier: string;
    createdAt: string;
    currency: "LKR" | "AED";
    paymentMethod: string;
  };
}

export const initialPosActionState: PosActionState = {
  status: "idle",
  message: "",
};
