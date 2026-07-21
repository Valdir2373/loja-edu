# Regras de Desenvolvimento Refinado — loja-edu

Este documento **substitui** o `RegrasDeDesenvolvimento.md` anterior. Ele contém todo o padrão que já existe no código (inalterado onde já funcionava) **mais** duas disciplinas novas que passam a ser obrigatórias: **tratamento de erros específico** (§10) e **testes automatizados** (§11), com a regra de proporção do §12.

Qualquer IA que for **codar** este projeto deve seguir exatamente o que está aqui, sem introduzir estilos novos, sem "melhorar" a estrutura por conta própria, sem trocar convenções.

Qualquer IA que for **supervisionar** outra IA codando deve usar este documento como checklist de aceite: se o código gerado não seguir uma regra daqui — incluindo a proporção de teste/erro do §12 — deve ser rejeitado e corrigido antes de seguir em frente.

Este documento **não** define o nome do estilo arquitetural do projeto. Ele define o **padrão de código**: onde cada coisa mora, como cada peça se chama, o que cada peça pode ou não fazer, como cada erro é representado e como cada comportamento é provado por teste.

---

## 1. Stack

- TypeScript (`strict: true`), ES2022, módulos ES (`"type": "module"`).
- Express (via adapter próprio, nunca usado direto fora do adapter).
- `postgres` (driver puro, sem ORM) para o banco.
- Redis para cache.
- Zod para validação de schema (por trás de uma camada própria, nunca usado direto nos validators de feature).
- JWT (`jsonwebtoken`) para token, Argon2id para hash de senha, Nodemailer para e-mail, `uuid` para geração de id.
- Execução com `tsx` em dev, build com `tsup`.
- **Novo:** Vitest para testes (unitário e, futuramente, integração). Roda TypeScript ESM direto, sem transpilar antes. Nenhuma outra lib de teste/mocking entra no projeto — dublê de teste é escrito à mão sobre os Ports (§11.4).

---

## 2. Estrutura de pastas

