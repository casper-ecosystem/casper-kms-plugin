## Installation

Create an `.env` file at /src/.env containing aws credentials

```
AWS_REGION=
KMS_CREATE_ID=
KMS_CREATE_KEY=
KMS_SIGN_ID=
KMS_SIGN_KEY=
```

## Build and Run Docker

### Profiles

Profiles:

- **dev**: Connects to the AWS KMS for development purposes.
- **test**: Mocks the AWS KMS for testing/CI-CD purposes.
- **production**: (No profile specified) Connects to the AWS KMS for production purposes.

```shell
make build test
```

```shell
make start test
```

## Run all after build

```shell
make build-start
```

or to see logs

```shell
make build-start-log
```

## Close servers

to shutdown the middleware

```shell
make stop test
```

> > See Makefile for other commands

## Api

API Endpoint:

http://localhost:4000/

Method: GET
Description: Get Hello Message

Headers:

- Content-Type: application/json

_Response:_

Status Codes:

- 200 OK: The request was successful.

_Body (Successful Response):_

```
"KMS DEV_MODE or KMS MOCK_TESTING_MODE or KMS for production mode"
```

## generateKeypair

Request to generate a secp256k1 key:

http://localhost:4000/generateKeypair

Method: POST
Body: Empty

_Response:_

Status Codes:

- 201 OK: The request was successful.
- 400 Bad Request: The request was invalid.
- 500 Internal Server Error: An error occurred on the server.

_Body (Successful Response):_

```
02026120214ae59d581550fdf2b38dbe58bd18125f05b16c32687169aae47576f1db
```

## signDeploy

Request to sign a deploy:

API Endpoint:
http://localhost:4000/signDeploy

Method: POST
Body:

```json
{
"deploy": {
    "hash": "8a3660d3db52821ec0019ba2a76cb43535bdebe1d99e3f307ecd81c3e8fe1366",
    "header": {
      "account": "01b13b07ff048402868c95632091db57b0d5225f2cf50fc59f9a9a18b2da17792c",
      "timestamp": "2024-05-22T15:57:43.000Z",
      "ttl": "30m",
      "gas_price": 1,
      "body_hash": "e095a865c228d8e436a7789ee083634ad3344c1ca270ac6ea333de6611aafd78",
      "dependencies": [],
      "chain_name": "casper"
      ...
      "approvals": []
    }
  }
}
```

Query Parameters:

- public_key: The public key associated with the deploy. (Example: '023e5ad7edb6b72e6eac100e25a1c42b8d608744f3b6b38269cd80aac00464773b')

_Response:_

Status Codes:

- 201 Created: The request was successful.
- 400 Bad Request: The request was invalid.
- 500 Internal Server Error: An error occurred on the server.

_Body (Successful Response):_

```
{"hash":"8a3660d3db52821ec0019ba2a76cb43535bdebe1d99e3f307ecd81c3e8fe1366","header":{"account":"01b13b07ff048402868c95632091db57b0d5225f2cf50fc59f9a9a18b2da17792c","timestamp":"2024-05-22T15:57:43.000Z","ttl":"30m","gas_price":1,"body_hash":"e095a865c228d8e436a7789ee083634ad3344c1ca270ac6ea333de6611aafd78","dependencies":[],"chain_name":"casper"},"payment":{"ModuleBytes":{"module_bytes":"","args":[["amount",{"cl_type":"U512","bytes":"0400e1f505","parsed":"100000000"}]]}},"session":{"Transfer":{"args":[["amount",{"cl_type":"U512","bytes":"0400f90295","parsed":"2500000000"}],["target",{"cl_type":"PublicKey","bytes":"0187adb3e0f60a983ecc2ddb48d32b3deaa09388ad3bc41e14aeb19959ecc60b54","parsed":"0187adb3e0f60a983ecc2ddb48d32b3deaa09388ad3bc41e14aeb19959ecc60b54"}],["id",{"cl_type":{"Option":"U64"},"bytes":"0151b2fb978bc7b412","parsed":1347921590854857200}]]}},"approvals":[{"signer":"02022214bfdc43ad83447c435222e107296b6682972cdf309b838062e5e866dda631","signature":"021b9083630588c344d71d6b699d2a119ec37759ffd7698c02bf391357a413e5207fa8e1baa96b77def187342d4e4944c5d7eb66f9b03918bdc9ac6e5e24dcd47a"}]}
```

