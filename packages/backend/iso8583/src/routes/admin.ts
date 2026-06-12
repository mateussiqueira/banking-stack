import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getAllCards,
  findCard,
  createCard,
  resetCardBalance,
  resetAllCards,
  MockCard,
} from '../services/mockCardDB';

export default async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/admin/cards', async (_request, reply) => {
    const cards = getAllCards();
    reply.send({
      count: cards.length,
      cards: cards.map((c) => ({
        pan: c.pan,
        expiry: c.expiry,
        cvv: c.cvv,
        balance: c.balance,
        balanceFormatted: (c.balance / 100).toFixed(2),
        currency: c.currency,
        status: c.status,
        holderName: c.holderName,
        brand: c.brand,
        initialBalance: c.initialBalance,
      })),
    });
  });

  fastify.post<{ Body: Partial<MockCard> }>('/admin/cards', async (request, reply) => {
    try {
      const { pan, expiry, cvv, balance, currency, status, holderName, brand } = request.body;

      if (!pan) {
        reply.status(400).send({ error: 'PAN is required' });
        return;
      }

      const newCard: MockCard = {
        pan,
        expiry: expiry || '3001',
        cvv: cvv || '000',
        balance: balance ?? 10000,
        currency: currency || 'BRL',
        status: status || 'active',
        holderName: holderName || 'HOLDER/NAME',
        brand: brand || 'visa',
        initialBalance: balance ?? 10000,
      };

      const created = createCard(newCard);
      reply.status(201).send({
        message: 'Card created',
        card: { ...created, initialBalance: undefined },
      });
    } catch (err: any) {
      reply.status(400).send({ error: err.message });
    }
  });

  fastify.post<{ Params: { pan: string } }>('/admin/cards/:pan/reset', async (request, reply) => {
    const { pan } = request.params;
    const card = resetCardBalance(pan);
    if (!card) {
      reply.status(404).send({ error: `Card ${pan} not found` });
      return;
    }
    reply.send({
      message: 'Balance reset',
      pan: card.pan,
      balance: card.balance,
      balanceFormatted: (card.balance / 100).toFixed(2),
    });
  });

  fastify.post('/admin/reset', async (_request, reply) => {
    resetAllCards();
    reply.send({ message: 'All card balances have been reset' });
  });
}