```
src/
  main.ts                          → ponto de entrada único. Só cria AppModule e chama listen().

  domain/                          → regras e contratos puros. NUNCA importa nada de infra/ ou app/.
    entites/                       → entidades (nome da pasta é "entites", mantido assim de propósito — não renomear para "entities")
      Order.ts
      Product.ts
      User.ts
    repository/
      RepositoryPort.ts            → contrato genérico de repositório (abstract class, genérico <T>)
    database/
      DataAcess.ts                 → contrato de acesso a dados cru (DataAccessPort) — nome do arquivo mantido como está
      CachePort.ts                 → contrato de cache
    security/
      PasswordHasher.ts            → contrato de hash de senha
    interface/
      CreateId.ts                  → tipo de função geradora de id (CreateId = () => string)
    errors/                        → NOVO: taxonomia de erros de negócio (§10)
      AppError.ts                  → abstract class base de todo erro de negócio
      NotFoundError.ts
      ConflictError.ts
      UnauthorizedError.ts
      ForbiddenError.ts
      BusinessRuleError.ts

  app/                             → casos de uso, organizados por feature. Só importa de domain/.
    orders/
      dto/
        OrderInput.ts
        OrderOutput.ts
        OrderSummaryOutput.ts
      useCase/
        CreateOrder.ts
        CancelOrder.ts
        GetOrderById.ts
        ListOrdersByUser.ts
    products/
      dto/
        ProductInput.ts
        ProductOutput.ts
      useCase/
        CreateProduct.ts
        UpdateProduct.ts
        DeleteProduct.ts
        GetProductById.ts
        GetAllProducts.ts
    users/
      dto/
        UserInput.ts
        UserLoginInput.ts
        UserOutput.ts
      useCase/
        CreateUser.ts
        UpdateUser.ts
        DeleteUser.ts
        GetUser.ts
        GetAllUsers.ts
        LoginUser.ts
        VerifyEmail.ts

  infra/                           → tudo que fala com o mundo externo. Pode importar de domain/ e de app/.
    config/                        → 1 classe estática por assunto, lê variável de ambiente
      ConfigEnv.ts                 → wrapper de dotenv, única classe que lê process.env
      ConfigDb.ts
      ConfigDomain.ts
      ConfigEmail.ts
      ConfigToken.ts
      ConfigCache.ts
    pattern/
      DI.ts                        → container de injeção de dependência manual (DependencyInjection)
    module/                        → composition root por feature
      AppModule.ts                 → monta o DI raiz, registra os adapters, cria os módulos de feature
      ProductModule.ts
      UserModule.ts
      OrderModule.ts
      ViewModule.ts
    repository/                    → implementação concreta de RepositoryPort<T>
      ProductRepository.ts
      UserRepository.ts
      OrderRepository.ts
    controller/                    → orquestra use cases, não conhece HTTP
      ProductController.ts
      UserCrudController.ts
      UserAuthController.ts
      OrderController.ts
      ViewController.ts
    routers/                       → dono exclusivo de rota/HTTP
      ProductRouter.ts
      UserCrudRouter.ts
      UserAuthRouter.ts
      OrderRouter.ts
    validators/                    → 1 validator por feature, usa o builder de schema (shared/validators)
      ProductValidator.ts
      UserValidator.ts
      OrderValidator.ts
      Validator.ts                 → abstract genérico legado, hoje nenhum validator concreto o implementa (ver §13)
    shared/
      validators/
        DTOBuilderAndValidator.ts  → contrato do builder de schema (abstract class)
        ZodDTOBuilderAndValidator.ts → implementação concreta com Zod
        IFieldsValidator.ts        → tipos de definição de campo (FieldDefinition e variantes)
      errors/
        ValidationError.ts         → único tipo de erro para falha de validação de DTO
        HttpErrorMapper.ts         → NOVO: única classe que traduz erro em status HTTP (§10.4)
    server/
      ServerPort.ts                → contrato do servidor HTTP + tipos IRequest/IResponse/middleWare/methodHttp
      ServerExpressAdapter.ts      → implementação concreta com Express
    database/
      PostgresDataAccess.ts        → implementação concreta de DataAccessPort
      RedisCacheAdapter.ts         → implementação concreta de CachePort
    email/
      EmailPort.ts                 → contrato de envio de e-mail
      SmptEmailServiceAdapter.ts   → implementação concreta com Nodemailer (nome do arquivo mantido como está)
    security/
      AuthTokenManager.ts          → contrato de geração/verificação de token (abstract class)
      IAuthTokenManager.ts         → interface auxiliar, hoje só fornece o tipo TokenGenerationOptions (ver §13)
      JsonwebtokenAuthTokenManager.ts → implementação concreta com jsonwebtoken
      ServiceAuthToken.ts          → serviço de alto nível (token + cache de revogação), usado pelos controllers
      Argon2idHasher.ts            → implementação concreta de PasswordHasher
    schema/
      ProductSchema.ts             → schema Zod solto, hoje não conectado ao fluxo de validação (ver §13)
    utils/
      createId.ts                  → implementação concreta de CreateId (uuid v4)

tests/                             → NOVO: espelha src/ (§11.2)
  doubles/                         → dublês de teste escritos à mão, 1 por Port
    FakeDataAccess.ts
    FakeCachePort.ts
    FakeEmailPort.ts
    FakePasswordHasher.ts
    FakeAuthTokenManager.ts
    InMemoryRepository.ts          → fake genérico de RepositoryPort<T>
  domain/
    entites/
      Order.test.ts
      Product.test.ts
      User.test.ts
  app/
    orders/
      CreateOrder.test.ts
      CancelOrder.test.ts
      GetOrderById.test.ts
      ListOrdersByUser.test.ts
    products/
      ...
    users/
      ...
  infra/
    validators/
      ProductValidator.test.ts
      UserValidator.test.ts
      OrderValidator.test.ts
    controller/
      ...
    shared/
      HttpErrorMapper.test.ts
  integration/                     → reservado; só entra quando Docker existir (Fase 7 da Planta)
```

---

## 3. Padrões (o que cada peça é, e o que ela pode/não pode fazer)

### 3.1 Port (contrato)

Todo recurso externo (banco, cache, e-mail, servidor HTTP, hash de senha, token, builder de validação) tem um contrato representado por uma **`abstract class`** — nunca uma `interface` do TypeScript.

**Por quê:** o `DependencyInjection` (§3.3) usa a própria classe como chave de um `Map`. Uma `interface` do TS não existe em tempo de execução, então não pode ser usada como token de injeção. `abstract class` existe em runtime, por isso é a única opção válida para um contrato injetável.

Exemplos: `ServerPort`, `CachePort`, `DataAccessPort`, `EmailPort`, `PasswordHasher`, `AuthTokenManager`, `DTOBuilderAndValidator`, `RepositoryPort<T>`.

