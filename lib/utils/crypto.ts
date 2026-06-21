/**
 * Web Crypto API helpers for secure, browser-native digital signatures (ECDSA P-256).
 */

// Helper to convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generates an ECDSA keypair, saves it to localStorage, and returns public key JWK
export async function getOrCreateKeypair(): Promise<{ publicKeyJwk: JsonWebKey; hasPrivateKey: boolean }> {
  if (typeof window === 'undefined') {
    throw new Error('Web Crypto can only be run in the browser.');
  }

  const storedPub = localStorage.getItem('orochat_pub_key');
  const storedPriv = localStorage.getItem('orochat_priv_key');

  if (storedPub && storedPriv) {
    return {
      publicKeyJwk: JSON.parse(storedPub),
      hasPrivateKey: true
    };
  }

  // Generate new ECDSA P-256 keypair
  const keypair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['sign', 'verify']
  );

  // Export keys to JWK format
  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keypair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keypair.privateKey);

  // Save to localStorage
  localStorage.setItem('orochat_pub_key', JSON.stringify(publicKeyJwk));
  localStorage.setItem('orochat_priv_key', JSON.stringify(privateKeyJwk));

  return {
    publicKeyJwk,
    hasPrivateKey: true
  };
}

// Signs a text string using the stored private key
export async function signText(text: string): Promise<{ signatureBase64: string; publicKeyJwk: JsonWebKey }> {
  if (typeof window === 'undefined') {
    throw new Error('Web Crypto can only be run in the browser.');
  }

  const storedPriv = localStorage.getItem('orochat_priv_key');
  const storedPub = localStorage.getItem('orochat_pub_key');
  if (!storedPriv || !storedPub) {
    throw new Error('Keypair not found. Please generate keypair first.');
  }

  const privateKeyJwk = JSON.parse(storedPriv);
  const publicKeyJwk = JSON.parse(storedPub);

  // Import private key back into crypto engine
  const privateKey = await window.crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false, // not extractable
    ['sign']
  );

  // Encode text and sign
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const signature = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    data
  );

  return {
    signatureBase64: arrayBufferToBase64(signature),
    publicKeyJwk
  };
}

// Verifies a signature using a public key JWK
export async function verifyTextSignature(
  text: string,
  signatureBase64: string,
  publicKeyJwk: JsonWebKey
): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Import public key back into crypto engine
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['verify']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const signature = base64ToArrayBuffer(signatureBase64);

    return await window.crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      signature,
      data
    );
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}
