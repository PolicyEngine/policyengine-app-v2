import { X509Certificate } from 'node:crypto';
import tls from 'node:tls';

// Server-only: calculator-app/src/instrumentation.ts runs this in the
// Node.js runtime of the calculator's Vercel Functions.
//
// Vercel Functions still run Node.js 24.21.0 and 22.23.2, which trust the
// compromised eMudhra root "emSign ECC Root CA - G3" (and Sectigo's
// "AAA Certificate Services", which cross-signed the affected intermediates).
// Remove both from Node's default CA list before any outbound request.
// Delete this once Vercel Functions run Node.js 24.22.1 / 22.23.4 or later.
const COMPROMISED_ROOT_COMMON_NAMES = ['emSign ECC Root CA - G3', 'AAA Certificate Services'];

export function removeCompromisedEmudhraRoots(): void {
  if (
    typeof tls.getCACertificates !== 'function' ||
    typeof tls.setDefaultCACertificates !== 'function'
  ) {
    return;
  }
  const trustedCertificates = tls.getCACertificates('default').filter((certificatePem) => {
    const subjectFields = new X509Certificate(certificatePem).subject.split('\n');
    return !COMPROMISED_ROOT_COMMON_NAMES.some((commonName) =>
      subjectFields.includes(`CN=${commonName}`)
    );
  });
  tls.setDefaultCACertificates(trustedCertificates);
}