Regra: um Port só declara métodos `abstract`, nunca implementação.

**Bônus que essa regra já pagava e agora cobra de verdade:** todo Port é o ponto natural de dublê de teste (§11.4). Nenhum teste unitário do projeto mocka lib externa — mocka-se sempre na fronteira do Port.

### 3.2 Adapter (implementação concreta de um Port)

Nome = tecnologia + o que ela é: `ServerExpressAdapter`, `RedisCacheAdapter`, `PostgresDataAccess`, `SmtpEmailServiceAdapter`, `JsonwebtokenAuthTokenManager`, `Argon2idHasher`, `ZodDTOBuilderAndValidator`.

Regra: sempre `extends` o Port correspondente. Um adapter por arquivo. O adapter é o único lugar que pode importar a lib externa (`postgres`, `redis`, `jsonwebtoken`, `argon2`, `nodemailer`, `express`).

### 3.3 DI Container (`infra/pattern/DI.ts`)

Um único `Map` (Port → instância). Métodos: `addDependency(instancia, Port)` e `getDependency<Port>(Port)`.

Regra: só entram no container os Ports **compartilhados entre features** — os que são registrados uma vez em `AppModule` (`ServerPort`, `DataAccessPort`, `CachePort`, `PasswordHasher`, `AuthTokenManager`, `EmailPort`, `DTOBuilderAndValidator`).

Repository, UseCase, Controller, Router e Validator de uma feature **não entram no container** — eles são `new`ados diretamente dentro do `Module` da própria feature.

### 3.4 Module (composition root de feature)

Uma classe `XModule` por feature, em `infra/module/`. Recebe `DependencyInjection` (e serviços compartilhados como `ServiceAuthToken`, se a feature precisar) no construtor.

Dentro do construtor, nessa ordem: pega dependências do DI → `new` Repository → `new` cada UseCase → `new` Controller → `new` Router.

Regra: um Module **não** contém lógica de negócio, não tem `if`/`for` de regra, só instancia e conecta. É registrado dentro de `AppModule.modules()`.

### 3.5 Repository

`domain/repository/RepositoryPort<T>` define o contrato genérico: `save`, `findById`, `findAll`, `update`, `findBy`, `findMany`, `exists`, `delete`.

`infra/repository/XRepository extends RepositoryPort<X>` recebe `DataAccessPort` no construtor — **nunca** importa driver de banco diretamente.

Regra:
- Guarda o nome da tabela em `private readonly collectionName`.
- Tem um método privado `mapToEntity(data: any): X` — é o único lugar que sabe o formato da linha crua do banco.
- Repository só traduz dado. Regra de negócio não vive aqui.

### 3.6 Entity (`domain/entites/`)

Classe com estado **e** comportamento, não é um DTO anêmico.

Regra:
- Construtor recebe todos os campos; campos que não mudam de dono usam `readonly`.
- Quando existe regra de criação (validação, valor default), usa fábrica estática: `static build(createId, ...): X`.
- Mutação sempre por método nomeado pela intenção de negócio: `softDelete()`, `markAsUpdated()`, `verify()`, `promoteToAdmin()`, `addItem()`. Nunca setter solto tipo `setStatus()`.
- Regra que só depende dos próprios dados da entidade vive na entidade. Regra que depende de outra entidade ou de um repositório vive no UseCase.
- **Novo:** quando uma regra da entidade é violada (transição de status inválida, valor impossível), a entidade lança o erro específico da taxonomia (§10) — nunca `Error` genérico e nunca retorna `null`/`false` silencioso para esconder violação.

### 3.7 UseCase (`app/<feature>/useCase/`)

Uma classe por ação de negócio, um arquivo por classe. Nome = verbo + substantivo: `CreateOrder`, `CancelOrder`, `GetOrderById`, `ListOrdersByUser`.

Regra:
- Único método público: `execute(...)`.
- Construtor recebe apenas Ports/Repository/funções (`RepositoryPort<T>`, `PasswordHasher`, `CreateId`, etc.) — nunca recebe o `DependencyInjection` diretamente.
- **Alterado:** quando uma regra de negócio é violada, lança a subclasse de `AppError` correta (§10.2), com mensagem em português. `throw new Error("...")` genérico deixa de ser aceito em código novo.
- Retorna DTO de Output. Não devolve a Entity crua para fora do UseCase.
- **Novo:** todo caminho de falha do UseCase (cada `throw`) é um comportamento de negócio — e portanto exige teste (§11.5).

