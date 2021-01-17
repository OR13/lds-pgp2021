#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const vorpal = require('vorpal')();
const { documentLoader } = require('./documentLoader');
const { PgpKeyPair2021, PgpSignature2021 } = require('../dist');
const { sign } = require('@transmute/linked-data-proof');
const jsigs = require('jsonld-signatures');
const { AssertionProofPurpose } = jsigs.purposes;

const { version } = require('../package.json');

// const { documentLoader } = require('../src/__tests__/__fixtures__');

// const { GpgSignature2020, GpgLinkedDataKeyClass2020 } = require('../src');

vorpal.wait = seconds =>
  new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });

vorpal.command('version', 'display version').action(async () => {
  // eslint-disable-next-line
  console.log(
    JSON.stringify(
      {
        '@transmute/lds-gpg2020': version,
      },
      null,
      2
    )
  );
  return vorpal.wait(1);
});

vorpal.command('resolve <did>', 'resolve a did').action(async args => {
  let { document } = await documentLoader(args.did);
  // eslint-disable-next-line
  console.log(JSON.stringify(document, null, 2));
  return vorpal.wait(1);
});

vorpal
  .command(
    'make-json-key <inputFilePath> <controller>',
    'convert a public gpg key to json'
  )
  .action(async args => {
    const publicKeyString = fs
      .readFileSync(args.inputFilePath)
      .toString('utf-8');

    const options = {
      id: '',
      controller: args.controller,
      publicKeyPgp: publicKeyString,
    };

    const key = await PgpKeyPair2021.from(options);
    key.id = key.controller + '#' + (await key.fingerprint());

    // eslint-disable-next-line
    console.log(JSON.stringify(key.toKeyPair(false), null, 2));
    return vorpal.wait(1);
  });

vorpal
  .command(
    'import-gpg-keys-from-json <inputFilePath>',
    'imports gpg keys from a json object'
  )
  .action(async args => {
    const fileJson = fs.readFileSync(args.inputFilePath).toString('utf-8');
    let parsedInputFile;
    try {
      parsedInputFile = JSON.parse(fileJson);
    } catch (e) {
      throw new Error('Could not parse inputFilePath as JSON.');
    }

    const command = `
  echo "${parsedInputFile.publicKeyGpg}" | gpg --import;
  echo "${parsedInputFile.privateKeyGpg}" | gpg --import;
`;

    const result = shell.exec(command, { silent: true });

    return vorpal.wait(1);
  });

vorpal
  .command('sign <inputFilePath> <verificationMethod>', 'Sign file')

  .option(
    '-u, --local-user <key>',
    'Use name as the key to sign with. Note that this option overrides --default-key.'
  )
  .option('-o, --output <outputFilePath>', 'Write output to file')
  .option('-p, --purpose <proofPurpose>', 'Purpose of signature')
  .option('-c, --created <created>', 'Created date as iso string')

  .action(async args => {
    // set defaults properly
    args.options.created = args.options.created || new Date().toISOString();
    args.options.purpose = args.options.purpose || 'assertionMethod';

    const fileJson = fs.readFileSync(args.inputFilePath).toString('utf-8');
    let parsedInputFile;
    try {
      parsedInputFile = JSON.parse(fileJson);
    } catch (e) {
      throw new Error('Could not parse inputFilePath as JSON.');
    }

    let suite = new PgpSignature2021();

    const vm = await suite.getVerificationMethod({
      proof: { verificationMethod: args.verificationMethod },
      documentLoader,
    });

    const key = await PgpKeyPair2021.from({
      id: vm.id,
      controller: vm.controller.id,
      publicKeyPgp: vm['sec:publicKeyPgp'],
    });

    key.signer = () => {
      return {
        sign: ({ data }) => {
          fs.writeFileSync(path.resolve(process.cwd(), 'data.dat'), data);

          const keyName = args.options['local-user']
            ? `-u ${args.options['local-user']}`
            : `--default-key`;

          const signDetachedCommand = `
             gpg --detach-sign --armor ${keyName} ${path.resolve(
            process.cwd(),
            'data.dat'
          )}
          `;

          shell.exec(signDetachedCommand, { silent: true });
          const signatureValue = fs.readFileSync('data.dat.asc').toString();

          fs.unlinkSync(path.resolve(process.cwd(), 'data.dat'));
          fs.unlinkSync('data.dat.asc');
          return signatureValue;
        },
      };
    };

    suite = new PgpSignature2021({
      key,
    });

    const signed = await sign(parsedInputFile, {
      compactProof: true,
      documentLoader: documentLoader,
      purpose: new AssertionProofPurpose(),
      suite,
    });

    const signedDocument = JSON.stringify(signed, null, 2);
    console.log(signedDocument);
    if (args.options.output) {
      fs.writeFileSync(args.options.output, signedDocument);
    }
    return vorpal.wait(1);
  });

vorpal
  .command('verify <inputFilePath>', 'Verify file')

  .action(async args => {
    const fileJson = fs.readFileSync(args.inputFilePath).toString('utf-8');
    let parsedInputFile;
    try {
      parsedInputFile = JSON.parse(fileJson);
    } catch (e) {
      throw new Error('Could not parse inputFilePath as JSON.');
    }

    const result = await jsigs.verify(parsedInputFile, {
      compactProof: true,
      documentLoader: documentLoader,
      purpose: new AssertionProofPurpose(),
      suite: new PgpSignature2021(),
    });
    // console.log(result)
    console.log(JSON.stringify({ verified: result.verified }, null, 2));
    return vorpal.wait(1);
  });

vorpal.parse(process.argv);
if (process.argv.length === 0) {
  vorpal.delimiter('🔏 ').show();
}
