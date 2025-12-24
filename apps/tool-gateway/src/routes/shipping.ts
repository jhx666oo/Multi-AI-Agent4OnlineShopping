/**
 * Shipping Tool Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSuccessResponse, createLogger } from '@shopping-agent/common';

const logger = createLogger('shipping');

export async function shippingRoutes(app: FastifyInstance): Promise<void> {
  /**
   * shipping.validate_address
   */
  app.post('/validate_address', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { params?: Record<string, string> };
    const params = body.params ?? {};

    logger.info({ country: params.country }, 'Validating address');

    return reply.send(
      createSuccessResponse({
        normalized_address: {
          country: params.country ?? 'US',
          state: params.state ?? 'CA',
          city: params.city ?? 'Los Angeles',
          postal_code: params.postal_code ?? '90001',
          address_line1: params.address_line1 ?? '123 Main St',
        },
        is_deliverable: true,
        suggestions: [],
      })
    );
  });

  /**
   * shipping.quote_options
   */
  app.post('/quote_options', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      params?: { items?: Array<{ sku_id: string; qty: number }>; destination?: Record<string, string> };
    };
    const params = body.params ?? {};

    logger.info({ items_count: params.items?.length }, 'Quoting shipping options');

    return reply.send(
      createSuccessResponse(
        {
          options: [
            {
              shipping_option_id: 'ship_standard',
              carrier: 'Standard Shipping',
              service_level: 'standard',
              price: 5.99,
              currency: 'USD',
              eta_min_days: 7,
              eta_max_days: 14,
              tracking_supported: true,
              constraints: [],
            },
            {
              shipping_option_id: 'ship_express',
              carrier: 'Express Shipping',
              service_level: 'express',
              price: 15.99,
              currency: 'USD',
              eta_min_days: 3,
              eta_max_days: 5,
              tracking_supported: true,
              constraints: [],
            },
          ],
          quote_expire_at: new Date(Date.now() + 300000).toISOString(),
        },
        { ttl_seconds: 300 }
      )
    );
  });
}

