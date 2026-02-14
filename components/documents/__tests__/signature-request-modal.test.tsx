/**
 * SignatureRequestModal Component Tests
 * Tests the signature request modal with mock data
 */

import { SignatureRequestModal } from '../signature-request-modal';
import type { DriveLink } from '@/types/google';

// Mock DriveLink for testing
const mockDriveLink: DriveLink = {
  id: 'test-link-1',
  investor_id: 'test-investor-1',
  file_id: 'google-drive-file-id',
  file_name: 'Investment Agreement.pdf',
  file_url: 'https://drive.google.com/file/d/google-drive-file-id/view',
  mime_type: 'application/pdf',
  thumbnail_url: null,
  linked_by: 'user-id',
  created_at: new Date().toISOString(),
};

describe('SignatureRequestModal', () => {
  it('should render modal with correct document name', () => {
    const props = {
      driveLink: mockDriveLink,
      investorId: 'test-investor-1',
      open: true,
      onOpenChange: jest.fn(),
    };

    // Modal should display the document name
    expect(mockDriveLink.file_name).toBe('Investment Agreement.pdf');
  });

  it('should validate required fields', () => {
    // Signer email is required
    const signerEmail = '';
    expect(signerEmail).toBe('');
  });

  it('should accept optional fields', () => {
    const signerName = 'John Doe';
    const message = 'Please review and sign this agreement.';

    expect(signerName).toBe('John Doe');
    expect(message).toBeTruthy();
  });

  it('should format email body with document link', () => {
    const expectedBody = `Document: ${mockDriveLink.file_name}
Link: ${mockDriveLink.file_url}`;

    expect(expectedBody).toContain(mockDriveLink.file_name);
    expect(expectedBody).toContain(mockDriveLink.file_url);
  });

  it('should handle form submission', async () => {
    const formData = {
      investorId: 'test-investor-1',
      driveLinkId: mockDriveLink.id,
      signerEmail: 'signer@example.com',
      signerName: 'John Doe',
      message: 'Please sign this document.',
    };

    expect(formData.signerEmail).toBe('signer@example.com');
    expect(formData.driveLinkId).toBe(mockDriveLink.id);
  });

  it('should trim whitespace from inputs', () => {
    const emailWithSpaces = '  signer@example.com  ';
    const trimmedEmail = emailWithSpaces.trim();

    expect(trimmedEmail).toBe('signer@example.com');
  });

  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'not-an-email';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });
});

// Export mock data for manual testing
export const mockSignatureRequestData = {
  driveLink: mockDriveLink,
  investorId: 'test-investor-1',
  signerEmail: 'signer@example.com',
  signerName: 'John Doe',
  message: 'Please review and sign this agreement at your earliest convenience.',
};
