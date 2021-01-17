import * as openpgp from 'openpgp';
import k0 from '../__fixtures__/keypair.json';

it('import key', async () => {
  const {
    keys: [privateKey],
  } = await openpgp.key.readArmored(k0.privateKeyPgp);
  expect(privateKey).toBeDefined();
});
