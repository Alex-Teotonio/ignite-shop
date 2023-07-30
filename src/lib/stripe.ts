import Stripe from "stripe";

const API_KEY= process.env.STRIPE_SECRET_KEY!
export const stripe = new Stripe(API_KEY, {
  apiVersion: "2022-11-15",
  appInfo: {
    name: 'Ignite Shop',
  }
})