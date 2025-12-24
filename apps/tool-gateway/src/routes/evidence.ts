/**
 * Evidence Tool Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSuccessResponse, createLogger } from '@shopping-agent/common';

const logger = createLogger('evidence');

export async function evidenceRoutes(app: FastifyInstance): Promise<void> {
  /**
   * evidence.create_snapshot
   */
  app.post('/create_snapshot', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      params?: { context?: Record<string, unknown>; tool_calls?: unknown[] };
    };
    const params = body.params ?? {};

    const snapshotId = `ev_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${crypto.randomUUID().slice(0, 8)}`;

    logger.info({ snapshot_id: snapshotId }, 'Creating evidence snapshot');

    return reply.send(
      createSuccessResponse({
        snapshot_id: snapshotId,
        user_id: params.context?.user_id,
        mission_id: params.context?.mission_id,
        objects: params.context?.objects ?? {},
        tool_calls_count: params.tool_calls?.length ?? 0,
        created_at: new Date().toISOString(),
      })
    );
  });

  /**
   * evidence.attach_to_draft_order
   */
  app.post('/attach_to_draft_order', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      params?: { draft_order_id?: string; snapshot_id?: string };
    };
    const params = body.params ?? {};

    logger.info(
      { draft_order_id: params.draft_order_id, snapshot_id: params.snapshot_id },
      'Attaching evidence to draft order'
    );

    return reply.send(
      createSuccessResponse({
        draft_order_id: params.draft_order_id,
        snapshot_id: params.snapshot_id,
        attached_at: new Date().toISOString(),
      })
    );
  });
}

