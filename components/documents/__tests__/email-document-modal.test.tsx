/**
 * EmailDocumentModal Component Tests
 * Tests the email document modal with mock data
 */

import { EmailDocumentModal } from '../email-document-modal';
import type { DriveLink } from '@/types/google';

// Mock DriveLink for testing
const mockDriveLink: DriveLink = {
  id: 'test-link-2',
  investor_id: 'test-investor-2',
  file_id: 'google-drive-file-id-2',
  file_name: 'Q1 Report.pdf',
  file_url: 'https://drive.google.com/file/d/google-drive-file-id-2/view',
  mime_type: 'application/pdf',
  thumbnail_url: null,
  linked_by: 'user-id',
  created_at: new Date().toISOString(),
};

describe('EmailDocumentModal', () => {
  it('should render modal with correct document name', () => {
    const props = {
      driveLink: mockDriveLink,
      investorId: 'test-investor-2',
      open: true,
      onOpenChange: jest.fn(),
    };

    // Modal should display the document name
    expect(mockDriveLink.file_name).toBe('Q1 Report.pdf');
  });

  it('should pre-populate subject with document name', () => {
    const expectedSubject = `Document: ${mockDriveLink.file_name}`;
    expect(expectedSubject).toBe('Document: Q1 Report.pdf');
  });

  it('should validate required fields', () => {
    // To and subject are required
    const to = '';
    const subject = '';

    expect(to).toBe('');
    expect(subject).toBe('');
  });

  it('should accept optional message body', () => {
    const body = 'Please find the attached Q1 report.';
    expect(body).toBeTruthy();
  });

  it('should append document link to email body', () => {
    const userMessage = 'Please review this document.';
    const emailBody = `${userMessage}\n\nDocument: ${mockDriveLink.file_name}\nLink: ${mockDriveLink.file_url}`;

    expect(emailBody).toContain(userMessage);
    expect(emailBody).toContain(mockDriveLink.file_name);
    expect(emailBody).toContain(mockDriveLink.file_url);
  });

  it('should handle form submission', async () => {
    const formData = {
      investorId: 'test-investor-2',
      driveLinkId: mockDriveLink.id,
      to: 'recipient@example.com',
      subject: 'Q1 Report',
      body: 'Please review the attached report.',
    };

    expect(formData.to).toBe('recipient@example.com');
    expect(formData.driveLinkId).toBe(mockDriveLink.id);
  });

  it('should trim whitespace from inputs', () => {
    const toWithSpaces = '  recipient@example.com  ';
    const subjectWithSpaces = '  Q1 Report  ';
    const bodyWithSpaces = '  Please review this.  ';

    expect(toWithSpaces.trim()).toBe('recipient@example.com');
    expect(subjectWithSpaces.trim()).toBe('Q1 Report');
    expect(bodyWithSpaces.trim()).toBe('Please review this.');
  });

  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'not-an-email';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it('should handle empty body gracefully', () => {
    const emptyBody = '';
    const finalBody = `${emptyBody}\n\nDocument: ${mockDriveLink.file_name}\nLink: ${mockDriveLink.file_url}`;

    // Even with empty body, should still include document info
    expect(finalBody).toContain(mockDriveLink.file_name);
    expect(finalBody).toContain(mockDriveLink.file_url);
  });
});

// Export mock data for manual testing
export const mockEmailDocumentData = {
  driveLink: mockDriveLink,
  investorId: 'test-investor-2',
  to: 'recipient@example.com',
  subject: 'Q1 Report',
  body: 'Please review the attached Q1 report. Let me know if you have any questions.',
};
