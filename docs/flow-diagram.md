# Fluxo de Consulta de Saldo

```mermaid
flowchart TD
    subgraph Client Side
        A[Cliente ou consumidor da API]
    end

    subgraph NestJS API
        B[BalanceController<br/>GET /users/{userId}/balance]
        C[ParseUUIDPipe & ValidationPipe<br/>valida parâmetros]
        D[GetBalanceRequestDto<br/>monta entrada]
        E[GetBalanceUseCase.execute()]
        F[ensureUserId]
        G[UserRepository.findById]
        H{Usuário existe?}
        I[parseReferenceDate<br/>data fornecida?]
        J{Referência informada?}
        K[UserBalanceProjectionRepository.findByUserId]
        L{Projeção encontrada?}
        M[ContributionRepository.findByUserId]
        N[BalanceCalculatorService.calculateSummary]
        O[Montagem do resultado<br/>(userId, total, disponível)]
        P[UserBalanceProjectionRepository.upsert]
        Q[Retorno para o controller]
    end

    subgraph Infra & Metrics
        R[MetricsService.observeBalanceRead]
    end

    A --> B --> C --> D --> E --> F --> G --> H
    H -->|Não| R -->|lança erro| B
    H -->|Sim| I --> J
    J -->|Não| K --> L
    L -->|Sim| O --> Q
    L -->|Não| M --> N --> O --> P --> Q
    J -->|Sim| M
    Q --> B --> A

    E -.finally.-> R
    O --> R
```

# Fluxo de Solicitação de Resgate

```mermaid
flowchart TD
    subgraph Client Side
        A1[Cliente ou consumidor da API]
    end

    subgraph NestJS API
        B1[WithdrawalController<br/>POST /users/{userId}/withdrawals]
        C1[ParseUUIDPipe & ValidationPipe<br/>valida parâmetros e body]
        D1[RequestWithdrawalRequestDto<br/>monta entrada]
        E1[RequestWithdrawalUseCase.execute()]
        F1[ensureUserId]
        G1[UserRepository.findById]
        H1{Usuário existe?}
        I1[ContributionRepository.findByUserId]
        J1[parseDateOrNow(requestedAt)]
        K1[toMoneyOrUndefined(requestedAmount)]
        L1[WithdrawalRequest<br/>monta objeto de domínio]
        M1[WithdrawalValidatorService.validate]
        N1{Validação ok?}
        O1[BalanceCalculatorService.calculateSummary]
        P1[Calcula saldo após resgate]
        Q1[persistWithdrawal via WithdrawalPersistencePort?]
        R1{Porta configurada?}
        S1[Retorno para o controller]
    end

    subgraph Infra & Metrics
        T1[MetricsService.observeWithdrawalRequest]
    end

    A1 --> B1 --> C1 --> D1 --> E1 --> F1 --> G1 --> H1
    H1 -->|Não| T1 -->|lança erro| B1
    H1 -->|Sim| I1 --> J1 --> K1 --> L1 --> M1 --> N1
    N1 -->|Não| T1 -->|lança exceção (ex.: saldo insuficiente)| B1
    N1 -->|Sim| O1 --> P1 --> Q1 --> R1
    R1 -->|Não| S1
    R1 -->|Sim| S1
    S1 --> B1 --> A1

    E1 -.finally.-> T1
```
