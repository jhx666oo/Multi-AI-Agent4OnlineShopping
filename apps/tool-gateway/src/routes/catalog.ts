/**
 * Catalog Tool Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSuccessResponse, createLogger } from '@shopping-agent/common';

const logger = createLogger('catalog');

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  /**
   * catalog.search_offers
   */
  app.post('/search_offers', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { params?: Record<string, unknown> };
    const params = body.params ?? {};

    logger.info({ query: params.query }, 'Searching offers');

    // TODO: Forward to core-mcp
    // For now, return mock data
    const mockOffers = Array.from({ length: 20 }, (_, i) => `of_${String(i + 1).padStart(6, '0')}`);

    return reply.send(
      createSuccessResponse({
        offer_ids: mockOffers,
        scores: mockOffers.map((_, i) => 0.95 - i * 0.02),
        total_count: 100,
        has_more: true,
      })
    );
  });

  /**
   * catalog.get_offer_card
   */
  app.post('/get_offer_card', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { params?: { offer_id?: string } };
    const offerId = body.params?.offer_id;

    if (!offerId) {
      return reply.status(400).send({
        ok: false,
        error: { code: 'INVALID_ARGUMENT', message: 'offer_id is required' },
        warnings: [],
      });
    }

    logger.info({ offer_id: offerId }, 'Getting offer card');

    // TODO: Forward to core-mcp
    return reply.send(
      createSuccessResponse({
        aroc_version: '0.1',
        offer_id: offerId,
        spu_id: `spu_${offerId.slice(3)}`,
        merchant_id: 'm_001',
        titles: [
          { lang: 'en', text: `Product ${offerId}` },
          { lang: 'zh', text: `商品 ${offerId}` },
        ],
        brand: { name: 'TestBrand', confidence: 'high' },
        category: { cat_id: 'c_001', path: ['Electronics', 'Gadgets'] },
        attributes: [],
        variants: {
          axes: [{ axis: 'color', values: ['Black', 'White'] }],
          skus: [
            {
              sku_id: `sku_${offerId.slice(3)}_001`,
              options: { color: 'Black' },
              risk_tags: [],
            },
          ],
        },
        risk_profile: { fragile: false, sizing_uncertainty: 'low' },
      })
    );
  });
}