### 3.8 DTO (`app/<feature>/dto/`)

`interface` simples, sem métodos, sem prefixo `I`. Sufixo sempre `Input`, `Output` ou `<Algo>Output` (`OrderSummaryOutput`).

Input = o que entra no UseCase. Output = o que o UseCase devolve. Controller e Router nunca reaproveitam a Entity como retorno — sempre um DTO de Output.

### 3.9 Controller (`infra/controller/`)

Orquestra um ou mais UseCases.

**Controller não define rota.** Regras:
- Nunca importa `IRequest`, `IResponse`, `ServerPort` ou qualquer tipo do Express.
- Nunca define path, método HTTP, status code, cookie ou header.
- Um método público por ação que o Router vai chamar, nomeado igual/próximo ao verbo do UseCase (`create`, `update`, `delete`, `getById`, `getAll`, `login`, `verifyEmail`).
- Pode combinar mais de um UseCase quando a ação de fato depende disso (ex.: `UserCrudController.create` chama `CreateUser`, gera token de verificação e dispara e-mail).
- Retorna DTO de Output puro ou deixa o erro subir (`AppError`/`ValidationError`). Quem decide o HTTP status é sempre o Router.
- **Novo:** Controller nunca engole erro (`try/catch` vazio ou que só loga) e nunca converte erro específico em `Error` genérico — o tipo do erro é informação que o Router precisa para escolher o status.

### 3.10 Router (`infra/routers/`)

Dono exclusivo de path, método HTTP, middleware de validação, cookie e status code.

Regras:
- Construtor recebe `ServerPort` + Controller (+ Validator/`ServiceAuthToken` quando a rota precisar), e chama `this.boot()` no fim do construtor.
- Cada handler é uma arrow function de classe tipada `middleWare`: `private createProduct: middleWare = async (req, res) => {...}` — nome do handler = verbo da ação.
- Todo handler tem `try/catch` e define o status HTTP explicitamente.
- **Alterado:** dentro do `catch`, o handler nunca decide status "no olho" com `if (error.message === ...)`. Ele delega para o `HttpErrorMapper` (§10.4), que traduz o tipo do erro em status + corpo padronizado.
- Validação de entrada é sempre um middleware separado (`validatorXInput`) que roda antes do handler e injeta o resultado no `req` (via cast para `IRequest<..., XInjection>`).
- Router nunca chama Repository ou UseCase diretamente — só o Controller.

### 3.11 Validator (`infra/validators/`)

Um `XValidator` por feature. Usa `DTOBuilderAndValidator.defineSchema(...)` (lista de `FieldDefinition`) e depois `validateAndTransform(data)`.

Regras:
- Métodos: `validate` (criação), `validateUpdate` (parcial), e um método extra nomeado pela ação quando necessário (`validateLogin`).
- Sempre implementa `formatError(error)`, que transforma um `ValidationError` em `Record<string, string[]>`.
- Validator nunca decide status HTTP — só valida e formata o erro. Quem usa o resultado pra responder é o Router.

### 3.12 Config (`infra/config/`)

Uma classe estática `ConfigX` por assunto, com método estático `getX()`. Sempre lê a variável via `ConfigEnv.getVariable("NOME_DA_VAR")` — nunca `process.env` direto fora de `ConfigEnv`.

`ConfigEnv.getVariable` lança erro se a variável não existir. Nunca usar fallback silencioso (`?? "valor"`) para configuração obrigatória/segredo.

---

## 4. Nomenclatura

