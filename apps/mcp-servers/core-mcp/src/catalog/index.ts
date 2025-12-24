/**
 * Catalog Tools
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const catalogTools: Tool[] = [
  {
    name: 'catalog.search_offers',
    description: 'Search for product offers based on query and filters',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        destination_country: { type: 'string', description: 'ISO 2-letter country code' },
        category_id: { type: 'string' },
        price_min: { type: 'number' },
        price_max: { type: 'number' },
        brand: { type: 'string' },
        must_in_stock: { type: 'boolean', default: true },
        sort: { type: 'string', enum: ['relevance', 'price', 'sales', 'rating'] },
        limit: { type: 'integer', default: 50 },
      },
      required: ['query'],
    },
  },
  {
    name: 'catalog.get_offer_card',
    description: 'Get AI-Ready Offer Card (AROC) for a specific offer',
    inputSchema: {
      type: 'object',
      properties: {
        offer_id: { type: 'string', description: 'Offer ID' },
      },
      required: ['offer_id'],
    },
  },
  {
    name: 'catalog.get_offer_variants',
    description: 'Get variant matrix for an offer',
    inputSchema: {
      type: 'object',
      properties: {
        offer_id: { type: 'string' },
      },
      required: ['offer_id'],
    },
  },
  {
    name: 'catalog.get_availability',
    description: 'Check stock availability by destination',
    inputSchema: {
      type: 'object',
      properties: {
        sku_id: { type: 'string' },
        destination_country: { type: 'string' },
      },
      required: ['sku_id'],
    },
  },
];

export function handleCatalogTool(tool: string) {
  return async (params: unknown): Promise<unknown> => {
    const p = params as Record<string, unknown>;

    switch (tool) {
      case 'search_offers':
        // TODO: Implement actual search
        return {
          offer_ids: [`of_${Date.now()}_001`, `of_${Date.now()}_002`],
          scores: [0.95, 0.85],
          total_count: 100,
          has_more: true,
        };

      case 'get_offer_card':
        // TODO: Fetch from database
        return {
          aroc_version: '0.1',
          offer_id: p.offer_id,
          titles: [{ lang: 'en', text: `Product ${p.offer_id}` }],
          brand: { name: 'TestBrand', confidence: 'high' },
        };

      case 'get_offer_variants':
        return {
          offer_id: p.offer_id,
          axes: [{ axis: 'color', values: ['Black', 'White'] }],
          skus: [{ sku_id: `sku_${p.offer_id}_001`, options: { color: 'Black' } }],
        };

      case 'get_availability':
        return {
          sku_id: p.sku_id,
          is_sellable: true,
          stock_status: 'in_stock',
          warehouse_candidates: ['WH_US_CA', 'WH_CN_SZ'],
        };

      default:
        throw new Error(`Unknown catalog tool: ${tool}`);
    }
  };
}

