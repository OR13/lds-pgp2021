export const documentLoader = (iri: string) => {
  if (iri === 'https://www.w3.org/2018/credentials/v1') {
    return {
      documentUrl: iri,
      document: require('./contexts/cred-v1.json'),
    };
  }
  if (iri === 'https://w3id.org/pgp/v1') {
    return {
      documentUrl: iri,
      document: require('./contexts/pgp-v1.json'),
    };
  }

  if (iri === 'https://w3id.org/security/v2') {
    return {
      documentUrl: iri,
      document: require('./contexts/sec-v2.json'),
    };
  }
  if (iri === 'https://w3id.org/security/v1') {
    return {
      documentUrl: iri,
      document: require('./contexts/sec-v1.json'),
    };
  }

  if (iri === 'https://www.w3.org/ns/did/v1') {
    return {
      documentUrl: iri,
      document: require('./contexts/did-v1.json'),
    };
  }

  if (iri.includes('did:example:123')) {
    return {
      documentUrl: iri,
      document: require('./example-did-document.json'),
    };
  }
  console.warn(iri);

  throw new Error('iri not supported ' + iri);
};
