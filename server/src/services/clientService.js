import { Client } from '../models/Client.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * List clients for an owner with pagination and optional search.
 */
export async function listClients(ownerId, { page = 1, limit = 20, search = '', includeArchived = false } = {}) {
  const query = { owner: ownerId };

  if (!includeArchived) {
    query.archivedAt = null;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name: regex }, { email: regex }, { company: regex }];
  }

  const skip = (page - 1) * limit;
  const [clients, total] = await Promise.all([
    Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Client.countDocuments(query),
  ]);

  return {
    clients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a new client for an owner.
 */
export async function createClient(ownerId, data) {
  const client = await Client.create({ owner: ownerId, ...data });
  return client;
}

/**
 * Get a single client by id, scoped to owner.
 */
export async function getClient(ownerId, id) {
  const client = await Client.findOne({ _id: id, owner: ownerId });
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  return client;
}

/**
 * Update a client, scoped to owner.
 */
export async function updateClient(ownerId, id, data) {
  const client = await Client.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: data },
    { returnDocument: 'after', runValidators: true }
  );
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  return client;
}

/**
 * Delete a client. If client has associated projects/invoices/contracts, refuse and suggest archive.
 * Otherwise, hard delete.
 */
export async function deleteClient(ownerId, id) {
  const client = await Client.findOne({ _id: id, owner: ownerId });
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');

  // Check for associated data in future models. For now we use dynamic imports to avoid
  // circular dependency issues and handle case where models may not exist yet.
  let hasAssociated = false;
  try {
    const { Project } = await import('../models/Project.js').catch(() => ({ Project: null }));
    const { Invoice } = await import('../models/Invoice.js').catch(() => ({ Invoice: null }));
    const { Contract } = await import('../models/Contract.js').catch(() => ({ Contract: null }));

    if (Project) {
      const projectCount = await Project.countDocuments({ client: id, owner: ownerId });
      if (projectCount > 0) hasAssociated = true;
    }
    if (Invoice && !hasAssociated) {
      const invoiceCount = await Invoice.countDocuments({ client: id, owner: ownerId });
      if (invoiceCount > 0) hasAssociated = true;
    }
    if (Contract && !hasAssociated) {
      const contractCount = await Contract.countDocuments({ client: id, owner: ownerId });
      if (contractCount > 0) hasAssociated = true;
    }
  } catch {
    // Models not yet available; proceed with deletion
  }

  if (hasAssociated) {
    throw new AppError(
      'Cannot delete client with associated projects, invoices, or contracts. Archive the client instead.',
      409,
      'HAS_ASSOCIATIONS'
    );
  }

  await Client.deleteOne({ _id: id, owner: ownerId });
  return { deleted: true };
}

/**
 * Archive a client by setting archivedAt.
 */
export async function archiveClient(ownerId, id) {
  const client = await Client.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: { archivedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  return client;
}

/**
 * Unarchive a client by clearing archivedAt.
 */
export async function unarchiveClient(ownerId, id) {
  const client = await Client.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: { archivedAt: null } },
    { returnDocument: 'after' }
  );
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  return client;
}