| Elemento | Regra | Exemplo |
|---|---|---|
| Classe | PascalCase, sem underline | `CreateOrder`, `ProductRepository` |
| Interface de contrato injetável (Port) | `abstract class`, PascalCase, **nunca** `interface` | `CachePort`, `PasswordHasher` |
| Interface de formato de dado (não injetável) | prefixo `I` + PascalCase | `IRequest`, `IResponse`, `ITokenSecrets`, `ICacheSecret` |
| DTO (Input/Output) | `interface` pura, sem prefixo `I`, sufixo `Input`/`Output` | `UserInput`, `OrderOutput` |
| Erro de negócio | PascalCase, sufixo `Error`, `extends AppError` | `NotFoundError`, `ConflictError` |
| Dublê de teste | prefixo `Fake` (ou `InMemory` para repositório genérico) + nome do Port | `FakeEmailPort`, `InMemoryRepository` |
| Arquivo de teste | nome da classe testada + `.test.ts`, no espelho de `tests/` | `CreateOrder.test.ts` |
| Variável, propriedade, parâmetro, método | camelCase, sem underline | `productRepository`, `createId` |
| Exceção travada: colunas espelhando o banco | snake_case de propósito, porque a Entity mapeia 1:1 pra coluna do Postgres | `created_at`, `updated_at`, `deleted_at` |
| Arquivo | mesmo nome da classe/exportação principal | `OrderRepository.ts` → `class OrderRepository` |
| Arquivo de função utilitária solta | camelCase | `createId.ts` → `createIdAdapter` |
| Pasta | lowercase; ao adicionar em uma camada já existente, usar o nome de pasta **já usado** — nunca criar sinônimo (não criar `repositories` se já existe `repository`) | `controller`, `module`, `repository`, `routers`, `validators` |

---

## 5. Regra maior: SEM COMENTÁRIOS

Nenhum comentário no código, nunca — nem explicando o que o código faz, nem código morto comentado (`// const x = ...`).

O nome da classe, do método e da variável tem que ser autoexplicativo. Se o nome não é suficiente para entender o código, **o nome está errado** — renomear, não comentar.

**A regra vale igualmente para os testes.** A "documentação" de um teste é o texto do `describe`/`it` (§11.6), não comentário.

---

## 6. Tamanho de classe

- Uma classe pública por arquivo.
- Limite de **120 linhas por classe**. Se passar disso, é sinal de que a classe está fazendo mais de uma coisa — dividir por responsabilidade (ex.: separar um novo UseCase, não inchar o Controller).
- Método com mais de ~25 linhas é sinal de quebrar em método privado menor, dentro da mesma classe.
- Exceção documentada: `ZodDTOBuilderAndValidator` (builder de schema) pode ultrapassar o limite porque é um `switch` de mapeamento repetitivo por tipo de campo, não lógica de negócio. Não usar essa exceção para justificar Controller, Router, Repository ou UseCase grandes.
- **Novo:** arquivos de teste **não** têm limite de 120 linhas — pela regra de proporção do §12, eles serão naturalmente maiores que a classe testada. O limite deles é outro: um arquivo de teste cobre **uma** classe, e cada `it` prova **um** comportamento.

---

## 7. Direção de dependência (quem pode importar quem)

```
domain/   → não importa nada de app/ nem de infra/
app/      → só importa de domain/
infra/    → pode importar de domain/ e de app/
main.ts   → só importa AppModule
tests/    → pode importar de qualquer camada de src/ (é o único lugar com esse privilégio)
```

Os erros de `domain/errors/` são importáveis por todas as camadas (domain, app, infra) — é por isso que moram em `domain/`, e não em `infra/`. `ValidationError` continua em `infra/shared/errors/` porque nasce da fronteira de validação de DTO, que é assunto de infra.

Fluxo de uma requisição:

```
Router → Validator (middleware) → Controller → UseCase → RepositoryPort → DataAccessPort → Adapter concreto
```

Fluxo de um erro (caminho de volta):

```
Entity/UseCase lança AppError específico → Controller deixa subir → Router captura → HttpErrorMapper traduz em status + corpo → resposta HTTP
```

---

## 8. Passo a passo obrigatório para criar uma feature nova

1. Entity em `domain/entites/` (com `static build` se houver regra de criação) — lançando erro específico da taxonomia (§10) em toda regra violada.
2. **Teste da Entity** em `tests/domain/entites/` — caminho feliz + um `it` por regra/`throw` da entidade.
3. Se precisar de um contrato novo (não existente ainda), Port em `domain/` como `abstract class` — e o `Fake` correspondente em `tests/doubles/`.
4. DTOs (`Input`/`Output`) em `app/<feature>/dto/`.
5. UseCases em `app/<feature>/useCase/`, um por ação, só com `execute`.
6. **Teste de cada UseCase** em `tests/app/<feature>/` — caminho feliz + um `it` por `throw` + interação com os Fakes (o que foi salvo, o que foi buscado).
7. Repository em `infra/repository/`, `extends RepositoryPort<Entity>`.
8. Validator em `infra/validators/`, usando `DTOBuilderAndValidator`.
9. **Teste do Validator** em `tests/infra/validators/` — dado válido passa, cada campo inválido falha com a mensagem certa via `formatError`.
10. Controller em `infra/controller/`, orquestrando os UseCases — zero HTTP.
11. **Teste do Controller** quando ele orquestra mais de um UseCase ou tem lógica de combinação (ex.: criar usuário + token + e-mail). Controller que só repassa 1:1 para um UseCase já testado não precisa de teste próprio.
12. Router em `infra/routers/`, com `boot()` registrando as rotas via `ServerPort.addRouter`, usando `HttpErrorMapper` no `catch`.
13. Module em `infra/module/`, conectando tudo isso na ordem: Repository → UseCases → Controller → Router.
14. Registrar o novo Module dentro de `AppModule.modules()`.
15. **Conferir a proporção do §12** antes de declarar a feature pronta.

