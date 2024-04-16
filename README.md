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

## Running kms container

```shell
docker build -t casper-kms-plugin . --force-rm
docker container run -t -i --rm -h casper-kms-plugin -p 8080:8080 casper-kms-plugin
```

## Deployment

Create an `.env.production` file at /src/.env.production containing aws credentials

## Tests

### Unit tests

```shell
cd src && npm install && npm run test
```
