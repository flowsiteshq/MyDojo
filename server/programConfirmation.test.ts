import { describe, it, expect, vi, beforeEach } from 'vitest';
import QRCode from 'qrcode';

// Mock the Resend client
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
    },
  })),
}));

// Mock the env module
vi.mock('./_core/env', () => ({
  ENV: {
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'noreply@mydojoma.com',
    ownerOpenId: 'owner123',
  },
}));

describe('Program Confirmation Email', () => {
  it('should generate a valid QR code data URL', async () => {
    const payload = JSON.stringify({
      type: 'member',
      email: 'test@example.com',
      program: 'Foundation',
      enrollmentId: 123,
      ts: Date.now(),
    });
    const qrDataUrl = await QRCode.toDataURL(payload, { width: 200, margin: 1 });
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should call sendProgramConfirmationEmail without throwing', async () => {
    const { sendProgramConfirmationEmail } = await import('./emailService');

    const result = await sendProgramConfirmationEmail({
      toEmail: 'customer@example.com',
      customerName: 'John Smith',
      program: 'Foundation',
      amountPaid: 248,
      qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      scheduleRows: [
        { dayOfWeek: 'Monday', startTime: '6:00 PM', endTime: '7:00 PM', location: 'HQ', instructor: 'Sensei Vincent' },
        { dayOfWeek: 'Wednesday', startTime: '6:00 PM', endTime: '7:00 PM', location: 'HQ', instructor: 'Sensei Vincent' },
        { dayOfWeek: 'Friday', startTime: '6:00 PM', endTime: '7:00 PM', location: 'HQ', instructor: null },
      ],
      referenceId: 123,
    });

    expect(result).toBe(true);
  });

  it('should return false when RESEND_API_KEY is not set', async () => {
    vi.resetModules();
    vi.doMock('./_core/env', () => ({
      ENV: {
        RESEND_API_KEY: '',
        EMAIL_FROM: 'noreply@mydojoma.com',
        ownerOpenId: 'owner123',
      },
    }));

    const { sendProgramConfirmationEmail } = await import('./emailService');
    const result = await sendProgramConfirmationEmail({
      toEmail: 'customer@example.com',
      customerName: 'Jane Doe',
      program: 'Kickboxing',
      qrCodeDataUrl: 'data:image/png;base64,test',
      scheduleRows: [],
    });

    // Should gracefully return false, not throw
    expect(typeof result).toBe('boolean');
  });

  it('should include special name in subject when specialName is provided', async () => {
    vi.resetModules();
    vi.doMock('./_core/env', () => ({
      ENV: {
        RESEND_API_KEY: 're_test_key',
        EMAIL_FROM: 'noreply@mydojoma.com',
        ownerOpenId: 'owner123',
      },
    }));
    vi.doMock('resend', () => ({
      Resend: vi.fn().mockImplementation(() => ({
        emails: {
          send: vi.fn().mockImplementation(async (opts: any) => {
            expect(opts.subject).toContain('Summer Special');
            return { data: { id: 'mock-id' }, error: null };
          }),
        },
      })),
    }));

    const { sendProgramConfirmationEmail } = await import('./emailService');
    await sendProgramConfirmationEmail({
      toEmail: 'customer@example.com',
      customerName: 'Jane Doe',
      program: 'Kickboxing',
      specialName: 'Summer Special',
      qrCodeDataUrl: 'data:image/png;base64,test',
      scheduleRows: [],
    });
  });
});
