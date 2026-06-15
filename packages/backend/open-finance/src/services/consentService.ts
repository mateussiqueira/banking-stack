import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Consent, ConsentStatus, ConsentPermission } from '../open-finance/types';
import { config } from '../config';

const consents: Map<string, Consent> = new Map();

export function createConsent(
  userId: string,
  clientId: string,
  permissions: ConsentPermission[],
  expirationDays?: number
): Consent {
  const id = uuidv4();
  const days = expirationDays || config.consentDurationDays;

  const consent: Consent = {
    id,
    status: 'AWAITING_AUTHORISATION',
    userId,
    clientId,
    permissions,
    expirationDateTime: dayjs().add(days, 'day').toISOString(),
    creationDateTime: dayjs().toISOString(),
    statusUpdateDateTime: dayjs().toISOString(),
  };

  consents.set(id, consent);
  return consent;
}

export function authoriseConsent(id: string): Consent | null {
  const consent = consents.get(id);
  if (!consent || consent.status !== 'AWAITING_AUTHORISATION') return null;

  consent.status = 'AUTHORISED';
  consent.statusUpdateDateTime = dayjs().toISOString();
  consents.set(id, consent);
  return consent;
}

export function getConsent(id: string): Consent | undefined {
  return consents.get(id);
}

export function deleteConsent(id: string): boolean {
  return consents.delete(id);
}

export function revokeConsent(id: string): Consent | null {
  const consent = consents.get(id);
  if (!consent) return null;

  consent.status = 'REVOKED';
  consent.statusUpdateDateTime = dayjs().toISOString();
  consents.set(id, consent);
  return consent;
}

export function validateConsentActive(id: string): boolean {
  const consent = consents.get(id);
  if (!consent) return false;
  if (consent.status !== 'AUTHORISED') return false;

  const expired = dayjs().isAfter(dayjs(consent.expirationDateTime));
  if (expired) {
    consent.status = 'REVOKED';
    consent.statusUpdateDateTime = dayjs().toISOString();
    consents.set(id, consent);
    return false;
  }

  return true;
}

export function hasPermission(consentId: string, permission: ConsentPermission): boolean {
  const consent = consents.get(consentId);
  if (!consent) return false;
  return consent.permissions.includes(permission);
}

export function listConsentsByUser(userId: string): Consent[] {
  return Array.from(consents.values()).filter((c) => c.userId === userId);
}

export function getConsents(): Map<string, Consent> {
  return consents;
}
