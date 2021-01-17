# Linked Data Signature for PGP 2021

### Using the CLI

#### Resolve a DID

```
npm run pgp2021 resolve did:web:or13.github.io:deno-did-pm
```

#### Convert a public key

```
npm run pgp2021 make-json-key ./docs/public-key.gpg did:web:or13.github.io:deno-did-pm
```

#### Sign

```
npm run pgp2021 -- sign -u "4FD4017D6188FF9B4F07299E02FECCD6306F299C" ./docs/example.json  did:web:or13.github.io:deno-did-pm#4FD4017D6188FF9B4F07299E02FECCD6306F299C -o ./docs/example.signed.json
```

#### Verify

```
npm run pgp2021 -- verify ./docs/example.signed.json
```

#### Import a json key

```
npm run pgp2021 import-gpg-keys-from-json ./docs/public-key.json
```
