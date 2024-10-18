import { UserType } from "./index";

export interface ISubscription {
  _id: string;
  user: UserType;
  paymentId: string;
  plan: any;
  expiryDate: string;
  planName: string;
  price: number;
  createdAt: string;
}