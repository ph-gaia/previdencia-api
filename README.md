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

## Arquitetura

- **Camada de domínio (`src/domain`)**: implementa regras de negócio puras, seguindo DDD e Clean Architecture. É independente de NestJS, banco ou qualquer framework. Todos os componentes podem ser testados isoladamente.
- **Camadas de aplicação e infraestrutura**: serão construídas em etapas posteriores (controllers, módulos NestJS, adapters de persistência etc.), consumindo apenas interfaces expostas pelo domínio.
- **Princípios**: entidades expõem comportamentos e invariantes, objetos de valor encapsulam conceitos imutáveis, serviços de domínio orquestram regras envolvendo múltiplas entidades, repositórios são definidos por contratos.

## Domínio

- **Objetos de valor**
  - `Money`: representa valores monetários com precisão de duas casas e operações seguras (`add`, `subtract`, comparações).
  - `CarencyDate`: encapsula a data de carência, garantindo validade e permitindo verificar se a contribuição já está disponível.
- **Entidades**
  - `Contribution`: guarda valor aportado, data e carência, calculando automaticamente o montante disponível considerando a carência.
  - `User`: mantém dados cadastrais e o conjunto de contribuições pertencentes ao participante.
  - `WithdrawalRequest`: modela pedidos de resgate total ou parcial, validando tipo e valor solicitado.
- **Serviços de domínio**
  - `BalanceCalculatorService`: soma saldos totais e disponíveis com base nas contribuições.
  - `WithdrawalValidatorService`: valida solicitações de resgate, garantindo que as contribuições pertençam ao usuário e que haja saldo disponível.
- **Exceções**
  - `InsufficientBalanceException`: lançada quando o saldo disponível não cobre o resgate solicitado.
  - `InvalidWithdrawalException`: representa violações de regras de negócio em pedidos de resgate.
- **Repositórios (interfaces)**: `UserRepository` e `ContributionRepository` definem os contratos de persistência que serão implementados na infraestrutura.

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
