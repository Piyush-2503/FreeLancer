#!/usr/bin/env node
/**
 * Seed script — creates demo data for local development.
 * NEVER runs in production.
 *
 * Usage: npm run seed
 * Credentials: demo@freelancehub.app / Demo@12345
 */
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env.js';

if (env.NODE_ENV === 'production') {
  console.error('Seed script refused to run in production.');
  process.exit(1);
}

async function seed() {
  await connectDB();
  console.log('Seeding database...');

  // Lazy imports to avoid model registration issues
  const { User } = await import('../src/models/User.js');
  const { Client } = await import('../src/models/Client.js');
  const { Project } = await import('../src/models/Project.js');
  const { Task } = await import('../src/models/Task.js');
  const { TimeEntry } = await import('../src/models/TimeEntry.js');
  const { Invoice, InvoiceCounter } = await import('../src/models/Invoice.js');
  const { Proposal } = await import('../src/models/Proposal.js');
  const { Contract } = await import('../src/models/Contract.js');
  const { Opportunity } = await import('../src/models/Opportunity.js');

  // Clear existing demo data
  await User.deleteMany({ email: { $in: ['demo@freelancehub.app', 'company@freelancehub.app'] } });
  await Opportunity.deleteMany({ companyEmail: 'company@freelancehub.app' });

  // Create demo freelancer
  const passwordHash = await bcrypt.hash('Demo@12345', 12);
  const user = await User.create({
    name: '[DEMO] Alex Freelancer',
    email: 'demo@freelancehub.app',
    passwordHash,
    role: 'freelancer',
    field: 'Web Development',
    businessName: '[DEMO] Alex Studio',
    address: '123 Freelance Lane, Mumbai, MH 400001',
    gstin: '27AABCU9603R1ZX',
    upiId: 'demo@upi',
    defaultTaxRate: 18,
    defaultPaymentTermsDays: 30,
  });

  // Create demo company
  const companyUser = await User.create({
    name: 'Apex Innovations',
    email: 'company@freelancehub.app',
    passwordHash,
    role: 'company',
    businessName: 'Apex Innovations Pvt Ltd',
    companyProfile: {
      hiringRole: 'Senior Full Stack & AI Developer',
      jobDescription: 'Looking for a dedicated developer to build automated client workflow systems and modern React dashboards.',
      budget: 8500000,
    },
  });

  // Seed opportunities from the demo company
  await Opportunity.create([
    {
      company: companyUser._id,
      companyName: 'Apex Innovations Pvt Ltd',
      companyEmail: companyUser.email,
      title: 'Senior Full Stack & AI Developer',
      description: 'Looking for a dedicated developer to build automated client workflow systems and modern React dashboards.',
      budget: 8500000,
      field: 'Web Development',
      status: 'open',
    },
    {
      company: companyUser._id,
      companyName: 'Apex Innovations Pvt Ltd',
      companyEmail: companyUser.email,
      title: 'Technical Content & Copywriter',
      description: 'Need an experienced technical writer to craft developer documentation, API guides, and SaaS case studies.',
      budget: 3500000,
      field: 'Content Writing & Copywriting',
      status: 'open',
    },
  ]);

  // Clear and reset invoice counter for demo user
  await InvoiceCounter.deleteOne({ owner: user._id });

  // Demo clients
  const clients = await Client.insertMany([
    {
      owner: user._id,
      name: 'Aarav Sharma',
      email: 'aarav@kavyatech.in',
      company: 'Kavya Tech Solutions',
      phone: '+91 98765 43210',
      address: '402 Silicon Heights, Outer Ring Road, Bengaluru',
      notes: 'Prefers monthly retainer invoicing for React frontend work.',
      createdAt: new Date('2026-10-15T10:00:00Z'),
    },
    {
      owner: user._id,
      name: 'Priya Nair',
      email: 'priya@designvibe.co',
      company: 'DesignVibe Studios',
      phone: '+91 91234 56789',
      address: '12 Jubilee Enclave, Hitec City, Hyderabad',
      notes: 'Fast payer on net-15 terms. UI/UX consultation client.',
      createdAt: new Date('2026-10-18T10:00:00Z'),
    },
    {
      owner: user._id,
      name: 'Rohan Mehta',
      email: 'rohan@cloudscale.in',
      company: 'CloudScale Logistics',
      phone: '+91 99887 76655',
      address: '88 Cyber City, DLF Phase 2, Gurugram',
      notes: 'Bi-weekly billing cycle for cloud integration dashboard.',
      createdAt: new Date('2026-10-22T10:00:00Z'),
    },
  ]);

  // Demo projects
  const projects = await Promise.all([
    Project.create({
      owner: user._id, client: clients[0]._id,
      title: '[DEMO] E-Commerce Website Redesign',
      description: 'Complete redesign of the Acme Corp e-commerce platform',
      status: 'active', billingType: 'hourly', hourlyRate: 500000, // ₹5000/hr in paise
      startDate: new Date('2026-10-01'), deadline: new Date('2026-12-31'),
    }),
    Project.create({
      owner: user._id, client: clients[1]._id,
      title: '[DEMO] Mobile App Development',
      description: 'React Native app for TechStart',
      status: 'active', billingType: 'fixed', fixedPrice: 30000000, // ₹3,00,000 in paise
      startDate: new Date('2026-09-01'), deadline: new Date('2026-11-30'),
    }),
    Project.create({
      owner: user._id, client: clients[2]._id,
      title: '[DEMO] Brand Identity Design',
      description: 'Complete brand identity package',
      status: 'completed', billingType: 'fixed', fixedPrice: 8000000, // ₹80,000 in paise
    }),
  ]);

  // Tasks for project 1
  const taskStatuses = ['todo', 'in_progress', 'review', 'done'];
  const taskData = [
    { title: '[DEMO] Design wireframes', status: 'done', order: 1000 },
    { title: '[DEMO] Set up development environment', status: 'done', order: 2000 },
    { title: '[DEMO] Build homepage', status: 'in_progress', order: 1000 },
    { title: '[DEMO] Build product catalog', status: 'in_progress', order: 2000 },
    { title: '[DEMO] Implement cart functionality', status: 'todo', order: 1000 },
    { title: '[DEMO] Payment gateway integration', status: 'todo', order: 2000 },
    { title: '[DEMO] Code review - homepage', status: 'review', order: 1000 },
  ];
  const tasks = await Task.insertMany(taskData.map(t => ({
    ...t, project: projects[0]._id, owner: user._id, estimateHours: 8,
  })));

  // Time entries
  const now = new Date();
  const timeEntries = await TimeEntry.insertMany([
    {
      task: tasks[0]._id, project: projects[0]._id, owner: user._id,
      startedAt: new Date(now - 5 * 86400000), endedAt: new Date(now - 5 * 86400000 + 3 * 3600000),
      durationMinutes: 180, note: '[DEMO] Wireframe design session', billable: true, invoiced: true, source: 'timer',
    },
    {
      task: tasks[1]._id, project: projects[0]._id, owner: user._id,
      startedAt: new Date(now - 4 * 86400000), endedAt: new Date(now - 4 * 86400000 + 2 * 3600000),
      durationMinutes: 120, note: '[DEMO] Dev environment setup', billable: true, invoiced: true, source: 'manual',
    },
    {
      task: tasks[2]._id, project: projects[0]._id, owner: user._id,
      startedAt: new Date(now - 2 * 86400000), endedAt: new Date(now - 2 * 86400000 + 4 * 3600000),
      durationMinutes: 240, note: '[DEMO] Homepage development', billable: true, invoiced: false, source: 'timer',
    },
  ]);

  // Invoices
  const invoiceCounter = await InvoiceCounter.findOneAndUpdate(
    { owner: user._id }, { $inc: { seq: 3 } }, { new: true, upsert: true, returnDocument: 'after' }
  );

  const invoices = await Invoice.insertMany([
    {
      owner: user._id, client: clients[0]._id, project: projects[0]._id,
      invoiceNumber: `INV-${now.getFullYear()}-0001`,
      lineItems: [
        { description: '[DEMO] Wireframe Design (3hrs @ ₹5000/hr)', quantity: 3, unitPrice: 500000, amount: 1500000 },
        { description: '[DEMO] Environment Setup (2hrs @ ₹5000/hr)', quantity: 2, unitPrice: 500000, amount: 1000000 },
      ],
      subtotal: 2500000, taxRate: 18, taxAmount: 450000, total: 2950000,
      issueDate: new Date(now - 10 * 86400000),
      dueDate: new Date(now - 3 * 86400000), // Overdue
      status: 'overdue',
    },
    {
      owner: user._id, client: clients[1]._id, project: projects[1]._id,
      invoiceNumber: `INV-${now.getFullYear()}-0002`,
      lineItems: [{ description: '[DEMO] Mobile App - Phase 1', quantity: 1, unitPrice: 15000000, amount: 15000000 }],
      subtotal: 15000000, taxRate: 18, taxAmount: 2700000, total: 17700000,
      issueDate: new Date(now - 5 * 86400000),
      dueDate: new Date(now + 25 * 86400000), // Due in 25 days
      status: 'sent',
    },
    {
      owner: user._id, client: clients[2]._id, project: projects[2]._id,
      invoiceNumber: `INV-${now.getFullYear()}-0003`,
      lineItems: [{ description: '[DEMO] Brand Identity Package', quantity: 1, unitPrice: 8000000, amount: 8000000 }],
      subtotal: 8000000, taxRate: 18, taxAmount: 1440000, total: 9440000,
      issueDate: new Date(now - 30 * 86400000),
      dueDate: new Date(now - 2 * 86400000),
      status: 'paid', paidAt: new Date(now - 5 * 86400000),
    },
  ]);

  // Proposal
  await Proposal.create({
    owner: user._id, client: clients[0]._id,
    title: '[DEMO] Phase 2 - Checkout & Payment Integration',
    scope: '[DEMO] Integration of Razorpay payment gateway, cart functionality, and order management system.',
    deliverables: '[DEMO] Fully functional checkout flow, payment integration, order history page.',
    price: 5000000, // ₹50,000 in paise
    validUntil: new Date(now + 30 * 86400000),
    status: 'sent',
  });

  // Contract
  await Contract.create({
    owner: user._id, client: clients[1]._id, project: projects[1]._id,
    title: '[DEMO] Mobile App Development Agreement',
    body: `[DEMO] This agreement is entered into between Alex Studio ("Contractor") and TechStart Inc ("Client").\n\n1. SCOPE OF WORK\nContractor will develop a React Native mobile application as described in the project brief.\n\n2. PAYMENT TERMS\nClient agrees to pay ₹3,00,000 in two installments: 50% upfront, 50% on delivery.\n\n3. INTELLECTUAL PROPERTY\nUpon full payment, all intellectual property rights transfer to the Client.\n\n4. TIMELINE\nThe project will be completed within 90 days of signing this agreement.\n\n⚠️ NOTICE: This is a demonstration electronic signature, not a legally certified digital signature. For legally binding contracts, consult a legal professional.`,
    status: 'sent',
  });

  console.log('✅ Seed complete!');
  console.log('Freelancer login: demo@freelancehub.app / Demo@12345');
  console.log('Company login:    company@freelancehub.app / Demo@12345');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
