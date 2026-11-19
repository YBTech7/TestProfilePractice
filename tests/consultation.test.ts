import postgres from 'postgres';
import { describe, expect, it } from 'vitest';
import {
  formatConsultationEmailBody,
  messageFor,
  openInbox,
} from '../consultation.ts';
import type { InquiryRecord } from '../src/types.ts';

describe('Consultation Email & PostgreSQL Persistence', () => {
  it('formats consultation email notification with E.164 phone or Not provided and preserves headers', () => {
    const withPhone: InquiryRecord = {
      id: 'INQ-2026-PHONE01',
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '+639171234567',
      company: 'Manila Ops',
      tier: 'smb',
      serviceDomain: 'technical-support',
      timeline: 'Within 30 days',
      message: 'Need technical support escalation architecture.',
      status: 'New',
      createdAt: '2026-11-18T08:00:00.000Z',
    };

    const bodyWithPhone = formatConsultationEmailBody(withPhone);
    expect(bodyWithPhone).toContain('Tracking ID: INQ-2026-PHONE01');
    expect(bodyWithPhone).toContain('Email address: maria@example.com');
    expect(bodyWithPhone).toContain('Contact number: +639171234567');

    const rawEncoded = messageFor(withPhone, 'pio.executive@gmail.com', 'pio.executive@gmail.com');
    const rawDecoded = Buffer.from(rawEncoded, 'base64url').toString('utf-8');
    expect(rawDecoded).toContain('Reply-To: maria@example.com');
    expect(rawDecoded).toContain('Subject: New consultation request - INQ-2026-PHONE01');

    const withoutPhone: InquiryRecord = {
      id: 'INQ-2026-LEGACY1',
      name: 'Alex Legacy',
      email: 'alex@example.com',
      company: '',
      tier: 'startup',
      serviceDomain: 'data-analytics',
      timeline: 'This quarter',
      message: 'Weekly analytics model setup.',
      status: 'New',
      createdAt: '2026-11-18T08:05:00.000Z',
    };

    const bodyWithoutPhone = formatConsultationEmailBody(withoutPhone);
    expect(bodyWithoutPhone).toContain('Contact number: Not provided');
    expect(bodyWithoutPhone).toContain('Organization / Practice: Not provided');
  });

  it.skipIf(!process.env.TEST_CONSULTATION_DATABASE_URL)(
    'stores structured inquiries with normalized phone, protects duplicate submission keys, and recovers older string-encoded inquiries',
    async () => {
      const url = process.env.TEST_CONSULTATION_DATABASE_URL!;
      const inbox = openInbox(url);
      const oldServer = postgres(url);
      const inquiry: InquiryRecord = {
        id: 'INQ-TEST',
        name: 'Test Visitor',
        email: 'test@example.com',
        phone: '+639171234567',
        company: 'Test Organization',
        tier: 'startup',
        serviceDomain: 'technical-support',
        timeline: 'Within 30 days',
        message: 'A test consultation request.',
        status: 'New',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const key = 'ae901555-d79b-4ece-96dc-063bd9a0f6b1';
      const recovered = openInbox(url);
      try {
        expect(await inbox.save(inquiry, key)).toEqual(inquiry);
        expect(
          await inbox.save({ ...inquiry, phone: '+14155550199' }, key)
        ).toBeNull();
        expect(
          await inbox.save({ ...inquiry, message: 'A different consultation request.' }, key)
        ).toBeNull();
        expect(await inbox.update(inquiry.id, { status: 'In Review' })).toMatchObject({
          status: 'In Review',
        });
        expect(await inbox.save(inquiry, key)).toMatchObject({
          id: inquiry.id,
          status: 'In Review',
          phone: '+639171234567',
        });
        await oldServer`UPDATE consultation_inbox
          SET inquiry = ${oldServer.json(JSON.stringify(inquiry))}, email_state = 'review'
          WHERE id = ${inquiry.id}`;
        expect(await recovered.claim()).toMatchObject({ inquiry, attempts: 1 });
        expect(await recovered.save({ ...inquiry, id: 'INQ-RETRY' }, key)).toEqual(inquiry);
      } finally {
        await oldServer`DELETE FROM consultation_inbox WHERE id = ${inquiry.id}`;
        await Promise.all([oldServer.end(), inbox.close(), recovered.close()]);
      }
    }
  );
});
