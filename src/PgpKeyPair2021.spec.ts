import { PgpKeyPair2021 } from './PgpKeyPair2021';
import k0 from './__fixtures__/keypair.json';

it('generate', async () => {
  let key = await PgpKeyPair2021.generate(
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

  expect(key.id).toBe('test-id');
  expect(key.type).toBe('PgpVerificationKey2021');
  expect(key.controller).toBe('did:example:123');
  expect(key.privateKey).toBeDefined();
  expect(key.publicKey).toBeDefined();
});

it('toKeyPair', async () => {
  let key = await PgpKeyPair2021.generate(
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
  let k = key.toKeyPair(false);
  expect(k.publicKeyPgp).toBeDefined();
  expect(k.privateKeyPgp).toBeUndefined();
  k = key.toKeyPair(true);
  expect(k.publicKeyPgp).toBeDefined();
  expect(k.privateKeyPgp).toBeDefined();
});

it('from', async () => {
  const k = await PgpKeyPair2021.from(k0);
  expect(k.publicKey).toBeDefined();
  expect(k.privateKey).toBeDefined();
});

it('fingerprint', async () => {
  const k = await PgpKeyPair2021.from(k0);
  const fingerprint = await k.fingerprint();
  expect(fingerprint).toBe('8F7E419BD5D875C6AE38AAAD373C8ED0E60A3C3B');
});

it('signer', async () => {
  const k = await PgpKeyPair2021.from(k0);
  const signer = await k.signer();
  const message = Buffer.from('hello world');
  const signature = await signer.sign({ data: message });
  expect(signature).toBeDefined();
});

it('verifier', async () => {
  const k = await PgpKeyPair2021.from(k0);
  const signer = await k.signer();
  const verifier = await k.verifier();
  const message = Buffer.from('hello world');
  const signature = await signer.sign({ data: message });
  expect(signature).toBeDefined();
  const verified = await verifier.verify({ data: message, signature });
  expect(verified).toBe(true);
});

it('tampering causes failure', async () => {
  const k = await PgpKeyPair2021.from(k0);
  const signer = await k.signer();
  const verifier = await k.verifier();
  let message = Buffer.from('hello world');
  const signature = await signer.sign({ data: message });
  expect(signature).toBeDefined();
  message = Buffer.from('hello world 1');
  const verified = await verifier.verify({ data: message, signature });
  expect(verified).toBe(false);
});
