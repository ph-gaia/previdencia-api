# Previdência API

API em NestJS voltada para gestão de saldos e solicitações de resgate de planos de previdência privada.

## Objetivo do projeto

- Permitir que um chatbot consulte o saldo total do participante e o saldo disponível para resgate.
- Atender solicitações de resgate total ou parcial, respeitando saldo disponível, regras de carência e demais restrições do produto.

## Stack principal

- Node.js 20 + NestJS 11
- PostgreSQL 16
- TypeScript, ESLint (PSR-like), Prettier
- Docker e Docker Compose para orquestração local

## Pré-requisitos

- Node.js 20 e npm 10 (ou superior)
- Docker 24+ e Docker Compose v2 (opcional, para ambiente containerizado)

## Configuração inicial

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure variáveis de ambiente em `.env` (ou diretamente no ambiente) para o acesso ao banco. Exemplo:
   ```bash
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=previdencia
   DATABASE_PASSWORD=previdencia
   DATABASE_NAME=previdencia
   ```

## Executando a aplicação

- Desenvolvimento com reload:
  ```bash
  npm run start:dev
  ```
- Produção (build + execução):
  ```bash
  npm run build
  npm run start:prod
  ```

## Ambiente Docker

1. Construa as imagens:
   ```bash
  docker compose build
   ```
2. Suba os serviços (API + PostgreSQL):
   ```bash
   docker compose up -d
   ```
3. A API ficará disponível em `http://localhost:3000`. O banco utiliza as credenciais definidas em `docker-compose.yml` (`previdencia` / `previdencia`).

Para encerrar:
```bash
docker compose down
```

## Qualidade de código

- Formatação:
  ```bash
  npm run format
  ```
- Análise estática:
  ```bash
  npm run lint
  ```

## Testes

- Testes unitários:
  ```bash
  npm run test
  ```
- Testes e2e:
  ```bash
  npm run test:e2e
  ```
- Cobertura:
  ```bash
  npm run test:cov
  ```

## Próximos passos

- Modelagem das entidades de saldo e regras de carência.
- Implementação dos endpoints de consulta e solicitação de resgate com validações de negócio.
