import { FastifyInstance } from 'fastify';
import { reportService } from '../services/reportService';
import { storageService } from '../services/storageService';
import { ReportType, ReportFormat } from '../models/report';

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/reports', async (request, reply) => {
    const { name, type, format, filters } = request.body as {
      name: string;
      type: ReportType;
      format: ReportFormat;
      filters?: Record<string, unknown>;
    };

    if (!name || !type || !format) {
      return reply.status(400).send({
        error: 'Missing required fields: name, type, format',
      });
    }

    const validTypes: ReportType[] = ['TRANSACTIONS', 'ACCOUNTS', 'SETTLEMENTS', 'CUSTOM'];
    const validFormats: ReportFormat[] = ['XLSX', 'CSV', 'JSON', 'PDF'];

    if (!validTypes.includes(type)) {
      return reply.status(400).send({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    if (!validFormats.includes(format)) {
      return reply.status(400).send({ error: `Invalid format. Must be one of: ${validFormats.join(', ')}` });
    }

    const report = await reportService.createReport({ name, type, format, filters });

    return reply.status(201).send(report);
  });

  app.get('/api/reports', async (request, reply) => {
    const { page, limit } = request.query as { page?: string; limit?: string };
    const result = await reportService.listReports(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10)
    );
    return reply.send(result);
  });

  app.get('/api/reports/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await reportService.getReport(id);

    if (!report) {
      return reply.status(404).send({ error: 'Report not found' });
    }

    return reply.send(report);
  });

  app.get('/api/reports/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await reportService.getReport(id);

    if (!report) {
      return reply.status(404).send({ error: 'Report not found' });
    }

    if (report.status !== 'COMPLETED' || !report.fileUrl) {
      return reply.status(400).send({
        error: `Report is not ready. Current status: ${report.status}`,
      });
    }

    const key = report.fileUrl.split('/').slice(-2).join('/');

    const downloadUrl = await storageService.getDownloadUrl(key);

    return reply.redirect(downloadUrl);
  });

  app.delete('/api/reports/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await reportService.deleteReport(id);
      return reply.status(204).send();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(404).send({ error: message });
    }
  });
}