Se qualquer um desses passos for pulado ou feito fora de ordem, o código não está de acordo com o padrão do projeto. Teste não é etapa opcional nem "fase de depois": entrega sem os testes dos passos 2, 6 e 9 é entrega rejeitada.

---

## 9. Ordem de trabalho dentro de uma entrega

Para cada classe de produção, o pedreiro trabalha em ciclo curto:

1. Escreve a classe (ou o método).
2. Escreve os testes dela **na mesma entrega** (não em uma entrega separada "só de testes").
3. Roda a suíte inteira (`vitest run`) — não só o arquivo novo.
4. Só então passa para a próxima classe.

É proibido acumular várias classes sem teste para "testar tudo no final". O supervisor deve rejeitar qualquer entrega em que exista classe de produção nova sem o teste correspondente na mesma entrega.

---

## 10. Tratamento de erros (substitui o antigo §3.13 "Erros")

### 10.1 Princípio

Erro é parte do contrato de negócio, não acidente. Cada falha possível tem um **tipo** que diz *o que* aconteceu, uma **mensagem em português** que diz isso *para o usuário final*, e um **teste** que prova que ela acontece na hora certa. As três coisas andam juntas: `throw` novo sem teste novo é violação de padrão.

### 10.2 Taxonomia (`domain/errors/`)

- `AppError` — `abstract class`, `extends Error`. Base de todo erro de negócio. Nunca é lançada diretamente.
- `NotFoundError` — o recurso pedido não existe (produto, pedido, usuário).
- `ConflictError` — o estado atual impede a operação por duplicidade/concorrência (e-mail já cadastrado, pedido já cancelado, estoque já reservado).
- `UnauthorizedError` — identidade ausente ou inválida (sem token, token expirado/revogado, senha errada).
- `ForbiddenError` — identidade válida, mas sem permissão para esta ação (usuário comum tentando ação de admin).
- `BusinessRuleError` — regra de negócio violada que não se encaixa nas anteriores (estoque insuficiente, status não permite transição, valor inválido pós-validação).

`ValidationError` (`infra/shared/errors/`) permanece como está: é o único tipo para falha de formato/schema de DTO, o único com `.details`, e **não** entra na taxonomia de `domain/` — formato é assunto da fronteira, não do domínio.

Regras:
- Escolher sempre o tipo mais específico. `BusinessRuleError` é o último recurso, não o padrão preguiçoso.
- Novo tipo de erro só nasce se nenhum dos existentes expressar o caso — e nasce em `domain/errors/`, `extends AppError`, com teste.
- Identificadores (classe, propriedade) em inglês; mensagem voltada ao usuário final em português. Isso mantém a regra original de idioma.
- Mensagem nunca vaza detalhe técnico (nome de tabela, stack, SQL, segredo). O que o usuário lê é linguagem de negócio.

### 10.3 Onde cada erro pode nascer

| Camada | Pode lançar | Nunca lança |
|---|---|---|
| Entity | `BusinessRuleError`, `ConflictError` (regra interna de estado) | erros de infra, `ValidationError` |
| UseCase | qualquer `AppError` da taxonomia | `Error` genérico, `ValidationError` |
| Validator | `ValidationError` | `AppError` |
| Repository / Adapter | deixa o erro técnico da lib subir como está (o Router trata como 500) | `AppError` fingindo ser negócio |
| Controller | nenhum novo — só deixa subir | qualquer coisa; Controller não engole nem re-embrulha erro |
| Router | nenhum — captura e delega ao `HttpErrorMapper` | decisão de status "no olho" |

### 10.4 `HttpErrorMapper` (`infra/shared/errors/`)

Única classe do projeto que conhece a tabela erro → HTTP. Todo `catch` de Router chama ela, nenhum Router repete a tabela.

