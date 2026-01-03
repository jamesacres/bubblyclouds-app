// Inspired by https://docs.cotter.app/sdk-reference/api-for-other-mobile-apps/api-for-mobile-apps#step-1-create-a-code-verifier
function dec2hex(dec: number) {
  return ('0' + dec.toString(16)).substring(-2);
}

function generateRandomString() {
  var array = new Uint32Array(12);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a: ArrayBuffer): string {
  var str = '';
  var bytes = new Uint8Array(a);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const pkce = async () => {
  const codeVerifier = generateRandomString();

  const codeChallenge = base64urlencode(await sha256(codeVerifier));

  return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
};
