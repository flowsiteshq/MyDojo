import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from './db';
import {
  createChangeRequest,
  getChangeRequestsByUser,
  getPendingRequests,
  approveRequest,
  denyRequest,
} from './membershipChangeRequests';

describe('Membership Change Requests', () => {
  let testUserId: number;
  let testEnrollmentId: number;
  let testRequestId: number;

  beforeEach(async () => {
    const db = await getDb();
    
    // Create a test user
    const [user] = await db.execute(
      'INSERT INTO user (email, name, role) VALUES (?, ?, ?)',
      ['test-member@example.com', 'Test Member', 'user']
    );
    testUserId = (user as any).insertId;

    // Create a test enrollment
    const [enrollment] = await db.execute(
      `INSERT INTO enrollments (
        userId, customerName, customerEmail, customerPhone,
        membershipPackageId, enrollmentStatus
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [testUserId, 'Test Member', 'test-member@example.com', '1234567890', 1, 'active']
    );
    testEnrollmentId = (enrollment as any).insertId;
  });

  it('should create a pause request', async () => {
    const request = await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'pause',
      reason: 'Need to take a break for medical reasons',
    });

    expect(request).toBeDefined();
    expect(request.requestType).toBe('pause');
    expect(request.status).toBe('pending');
    expect(request.reason).toBe('Need to take a break for medical reasons');
    
    testRequestId = request.id;
  });

  it('should create a cancel request', async () => {
    const request = await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'cancel',
      reason: 'Moving to a different city',
    });

    expect(request).toBeDefined();
    expect(request.requestType).toBe('cancel');
    expect(request.status).toBe('pending');
  });

  it('should get change requests by user', async () => {
    // Create two requests
    await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'pause',
      reason: 'Test reason 1',
    });

    await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'cancel',
      reason: 'Test reason 2',
    });

    const requests = await getChangeRequestsByUser(testUserId);
    expect(requests.length).toBeGreaterThanOrEqual(2);
  });

  it('should get pending requests', async () => {
    await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'pause',
      reason: 'Pending request test',
    });

    const pendingRequests = await getPendingRequests();
    expect(pendingRequests.length).toBeGreaterThan(0);
    expect(pendingRequests.some(r => r.status === 'pending')).toBe(true);
  });

  it('should approve a request', async () => {
    const request = await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'pause',
      reason: 'Approval test',
    });

    const approved = await approveRequest({
      requestId: request.id,
      adminNotes: 'Approved for valid reason',
    });

    expect(approved).toBeDefined();
    expect(approved.status).toBe('approved');
    expect(approved.adminNotes).toBe('Approved for valid reason');
    expect(approved.reviewedAt).toBeDefined();
  });

  it('should deny a request', async () => {
    const request = await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'cancel',
      reason: 'Denial test',
    });

    const denied = await denyRequest({
      requestId: request.id,
      adminNotes: 'Cannot approve at this time',
    });

    expect(denied).toBeDefined();
    expect(denied.status).toBe('denied');
    expect(denied.adminNotes).toBe('Cannot approve at this time');
    expect(denied.reviewedAt).toBeDefined();
  });

  it('should not allow duplicate pending requests for same enrollment', async () => {
    await createChangeRequest({
      userId: testUserId,
      enrollmentId: testEnrollmentId,
      requestType: 'pause',
      reason: 'First request',
    });

    // Try to create another pending request for the same enrollment
    await expect(
      createChangeRequest({
        userId: testUserId,
        enrollmentId: testEnrollmentId,
        requestType: 'cancel',
        reason: 'Second request',
      })
    ).rejects.toThrow();
  });
});
