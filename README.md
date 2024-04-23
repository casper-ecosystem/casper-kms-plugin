## Deployment

Create an `.env` file at /src/.env containing aws credentials

```
AWS_REGION=
KMS_CREATE_ID=
KMS_CREATE_KEY=
KMS_SIGN_ID=
KMS_SIGN_KEY=
DEBUG=false
```

## Build and Run all

```shell
docker compose up --build -d
```

or to see logs

```shell
docker compose up --build
```

## Run all after build

```shell
docker compose up -d
```

## Close servers

to shutdown the middleware

```shell
docker compose down
```

## Api

Request to generate a secp256k1 key:

API Endpoint:
http://172.17.0.1:8080/generateKeypair

Method: POST
Headers: None
Body: Empty

_Response:_

Status Codes:

- 200 OK: The request was successful.
- 400 Bad Request: The request was invalid.
- 500 Internal Server Error: An error occurred on the server.

_Body (Successful Response):_

```json
02026120214ae59d581550fdf2b38dbe58bd18125f05b16c32687169aae47576f1db
```

Request to sign a deploy hash:

API Endpoint:
http://172.17.0.1:8080/sign

Method: POST
Headers: None
Body:

```json
{
  "public_key": "02026120214ae59d581550fdf2b38dbe58bd18125f05b16c32687169aae47576f1db",
  "deploy_hash": "3f7a74ea0a45f38075b9538e5c21ff4cbb3c17fbe47c06247b425ca9a3e50375"
}
```

_Response:_

Status Codes:

- 200 OK: The request was successful.
- 400 Bad Request: The request was invalid.
- 500 Internal Server Error: An error occurred on the server.

_Body (Successful Response):_

```json
02f6376395008e3c83b3824c6fca1a7e89dc9ac0b94cd39d567115b30b3e2eb55d77a9fa6f999472eede573e2f5184398a9211890efc04a020fd55972bb44f2e5a
```

## Running kms container

```shell
docker build -t casper-kms-plugin . --force-rm
docker container run -t -i --rm -h casper-kms-plugin -p 8080:8080 casper-kms-plugin
```

## Deployment

Create an `.env.production` file at /src/.env.production containing aws credentials to override .env

## Tests

### Unit tests

```shell
cd src && npm install && npm run test
```
