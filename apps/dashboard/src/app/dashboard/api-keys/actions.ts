'use server';

import { requireSession } from '@/lib/auth';
import { gateway } from '@/lib/gateway';

export async function rotateApiKey() {
  await requireSession();
  return gateway.rotateApiKeys('default');
}
