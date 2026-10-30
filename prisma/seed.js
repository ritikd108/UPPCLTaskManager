const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing records...');
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.taskHistory.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.requirement.deleteMany({});
  await prisma.requirementDoc.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.systemSetting.deleteMany({});

  console.log('Seeding Users...');
  const admin = await prisma.user.create({
    data: {
      userId: 'USR-001',
      name: 'Sarah Jenkins',
      email: 'admin@portal.com',
      password: 'password123',
      role: 'ADMIN',
      department: 'Engineering Leadership',
      designation: 'Principal Project Director',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      userId: 'USR-002',
      name: 'Alex Rivera',
      email: 'manager@portal.com',
      password: 'password123',
      role: 'MANAGER',
      department: 'Product Delivery',
      designation: 'Senior Technical Project Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isActive: true,
    },
  });

  const employee = await prisma.user.create({
    data: {
      userId: 'USR-003',
      name: 'David Chen',
      email: 'dev@portal.com',
      password: 'password123',
      role: 'USER',
      department: 'Core Engineering',
      designation: 'Senior Full-Stack Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      isActive: true,
    },
  });

  const qaUser = await prisma.user.create({
    data: {
      userId: 'USR-004',
      name: 'Elena Rostova',
      email: 'qa@portal.com',
      password: 'password123',
      role: 'USER',
      department: 'Quality Assurance',
      designation: 'Lead Test Automation Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
    },
  });

  console.log('Seeding Projects...');
  const project1 = await prisma.project.create({
    data: {
      projectId: 'PRJ-101',
      name: 'Jhatpat Portal Enhancement',
      code: 'JHATPAT',
      description: 'Centralized microservices overhaul for payments, checkout reliability, and automated reporting.',
      status: 'Active',
      startDate: new Date('2026-10-01'),
      targetDate: new Date('2026-12-15'),
      managerId: manager.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      projectId: 'PRJ-102',
      name: 'Enterprise Cloud Migration',
      code: 'CLOUDMIG',
      description: 'Transition of legacy monolith workloads to hybrid cloud Kubernetes clusters.',
      status: 'In Planning',
      startDate: new Date('2026-11-01'),
      targetDate: new Date('2027-03-31'),
      managerId: manager.id,
    },
  });

  // Assign project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: admin.id, role: 'Executive Sponsor' },
      { projectId: project1.id, userId: manager.id, role: 'Project Lead' },
      { projectId: project1.id, userId: employee.id, role: 'Full-Stack Developer' },
      { projectId: project1.id, userId: qaUser.id, role: 'QA Lead' },
      { projectId: project2.id, userId: manager.id, role: 'Project Lead' },
      { projectId: project2.id, userId: employee.id, role: 'Cloud Engineer' },
    ],
  });

  console.log('Seeding Categories...');
  const catBackend = await prisma.category.create({
    data: { name: 'Backend & APIs', color: '#0c8ee9', projectId: project1.id },
  });
  const catFrontend = await prisma.category.create({
    data: { name: 'Frontend & UI', color: '#8b5cf6', projectId: project1.id },
  });
  const catTesting = await prisma.category.create({
    data: { name: 'QA & Testing', color: '#10b981', projectId: project1.id },
  });
  const catSecurity = await prisma.category.create({
    data: { name: 'Security & Compliance', color: '#f59e0b', projectId: project1.id },
  });

  console.log('Seeding Requirement Document...');
  const docSampleText = `# Jhatpat Portal Enhancement Requirements Specification
Version: 1.0
Author: Product Architecture Team
Project: Jhatpat Portal Enhancement (PRJ-101)

## Section 1: Introduction and Objective
This functional specification details enhancements required to scale the Jhatpat portal payment gateway, improve checkout turnaround times, and automate transactional taxation compliance.

## Section 3.2: Payment Gateway Integration
The application must integrate with the new multi-currency payment gateway service.
Requirements:
1. Integrate the payment gateway with the new portal with support for webhooks.
2. Verify payment status asynchronously and notify users in real-time.
3. Handle failure fallbacks, idempotency tokens, and timeout reconciliations.
Deliverable: Production-ready payment checkout endpoints with end-to-end integration test coverage.

## Section 3.4: Order Status Reconciliation
Synchronize order fulfillment statuses between external logistics partners and local databases.
Requirements:
1. Poll and webhook synchronize dispatch events every 15 minutes.
2. Emit status update events to subscriber microservices.
Deliverable: Scheduled background reconciliation worker.

## Section 4.1: Automated GST Invoice Generation
Every completed transaction must automatically trigger compliant GST invoice generation.
Requirements:
1. Format invoice with HSN codes, buyer GSTIN, and digital verification seal.
2. Render PDF invoice within 2 seconds of order confirmation.
Deliverable: Fast PDF generation microservice and downloadable storage link.
`;

  const reqDoc = await prisma.requirementDoc.create({
    data: {
      docId: 'DOC-1001',
      title: 'Jhatpat Portal Enhancement Requirements',
      description: 'Core functional requirements document covering payment gateway, order reconciliation, and taxation invoices.',
      fileType: 'DOCX',
      version: '1.0',
      status: 'Active',
      rawContent: docSampleText,
      projectId: project1.id,
      uploadedById: manager.id,
    },
  });

  console.log('Seeding Extracted Requirements...');
  const req1 = await prisma.requirement.create({
    data: {
      reqId: 'REQ-201',
      documentId: reqDoc.id,
      title: 'Payment Gateway Integration',
      description: 'Integrate the payment gateway with the new portal, supporting HMAC signature verification, multi-currency intents, and idempotency.',
      sourceSection: 'Section 3.2: Payment Gateway Integration',
      sourcePage: 'Page 3',
      priority: 'Critical',
      deliverable: 'Complete end-to-end payment gateway API and checkout UI flow',
      dependencies: 'None',
      analysisStatus: 'Approved',
    },
  });

  const req2 = await prisma.requirement.create({
    data: {
      reqId: 'REQ-202',
      documentId: reqDoc.id,
      title: 'Order Status Reconciliation',
      description: 'Automated 15-minute background reconciliation of asynchronous payment and dispatch events.',
      sourceSection: 'Section 3.4: Order Status Reconciliation',
      sourcePage: 'Page 4',
      priority: 'High',
      deliverable: 'Scheduled reconciliation background worker and health telemetry',
      dependencies: 'REQ-201',
      analysisStatus: 'Approved',
    },
  });

  const req3 = await prisma.requirement.create({
    data: {
      reqId: 'REQ-203',
      documentId: reqDoc.id,
      title: 'Automated GST Invoice Generation',
      description: 'Generate legally compliant GST PDF invoices with digital verification seal within 2 seconds of completion.',
      sourceSection: 'Section 4.1: Automated GST Invoice Generation',
      sourcePage: 'Page 6',
      priority: 'Medium',
      deliverable: 'PDF generation microservice and downloadable storage links',
      dependencies: 'REQ-201',
      analysisStatus: 'Approved',
    },
  });

  console.log('Seeding Tasks with Traceability & Workflow...');
  const now = new Date();
  const pastDays = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const futureDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // Task A: Review existing payment gateway APIs
  const taskA = await prisma.task.create({
    data: {
      taskId: 'TSK-501',
      title: 'Review existing payment gateway APIs',
      description: 'Inspect gateway endpoint specifications, token auth, and idempotency guarantees.',
      projectId: project1.id,
      categoryId: catBackend.id,
      assignedToId: employee.id,
      createdById: manager.id,
      priority: 'High',
      status: 'COMPLETED',
      startDate: pastDays(10),
      dueDate: pastDays(7),
      completionDate: pastDays(7),
      deliverable: 'API Specification Comparison Matrix',
      sourceType: 'REQUIREMENT_DOC',
      requirementDocId: reqDoc.id,
      requirementId: req1.id,
      sourceReference: 'Section 3.2',
    },
  });

  // Task B: Develop payment gateway integration
  const taskB = await prisma.task.create({
    data: {
      taskId: 'TSK-502',
      title: 'Develop payment gateway integration',
      description: 'Write integration services for payment intent creation, capture, and refunds.',
      projectId: project1.id,
      categoryId: catBackend.id,
      assignedToId: employee.id,
      createdById: manager.id,
      priority: 'Critical',
      status: 'IN_PROGRESS',
      startDate: pastDays(6),
      dueDate: futureDays(2),
      deliverable: 'Payment intent controller and webhook listener',
      sourceType: 'REQUIREMENT_DOC',
      requirementDocId: reqDoc.id,
      requirementId: req1.id,
      sourceReference: 'Section 3.2',
    },
  });

  // Task C: Implement payment status verification
  const taskC = await prisma.task.create({
    data: {
      taskId: 'TSK-503',
      title: 'Implement payment status verification',
      description: 'Build asynchronous polling and webhook signature verification handler.',
      projectId: project1.id,
      categoryId: catBackend.id,
      assignedToId: employee.id,
      createdById: manager.id,
      priority: 'High',
      status: 'IN_PROGRESS',
      startDate: pastDays(2),
      dueDate: futureDays(4),
      deliverable: 'Signature verifier and payment status sync service',
      sourceType: 'REQUIREMENT_DOC',
      requirementDocId: reqDoc.id,
      requirementId: req1.id,
      sourceReference: 'Section 3.2',
    },
  });

  // Task D: Perform integration testing
  const taskD = await prisma.task.create({
    data: {
      taskId: 'TSK-504',
      title: 'Perform integration testing',
      description: 'Execute sandbox payment simulations, invalid card tests, and webhook timeout drills.',
      projectId: project1.id,
      categoryId: catTesting.id,
      assignedToId: qaUser.id,
      createdById: manager.id,
      priority: 'High',
      status: 'NOT_STARTED',
      startDate: futureDays(4),
      dueDate: futureDays(7),
      deliverable: 'QA Integration Test Report and Traceability Sign-off',
      sourceType: 'REQUIREMENT_DOC',
      requirementDocId: reqDoc.id,
      requirementId: req1.id,
      sourceReference: 'Section 3.2',
    },
  });

  // Task E: Complete production deployment
  const taskE = await prisma.task.create({
    data: {
      taskId: 'TSK-505',
      title: 'Complete production deployment',
      description: 'Configure production API credentials, secrets management, and smoke tests.',
      projectId: project1.id,
      categoryId: catBackend.id,
      assignedToId: employee.id,
      createdById: admin.id,
      priority: 'Critical',
      status: 'NOT_STARTED',
      startDate: futureDays(7),
      dueDate: futureDays(10),
      deliverable: 'Live gateway deployment in production environment',
      sourceType: 'REQUIREMENT_DOC',
      requirementDocId: reqDoc.id,
      requirementId: req1.id,
      sourceReference: 'Section 3.2',
    },
  });

  // Additional tasks: GST Invoice & Recurring Task & Overdue Task
  const taskInvoice = await prisma.task.create({
    data: {
      taskId: 'TSK-506',
      title: 'Setup automated GST invoice PDF renderer',
      description: 'Build microservice to render transactional invoices with verified QR code stamp.',
      projectId: project1.id,
      categoryId: catBackend.id,
      assignedToId: employee.id,
      createdById: manager.id,
      priority: 'Medium',
      status: 'COMPLETED',
      startDate: pastDays(12),
      dueDate: pastDays(3),
      completionDate: pastDays(4),
      deliverable: 'PDF Invoice generator with S3/local file caching',
      sourceType: 'REQUIREMENT_DOC',
      requirementDocId: reqDoc.id,
      requirementId: req3.id,
      sourceReference: 'Section 4.1',
    },
  });

  const taskOverdue = await prisma.task.create({
    data: {
      taskId: 'TSK-507',
      title: 'Implement database indexing for legacy order queries',
      description: 'Optimize high-traffic SQL queries for historical orders to improve response times.',
      projectId: project1.id,
      categoryId: catBackend.id,
      assignedToId: employee.id,
      createdById: manager.id,
      priority: 'Critical',
      status: 'IN_PROGRESS',
      startDate: pastDays(14),
      dueDate: pastDays(2), // Overdue!
      deliverable: 'Database index migration script and query benchmark report',
      sourceType: 'MANUAL',
    },
  });

  const taskRecurring = await prisma.task.create({
    data: {
      taskId: 'TSK-508',
      title: 'Recurring weekly security vulnerability scan',
      description: 'Run automated static and dynamic penetration security scans on all microservices.',
      projectId: project1.id,
      categoryId: catSecurity.id,
      assignedToId: qaUser.id,
      createdById: admin.id,
      priority: 'High',
      status: 'IN_PROGRESS',
      startDate: pastDays(1),
      dueDate: futureDays(3),
      isRecurring: true,
      recurrenceRule: 'WEEKLY',
      recurrenceNext: futureDays(7),
      deliverable: 'Weekly automated security audit log',
      sourceType: 'MANUAL',
    },
  });

  console.log('Seeding Task Dependencies...');
  // Task B depends on Task A
  await prisma.taskDependency.create({
    data: { taskId: taskB.id, dependsOnTaskId: taskA.id },
  });
  // Task C depends on Task B
  await prisma.taskDependency.create({
    data: { taskId: taskC.id, dependsOnTaskId: taskB.id },
  });
  // Task D depends on Task C
  await prisma.taskDependency.create({
    data: { taskId: taskD.id, dependsOnTaskId: taskC.id },
  });
  // Task E depends on Task D
  await prisma.taskDependency.create({
    data: { taskId: taskE.id, dependsOnTaskId: taskD.id },
  });

  console.log('Seeding Task Comments & History...');
  await prisma.taskComment.createMany({
    data: [
      {
        taskId: taskB.id,
        userId: manager.id,
        content: 'Please ensure webhook idempotency keys are stored in redis/db with 24hr TTL.',
      },
      {
        taskId: taskB.id,
        userId: employee.id,
        content: 'Implemented HMAC SHA-256 header validation. Mock sandbox webhook tests passing.',
      },
    ],
  });

  await prisma.taskHistory.createMany({
    data: [
      {
        taskId: taskA.id,
        userId: employee.id,
        changeType: 'STATUS_CHANGE',
        oldValue: 'IN_PROGRESS',
        newValue: 'COMPLETED',
        remarks: 'API matrix documented and signed off.',
      },
      {
        taskId: taskB.id,
        userId: manager.id,
        changeType: 'STATUS_CHANGE',
        oldValue: 'NOT_STARTED',
        newValue: 'IN_PROGRESS',
        remarks: 'Started implementation after dependency TSK-501 completed.',
      },
      {
        taskId: taskB.id,
        userId: admin.id,
        changeType: 'PRIORITY_CHANGE',
        oldValue: 'High',
        newValue: 'Critical',
        remarks: 'Elevated priority due to upcoming quarterly launch.',
      },
    ],
  });

  console.log('Seeding Notifications & Activity Logs...');
  await prisma.notification.createMany({
    data: [
      {
        userId: employee.id,
        title: 'New Task Assignment',
        message: 'You have been assigned to task TSK-502: Develop payment gateway integration.',
        type: 'TASK_ASSIGNED',
        link: `/tasks/${taskB.id}`,
      },
      {
        userId: employee.id,
        title: 'Task Overdue Alert',
        message: 'Task TSK-507 (Implement database indexing) is overdue since 2 days ago.',
        type: 'TASK_OVERDUE',
        link: `/tasks/${taskOverdue.id}`,
      },
      {
        userId: manager.id,
        title: 'AI Requirement Analysis Complete',
        message: 'Document DOC-1001 was successfully analyzed: 3 requirements extracted and linked.',
        type: 'AI_ANALYSIS_COMPLETE',
        link: `/documents/${reqDoc.id}`,
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: manager.id,
        action: 'Uploaded Requirement Document DOC-1001',
        entityType: 'DOCUMENT',
        entityId: reqDoc.id,
        details: 'Uploaded Jhatpat Portal Enhancement Requirements (v1.0).',
      },
      {
        userId: manager.id,
        action: 'AI Analyzed Document DOC-1001',
        entityType: 'REQUIREMENT',
        entityId: req1.id,
        details: 'Extracted requirements REQ-201, REQ-202, REQ-203.',
      },
      {
        userId: employee.id,
        action: 'Completed Task TSK-501',
        entityType: 'TASK',
        entityId: taskA.id,
        details: 'Status transitioned from IN_PROGRESS to COMPLETED.',
      },
      {
        userId: employee.id,
        action: 'Updated Status for TSK-502',
        entityType: 'TASK',
        entityId: taskB.id,
        details: 'Status updated to IN_PROGRESS.',
      },
    ],
  });

  // Default system settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'APP_NAME', value: 'Antigravity Task & Requirement Portal' },
      { key: 'DEFAULT_THEME', value: 'light' },
      { key: 'TIMEZONE', value: 'Asia/Kolkata' },
      { key: 'GEMINI_API_KEY', value: '' },
      { key: 'GOOGLE_DRIVE_CLIENT_ID', value: '' },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
