import * as openpgp from 'openpgp';

export class PgpKeyPair2021 {
  public id: string;
  public type: string = 'PgpVerificationKey2021';
  public controller: string;
  public privateKey: any; // https://github.com/openpgpjs/openpgpjs/blob/master/src/key/key.js
  public publicKey: any; // https://github.com/openpgpjs/openpgpjs/blob/master/src/key/key.js
  public passphrase?: string;

  static async generate(
    { userIds, curve, rsaBits, passphrase }: any,
    options = {}
  ) {
    if (curve) {
      const {
        privateKeyArmored,
        publicKeyArmored,
        revocationCertificate,
      } = await openpgp.generateKey({
        userIds, // you can pass multiple user IDs
        curve, // ECC curve name
        passphrase, // protects the private key
      });

      return PgpKeyPair2021.from({
        privateKeyPgp: privateKeyArmored,
        publicKeyPgp: publicKeyArmored,
        revocationCertificate,
        ...options,
      });
    } else if (rsaBits) {
      const {
        privateKeyArmored,
        publicKeyArmored,
        revocationCertificate,
      } = await openpgp.generateKey({
        userIds, // you can pass multiple user IDs
        rsaBits, // RSA key size
        passphrase, // protects the private key
      });

      return PgpKeyPair2021.from({
        privateKeyPgp: privateKeyArmored,
        publicKeyPgp: publicKeyArmored,
        revocationCertificate,
        ...options,
      });
    }
    throw new Error('curve or rsaBits required');
  }

  public static async from(options: any) {
    const {
      keys: [publicKey],
    } = await openpgp.key.readArmored(options.publicKeyPgp);
    const {
      keys: [privateKey],
    } = await openpgp.key.readArmored(options.privateKeyPgp);
    if (options.passphrase) {
      await privateKey.decrypt(options.passphrase);
    }
    return new PgpKeyPair2021({
      id: options.id,
      controller: options.controller,
      privateKey,
      publicKey,
    });
  }

  constructor(options: any = {}) {
    this.id = options.id;
    this.controller = options.controller;
    this.privateKey = options.privateKey;
    this.publicKey = options.publicKey;
    this.passphrase = options.passphrase;
  }

  public async fingerprint() {
    return this.publicKey.getFingerprint().toUpperCase();
  }

  public toKeyPair(exportPrivateKey = false) {
    let keypair: any = {
      id: this.id,
      type: this.type,
      controller: this.controller,
      publicKeyPgp: this.publicKey.armor(),
    };
    if (exportPrivateKey) {
      keypair.privateKeyPgp = this.privateKey.armor();
    }
    return keypair;
  }

  public signer() {
    let privateKey = this.privateKey;

    return {
      async sign({ data }: any) {
        if (!privateKey) {
          throw new Error('No private key to sign with.');
        }
        const { signature: detachedSignature } = await openpgp.sign({
          message: openpgp.message.fromBinary(Buffer.from(data)),
          privateKeys: [privateKey],
          detached: true,
        });
        return detachedSignature;
      },
    };
  }

  public verifier() {
    let publicKey = this.publicKey;

    return {
      async verify({ data, signature }: any) {
        if (!publicKey) {
          throw new Error('No public key to verify with.');
        }
        const { signatures } = await openpgp.verify({
          message: openpgp.message.fromBinary(Buffer.from(data)),
          signature: await openpgp.signature.readArmored(signature), // parse detached signature
          publicKeys: [publicKey], // for verification
        });
        const { valid } = signatures[0];
        return valid;
      },
    };
  }
}
