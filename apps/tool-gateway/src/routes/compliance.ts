/**
 * Compliance Tool Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSuccessResponse, createLogger } from '@shopping-agent/common';

const logger = createLogger('compliance');

export async function complianceRoutes(app: FastifyInstance): Promise<void> {
  /**
   * compliance.check_item
   */
  app.post('/check_item', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      params?: { sku_id?: string; destination_country?: string };
    };
    const params = body.params ?? {};

    if (!params.sku_id) {
      return reply.status(400).send({
        ok: false,
        error: { code: 'INVALID_ARGUMENT', message: 'sku_id is required' },
        warnings: [],
      });
    }

    logger.info(
      { sku_id: params.sku_id, country: params.destination_country },
      'Checking compliance'
    );

    // TODO: Forward to core-mcp with actual compliance rules
    return reply.send(
      createSuccessResponse({
        allowed: true,
        reason_codes: [],
        required_docs: [],
        mitigations: [],
        ruleset_version: 'cr_2025_12_24',
      })
    );
  });

  /**
   * compliance.policy_ruleset_version
   */
  app.post('/policy_ruleset_version', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(
      createSuccessResponse({
        version: 'cr_2025_12_24',
        valid_from: '2024-12-24T00:00:00Z',
      })
    );
  });
}

