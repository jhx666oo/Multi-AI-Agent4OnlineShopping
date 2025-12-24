/**
 * Checkout Tool Routes
 *
 * ⚠️ 高敏感操作：需要幂等性保证
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSuccessResponse, createLogger } from '@shopping-agent/common';
import { checkIdempotency, saveIdempotentResponse } from '../middleware/idempotency.js';

const logger = createLogger('checkout');

export async function checkoutRoutes(app: FastifyInstance): Promise<void> {
  /**
   * cart.create
   */
  app.post('/cart/create', async (request: FastifyRequest, reply: FastifyReply) => {
    // Check idempotency
    if (await checkIdempotency(request, reply)) {
      return;
    }

    const cartId = `cart_${crypto.randomUUID().slice(0, 12)}`;

    logger.info({ cart_id: cartId }, 'Creating cart');

    const response = createSuccessResponse({
      cart_id: cartId,
      status: 'active',
      items: [],
      created_at: new Date().toISOString(),
    });

    saveIdempotentResponse(request, response);
    return reply.send(response);
  });

  /**
   * cart.add_item
   */
  app.post('/cart/add_item', async (request: FastifyRequest, reply: FastifyReply) => {
    if (await checkIdempotency(request, reply)) {
      return;
    }

    const body = request.body as {
      params?: { cart_id?: string; sku_id?: string; quantity?: number };
    };
    const params = body.params ?? {};

    logger.info({ cart_id: params.cart_id, sku_id: params.sku_id }, 'Adding to cart');

    const response = createSuccessResponse({
      cart_id: params.cart_id,
      items: [
        {
          sku_id: params.sku_id,
          quantity: params.quantity ?? 1,
        },
      ],
      updated_at: new Date().toISOString(),
    });

    saveIdempotentResponse(request, response);
    return reply.send(response);
  });

  /**
   * checkout.compute_total
   */
  app.post('/compute_total', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { params?: Record<string, string> };
    const params = body.params ?? {};

    logger.info({ cart_id: params.cart_id }, 'Computing total');

    return reply.send(
      createSuccessResponse({
        cart_id: params.cart_id,
        subtotal: 49.99,
        shipping: 5.99,
        tax_estimate: 4.5,
        total: 60.48,
        currency: 'USD',
        breakdown: [
          { type: 'item_subtotal', amount: 49.99 },
          { type: 'shipping', amount: 5.99 },
          { type: 'tax', amount: 4.5 },
        ],
        assumptions: ['Tax estimate based on destination ZIP code'],
      })
    );
  });

  /**
   * checkout.create_draft_order
   *
   * ⚠️ 关键操作：必须支持幂等
   */
  app.post('/create_draft_order', async (request: FastifyRequest, reply: FastifyReply) => {
    if (await checkIdempotency(request, reply)) {
      return;
    }

    const body = request.body as { params?: Record<string, unknown> };
    const params = body.params ?? {};

    const draftOrderId = `do_${crypto.randomUUID().slice(0, 12)}`;

    logger.info({ draft_order_id: draftOrderId, cart_id: params.cart_id }, 'Creating draft order');

    const response = createSuccessResponse({
      draft_order_id: draftOrderId,
      status: 'pending_confirmation',
      payable_amount: {
        amount: 60.48,
        currency: 'USD',
      },
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      confirmation_items: [
        {
          type: 'tax_estimate_uncertainty',
          title: 'Tax Estimate',
          description: 'Final tax may vary based on actual import declaration',
          requires_ack: true,
        },
      ],
      evidence_snapshot_id: params.evidence_snapshot_id,
    });

    saveIdempotentResponse(request, response);
    return reply.send(response);
  });
}

