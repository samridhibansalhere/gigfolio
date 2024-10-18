"use server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (amount: number) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number((amount * 100).toFixed(0)),
      currency: "usd",
      description: "GigFolio Payment",
    });

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export async function createPaymentIntent2(amount: number, taskId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects the amount in cents
      currency: 'usd',
      metadata: { taskId },
    });

    return { success: true, clientSecret: paymentIntent.client_secret };
  } catch (error:any) {
    console.error('Error creating payment intent:', error);
    return { success: false, message: error.message };
  }
}