| Tipo capturado | Status | Corpo |
|---|---|---|
| `ValidationError` | 400 | `{ error: mensagem, details: formatError(...) }` |
| `UnauthorizedError` | 401 | `{ error: mensagem }` |
| `ForbiddenError` | 403 | `{ error: mensagem }` |
| `NotFoundError` | 404 | `{ error: mensagem }` |
| `ConflictError` | 409 | `{ error: mensagem }` |
| `BusinessRuleError` | 422 | `{ error: mensagem }` |
| Qualquer outro (`Error` desconhecido, erro de lib) | 500 | `{ error: "Erro interno do servidor" }` — a mensagem original **nunca** vai para o cliente |

Regras:
- O corpo de erro tem sempre o mesmo formato (`error` + `details` opcional) em todas as rotas do projeto.
- O `HttpErrorMapper` tem teste próprio cobrindo **todas** as linhas da tabela, incluindo a de 500.

### 10.5 Migração do código existente

O código atual usa `throw new Error("mensagem")`. Regra de migração:
- Código **novo**: sempre taxonomia, sem exceção.
- Código **existente**: ao tocar em um arquivo por qualquer motivo, os `throw new Error` daquele arquivo são migrados para o tipo correto **na mesma entrega**, junto com os testes deles.
- Não abrir uma "entrega gigante de migração de erro" varrendo o projeto inteiro de uma vez — a migração acompanha o roteiro de fases da Planta, arquivo a arquivo.

---

## 11. Testes

### 11.1 O que é obrigatório testar

| Peça | Teste | Obrigatório? |
|---|---|---|
| Entity | unitário puro (sem dublê) | Sim — toda entidade |
| UseCase | unitário com Fakes nos Ports | Sim — todo UseCase |
| Validator | unitário (dado bruto → DTO ou `ValidationError`) | Sim — todo Validator |
| `HttpErrorMapper` e classes de `shared/` | unitário | Sim |
| Controller | unitário com UseCases reais + Fakes nos Ports | Só quando orquestra >1 UseCase ou tem lógica de combinação |
| Repository / Adapter | integração (banco/Redis reais) | Ainda não — entra junto com Docker (Fase 7); até lá, a fronteira é coberta pelos Fakes |
| Router / Module / Config / DTO / Port | — | Não (Router é colagem fina sobre o Controller; DTO e Port não têm comportamento) |

### 11.2 Estrutura e execução

- Testes moram em `tests/`, espelhando o caminho de `src/` (`src/app/orders/useCase/CreateOrder.ts` → `tests/app/orders/CreateOrder.test.ts`).
- Um arquivo de teste por classe testada. Nome: `X.test.ts`.
- `vitest run` no `package.json` como `npm test`. A suíte inteira precisa passar antes de qualquer entrega ser declarada pronta — teste quebrado não é "detalhe pra depois".
- Teste não depende de rede, banco real, Redis real, SMTP real, relógio real nem de ordem de execução. Cada `it` monta seu próprio cenário do zero.

### 11.3 Anatomia de um teste

- Estrutura interna sempre em três blocos, na ordem: **preparar** (montar entidade/fakes/entrada), **agir** (uma chamada ao método testado), **verificar** (asserts).
- Um `it` prova **um** comportamento. Se o `it` precisa de dois cenários diferentes para fazer sentido, são dois `it`.
- `describe` de fora = nome da classe; `describe` interno (opcional) = método; texto do `it` = frase em português descrevendo o comportamento, no mesmo tom das mensagens de erro: `it("recusa cancelamento de pedido já enviado")`, `it("cria o pedido com status aguardando pagamento")`.
- Assert de erro sempre verifica **o tipo e a mensagem**: esperar que lance `ConflictError` *e* que a mensagem seja a mensagem em português definida no código. Só verificar "lançou alguma coisa" não prova nada.

### 11.4 Dublês de teste (`tests/doubles/`)

- Todo dublê é uma classe escrita à mão que `extends` o Port correspondente — exatamente como um Adapter, só que em memória. Prefixo `Fake` (`FakeEmailPort`, `FakeCachePort`) ou `InMemory` para o repositório genérico (`InMemoryRepository<T> extends RepositoryPort<T>`).
- Dublê guarda o que recebeu (`sentEmails`, `savedItems`) para o teste poder verificar interação — não só retorno.
- Dublê pode ser configurado para falhar (`failNextCall()`) para testar caminho de erro de infra.
- **Proibido:** `vi.mock` de módulo, mock de `postgres`/`redis`/`nodemailer` direto, monkey-patch de método. Se algo está difícil de dublar, é sinal de que falta um Port — a correção é no design, não no teste.
- Dublê segue as mesmas regras de código de produção (sem comentário, nomes autoexplicativos), mas não conta como "código de aplicação" na proporção do §12 — conta como código de teste.

