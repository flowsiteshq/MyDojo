import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";

export const shopRouter = router({
  purchaseProduct: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      productId: z.string().min(1),
      productName: z.string().min(1),
      amountCents: z.number().int().positive(),
      size: z.string().optional(),
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      customerPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const fluidPayKey = process.env.FLUIDPAY_SECRET_KEY;
      if (!fluidPayKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment processor not configured' });

      const firstName = input.customerName.split(' ')[0];
      const lastName = input.customerName.split(' ').slice(1).join(' ') || '';
      const description = input.size
        ? `MyDojo Shop – ${input.productName} (Size: ${input.size})`
        : `MyDojo Shop – ${input.productName}`;

      const chargeRes = await fetch('https://app.fluidpay.com/api/transaction', {
        method: 'POST',
        headers: { 'Authorization': fluidPayKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sale',
          amount: input.amountCents,
          payment_method: { token: input.token },
          billing_address: {
            first_name: firstName,
            last_name: lastName,
            email: input.customerEmail,
            phone: (input.customerPhone || '').replace(/\D/g, ''),
          },
          order_id: `shop-${input.productId}-${Date.now()}`,
          description,
        }),
      });

      const chargeBody = await chargeRes.json() as {
        status: string;
        msg: string;
        data?: { id: string; status: string; response_body?: { card?: { response_text?: string } } };
      };

      if (chargeBody.status !== 'success' || !chargeBody.data) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: chargeBody.msg || 'Payment failed' });
      }
      const txn = chargeBody.data;
      if (txn.status !== 'approved') {
        const declineMsg = txn.response_body?.card?.response_text || `Transaction ${txn.status}`;
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Payment declined: ${declineMsg}` });
      }

      return {
        success: true,
        transactionId: txn.id,
        productName: input.productName,
        amountCents: input.amountCents,
      };
    }),
});
