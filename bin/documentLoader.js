const {
  contexts,
  documentLoaderFactory,
} = require('@transmute/jsonld-document-loader');

const resolver = require('./resolver');

const documentLoader = documentLoaderFactory.pluginFactory
  .build({
    contexts: {
      ...contexts.W3C_Decentralized_Identifiers,
      ...contexts.W3C_Verifiable_Credentials,
      ...contexts.W3ID_Security_Vocabulary,
    },
  })
  .addContext({
    'https://w3id.org/pgp/v1': require('../src/__fixtures__/contexts/pgp-v1.json'),
  })
  .addResolver({
    ['did:']: {
      resolve: did => {
        return resolver.resolve(did);
      },
    },
  })
  .buildDocumentLoader();

module.exports = { documentLoader };
