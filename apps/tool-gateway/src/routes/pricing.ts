/**
 * Pricing Tool Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSuccessResponse, createLogger } from '@shopping-agent/common';

const logger = createLogger('pricing');

export async function pricingRoutes(app: FastifyInstance): Promise<void> {
  /**
   * pricing.get_realtime_quote
   */
  app.post('/get_realtime_quote', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      params?: { sku_id?: string; quantity?: number; destination_country?: string };
    };
    const params = body.params ?? {};

    if (!params.sku_id) {
      return reply.status(400).send({
        ok: false,
        error: { code: 'INVALID_ARGUMENT', message: 'sku_id is required' },
        warnings: [],
      });
    }

    logger.info({ sku_id: params.sku_id }, 'Getting realtime quote');

    // TODO: Forward to core-mcp
    const basePrice = 20 + Math.random() * 80;

    return reply.send(
      createSuccessResponse(
        {
          sku_id: params.sku_id,
          quantity: params.quantity ?? 1,
          unit_price: Math.round(basePrice * 100) / 100,
          currency: 'USD',
          price_components: [
            { type: 'base_price', amount: Math.round(basePrice * 1.1 * 100) / 100 },
            { type: 'discount', amount: -Math.round(basePrice * 0.1 * 100) / 100 },
          ],
          stock: {
            status: 'in_stock',
            quantity_available: Math.floor(Math.random() * 100) + 10,
          },
          quote_expire_at: new Date(Date.now() + 60000).toISOString(),
        },
        { ttl_seconds: 60 }
      )
    );
  });
}