### 11.5 Cobertura de comportamento (a régua real)

Número de cobertura de linha não é a régua. A régua é:

- Todo método público de Entity/UseCase/Validator tem pelo menos: 1 teste de caminho feliz + 1 teste por `throw` que ele contém.
- Todo `if` de regra de negócio tem os dois lados provados.
- Toda interação relevante com Port é verificada (o e-mail foi enviado? o estoque foi baixado? o token foi revogado?).
- Se um comportamento não tem como ser testado sem acessar rede/banco real, ele está na camada errada — mover a lógica, não pular o teste.

### 11.6 Idioma nos testes

Mesma regra do resto do projeto: identificadores (variáveis, funções auxiliares, classes Fake) em inglês; textos de `describe`/`it` e mensagens verificadas em português. O relatório do Vitest deve ler como uma especificação de negócio em português.

---

## 12. Regra de proporção: 2–3× mais teste + erro do que código de aplicação

Esta é a régua de aceite quantitativa de **toda entrega**:

- **Métrica:** linhas de código novas/alteradas em `tests/` + linhas de tratamento de erro (classes de `errors/`, `HttpErrorMapper`, blocos `try/catch` e `throw` com seus testes) **dividido por** linhas de código de aplicação novas/alteradas em `src/` (excluindo as próprias classes de erro).
- **Mínimo para aceitar a entrega: 2,0×.** **Alvo: 2,5–3,0×.**
- Verificação simples, sem ferramenta especial: `wc -l` nos arquivos tocados pela entrega, comparando os dois lados. O supervisor faz essa conta em toda revisão e escreve o número no aceite.
- A proporção se atinge **cobrindo comportamento de verdade** (§11.5): mais cenários de falha, mais transições de estado provadas, mais interações verificadas. É proibido inflar o número com teste duplicado, assert redundante, cenário copiado com outro nome ou linha em branco decorativa — o supervisor deve rejeitar inflação tão firmemente quanto rejeita falta de teste.
- Entregas raras que são só colagem (um Module novo, registro no AppModule) podem ficar abaixo de 2,0× — nesse caso o supervisor registra a exceção e o motivo no aceite. Exceção é por entrega, nunca por fase inteira.

---

## 13. Débitos conhecidos (não usar como referência de padrão)

Estes pontos existem hoje no código mas são exceção/legado, não modelo a copiar:

- `infra/validators/Validator.ts` é um `abstract class` genérico que nenhum validator concreto implementa hoje. Não estender essa classe em validators novos até ela ser adotada de fato.
- `infra/schema/ProductSchema.ts` é um schema Zod solto, não conectado ao fluxo real de validação (`ProductValidator` usa `DTOBuilderAndValidator`, não esse arquivo). Não usar como exemplo de validação.
- `infra/security/IAuthTokenManager.ts` é uma `interface` paralela ao `AuthTokenManager` (abstract class); hoje só o tipo `TokenGenerationOptions` dela é usado de fato. Não criar um contrato de Port como `interface` — seguir §3.1.
- Nomes de arquivo com typo mantidos de propósito para não quebrar imports existentes: pasta `entites` (não `entities`), `infra/database/DataAcess.ts` (não `DataAccess.ts`), `infra/email/SmptEmailServiceAdapter.ts` (não `Smtp...`). Não corrigir esses nomes sem que seja pedido explicitamente — a correção exige renomear em todos os imports.
- Há trechos de código comentado e `console.log` de debug esquecidos em alguns routers/repositories (ex.: `OrderRouter.ts`, `ProductRepository.ts`). Não copiar esse hábito em código novo — a regra do §5 vale para código escrito daqui para frente. Ao tocar num desses arquivos, remover o débito na mesma entrega.
- **Novo débito declarado:** todo o código existente foi escrito sem teste e com `throw new Error` genérico. Ele não vira referência: a régua dos §10–§12 vale para tudo escrito daqui em diante, e o legado migra pela regra do §10.5 (arquivo tocado = arquivo migrado), acompanhando as fases da Planta.