## signDeployHash

Request to sign a deploy hash (thus without providing the full deploy):

API Endpoint:

http://localhost:4000/signDeployHash

Method: GET

Query Parameters:

- public_key: The public key associated with the deploy hash. (Example: '023e5ad7edb6b72e6eac100e25a1c42b8d608744f3b6b38269cd80aac00464773b')
- deploy_hash: The deploy hash that needs to be signed. (Example: 'f54ba7e43614e6a366cab74c243c3898fb95901cc0751b384a16fd8222d857b9')

_Response:_

Status Codes:

- 200 OK: The request was successful.
- 400 Bad Request: The request was invalid.
- 500 Internal Server Error: An error occurred on the server.

_Body (Successful Response):_

```
021b9083630588c344d71d6b699d2a119ec37759ffd7698c02bf391357a413e5207fa8e1baa96b77def187342d4e4944c5d7eb66f9b03918bdc9ac6e5e24dcd47a
```

## addSignature (helper)

Request to add a signature to a deploy with SDK `addSignature` helper method:, adds an entry to `"approvals"` :

API Endpoint:
http://localhost:4000/addSignature

Method: POST
Body:

Query Parameters:
Body:

```json
{
"deploy": {
    "hash": "8a3660d3db52821ec0019ba2a76cb43535bdebe1d99e3f307ecd81c3e8fe1366",
    "header": {
      "account": "01b13b07ff048402868c95632091db57b0d5225f2cf50fc59f9a9a18b2da17792c",
      "timestamp": "2024-05-22T15:57:43.000Z",
      "ttl": "30m",
      "gas_price": 1,
      "body_hash": "e095a865c228d8e436a7789ee083634ad3344c1ca270ac6ea333de6611aafd78",
      "dependencies": [],
      "chain_name": "casper"
      ...
      "approvals": []
    }
  }
}
```

- public_key: The public key associated with the deploy. (Example: '023e5ad7edb6b72e6eac100e25a1c42b8d608744f3b6b38269cd80aac00464773b')
- signature: The signature associated with the deploy. (Example: '021b9083630588c344d71d6b699d2a119ec37759ffd7698c02bf391357a413e5207fa8e1baa96b77def187342d4e4944c5d7eb66f9b03918bdc9ac6e5e24dcd47a')

_Response:_

Status Codes:

- 201 Created: The request was successful.
- 400 Bad Request: The request was invalid.
- 500 Internal Server Error: An error occurred on the server.

_Body (Successful Response):_

```
{"hash":"8a3660d3db52821ec0019ba2a76cb43535bdebe1d99e3f307ecd81c3e8fe1366","header":{"account":"01b13b07ff048402868c95632091db57b0d5225f2cf50fc59f9a9a18b2da17792c","timestamp":"2024-05-22T15:57:43.000Z","ttl":"30m","gas_price":1,"body_hash":"e095a865c228d8e436a7789ee083634ad3344c1ca270ac6ea333de6611aafd78","dependencies":[],"chain_name":"casper"},"payment":{"ModuleBytes":{"module_bytes":"","args":[["amount",{"cl_type":"U512","bytes":"0400e1f505","parsed":"100000000"}]]}},"session":{"Transfer":{"args":[["amount",{"cl_type":"U512","bytes":"0400f90295","parsed":"2500000000"}],["target",{"cl_type":"PublicKey","bytes":"0187adb3e0f60a983ecc2ddb48d32b3deaa09388ad3bc41e14aeb19959ecc60b54","parsed":"0187adb3e0f60a983ecc2ddb48d32b3deaa09388ad3bc41e14aeb19959ecc60b54"}],["id",{"cl_type":{"Option":"U64"},"bytes":"0151b2fb978bc7b412","parsed":1347921590854857200}]]}},"approvals":[{"signer":"02022214bfdc43ad83447c435222e107296b6682972cdf309b838062e5e866dda631","signature":"021b9083630588c344d71d6b699d2a119ec37759ffd7698c02bf391357a413e5207fa8e1baa96b77def187342d4e4944c5d7eb66f9b03918bdc9ac6e5e24dcd47a"}]}
```

## Deployment

Create an `.env.production` file at /src/.env.production containing aws credentials to override .env

## Tests

### Unit tests

```shell
make test
```
