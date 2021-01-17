import * as vcjs from '@transmute/vc.js';
import k0 from './__fixtures__/keypair.json';
import credentialTemplate from './__fixtures__/credential.json';
import vcExample from './__fixtures__/example-verifiable-credential.json';

import { PgpKeyPair2021 } from './PgpKeyPair2021';
import { PgpSignature2021 } from './PgpSignature2021';
import { documentLoader } from './__fixtures__/documentLoader';

it('can generate', async () => {
  const keypair = await PgpKeyPair2021.generate(
    {
      // you can pass multiple user IDs
      userIds: [{ name: 'Jon Smith', email: 'jon@example.com' }],
      curve: 'ed25519', // ECC curve name
      // protects the private key
      // passphrase: 'super long and hard to guess secret'
    },
    {
      id: 'test-id',
      type: 'PgpVerificationKey2021',
      controller: 'did:example:123',
    }
  );
  expect(keypair.type).toBe('PgpVerificationKey2021');
});

it('can issue', async () => {
  const keypair = await PgpKeyPair2021.from(k0);
  const suite = new PgpSignature2021({
    key: keypair,
    date: '2019-12-11T03:50:55Z',
  });
  const verifiableCredential = await vcjs.ld.issue({
    credential: {
      ...credentialTemplate,
      issuer: {
        ...credentialTemplate.issuer,
        id: k0.controller,
      },
    },
    suite,
    documentLoader: async (uri: string) => {
      const res = await documentLoader(uri);
      // uncomment to debug
      // console.log(res)
      return res;
    },
  });
  // console.log(JSON.stringify(verifiableCredential, null, 2));
  expect(verifiableCredential.proof.type).toEqual('PgpSignature2021');
});

it('can verify', async () => {
  const verification = await vcjs.ld.verifyCredential({
    credential: { ...vcExample },
    suite: new PgpSignature2021(),
    documentLoader: async (uri: string) => {
      const res = await documentLoader(uri);
      // uncomment to debug
      // console.log(res)
      return res;
    },
  });
  // uncomment to debug
  // console.log(JSON.stringify(verification, null, 2));
  expect(verification.verified).toBe(true);
});
