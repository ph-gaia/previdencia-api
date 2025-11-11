# Previdência API

API em NestJS voltada para gestão de saldos e solicitações de resgate de planos de previdência privada.

## Objetivo do projeto

- Permitir que um chatbot consulte o saldo total do participante e o saldo disponível para resgate.
- Atender solicitações de resgate total ou parcial, respeitando saldo disponível, regras de carência e demais restrições do produto.

## Stack principal

- Node.js 20 + NestJS 11
- PostgreSQL 16
- Prometheus + Grafana (monitoramento)
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
2. Copie `env.sample` para `.env` e ajuste as credenciais desejadas antes de subir os contêineres:
   ```bash
   cp env.sample .env
   ```
3. Suba os serviços (API, PostgreSQL e monitoramento):
   ```bash
   docker compose up -d
   ```
4. A API ficará disponível em `http://localhost:3000`. O banco utiliza as credenciais definidas no arquivo `.env`.
5. Monitoramento:
   - Prometheus em `http://localhost:9090`
   - Grafana em `http://localhost:3001` (login conforme `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)
   - Métricas da API em `http://localhost:3000/metrics`

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

## Monitoramento

- A API expõe métricas Prometheus em `/metrics`, com contadores para leituras de saldo (`success`/`error`) e solicitações de resgate (`success`/`error`).
- No Grafana (rodando via docker compose), configure uma fonte de dados Prometheus apontando para `http://prometheus:9090`.
- Para um dashboard inicial, importe o painel oficial **Prometheus Stats (ID 3662)** ou crie visualizações personalizadas a partir das métricas `previdencia_balance_reads_total` e `previdencia_withdrawal_requests_total`.

## Próximos passos

- Modelagem das entidades de saldo e regras de carência.
- Implementação dos endpoints de consulta e solicitação de resgate com validações de negócio.
- Manutenção da projeção `user_balances` via CQRS para respostas rápidas ao chatbot.

---

## Modelagem atual

### Banco relacional

- `users`: cadastro básico do participante (identificação, dados pessoais).
- `contributions`: aportes realizados, valor total, valor já resgatado (`redeemed_amount`), data de carência e timestamps.
- `contribution_vestings`: curvas de liberação parcial por aporte (valor e data de liberação).
- `withdrawals`: pedidos processados de resgate (total/parcial), valor solicitado/aprovado e situação.
- `withdrawal_items`: relação entre um pedido processado e os aportes debitados, registrando o valor abatido por contribuição.
- `user_balances`: projeção materializada contendo saldos total, disponível e bloqueado para consulta rápida.

### Domínio

- `Contribution`: agora rastreia quanto já foi resgatado, calculando automaticamente o saldo remanescente e disponível.
- `BalanceCalculatorService`: soma saldos total/disponível a partir das contribuições (usado como fallback quando não há projeção).
- `WithdrawalValidatorService`: valida pedidos contra as contribuições do usuário, tipos (TOTAL/PARCIAL) e carência.
- `WithdrawalRequest`: entidade imutável utilizada na validação de resgates.

### Camada de infraestrutura

- **Repositórios TypeORM**: mapeiam `users`, `contributions`, `withdrawals` e derivadas.
- **Serviço de persistência de resgates**: realiza o débito dos aportes, grava `withdrawals`/`withdrawal_items`, atualiza `redeemed_amount` e dispara o evento `WithdrawalProcessedEvent`.
- **Projeção CQRS**: `UserBalanceProjector` reavalia o saldo consolidando aportes, vestings e resgates; o resultado é salvo em `user_balances`.

---

## Fluxos principais

### Consulta de saldo

1. O chatbot chama `GET /users/:userId/balance`.
2. O controller valida parâmetros e delega ao `GetBalanceUseCase`.
3. O use case busca a projeção em `user_balances` (se for consulta no tempo atual).  
   - Caso não exista projeção ou a consulta seja para uma data histórica, recalcula em tempo real pelas contribuições.
4. O resultado (total, disponível) é retornado ao chatbot.

### Solicitação de resgate

1. O chatbot envia `POST /users/:userId/withdrawals` com tipo (TOTAL/PARCIAL) e valor quando aplicável.
2. O controller valida o payload e chama `RequestWithdrawalUseCase`.
3. O use case:
   - Valida o usuário, aportações e regras de carência via `WithdrawalValidatorService`.
   - Calcula o saldo pós-resgate.
   - Dispara o serviço de persistência para gravar o pedido e debitar as contribuições.
4. O serviço de persistência atualiza `redeemed_amount` nos aportes, grava `withdrawals` + `withdrawal_items`, e publica `WithdrawalProcessedEvent`.
5. O evento aciona o `UserBalanceProjector`, que recalcula `user_balances`, garantindo que futuras consultas reflitam o resgate.
6. O use case responde ao chatbot com o valor aprovado e saldo disponível remanescente.

---

## Seeds para testes manuais

Execute o seed padrão (dois usuários com aportes, carências, resgates e projeções já calculadas):

```bash
npm run seed:dev
```

O script usa a mesma conexão configurada no `AppDataSource`. Ajuste as variáveis de ambiente antes de executar.

---
