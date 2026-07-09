// src/domain/database/DataAcess.ts
var DataAccessPort = class {
};

// src/infra/config/ConfigDb.ts
var ConfigDb = class {
  constructor(config2) {
    this.config = config2;
  }
  config;
  getDb() {
    return this.config.getVariable("DIRECT_URL");
  }
};

// src/infra/config/ConfigEnv.ts
import { config } from "dotenv";
config();
var ConfigEnv = class {
  constructor() {
  }
  getVariable(variable) {
    const variableEnv = process.env[variable];
    if (!variableEnv)
      throw new Error("Variable not found");
    return variableEnv;
  }
};

// src/infra/database/PostgresDataAccess.ts
import postgres from "postgres";
var PostgresDataAccess = class extends DataAccessPort {
  constructor(config2) {
    super();
    this.config = config2;
    this.connectionOptions = this.config.getDb();
  }
  config;
  connectionOptions;
  allowedFields = ["id", "name", "ean", "price", "stock", "discount", "deleted_at"];
  async executeQuery(callback) {
    const sql = postgres(this.connectionOptions, {
      ssl: "require",
      connect_timeout: 5,
      max: 1
    });
    try {
      return await callback(sql);
    } finally {
      await sql.end();
    }
  }
  buildWhere(sql, query) {
    const keys = Object.keys(query).filter((k) => this.allowedFields.includes(k));
    const conditions = keys.map((key) => sql`${sql(key)} = ${query[key]}`);
    conditions.push(sql`deleted_at IS NULL`);
    return conditions.reduce((acc, curr) => sql`${acc} AND ${curr}`);
  }
  async count(collectionName, query) {
    return this.executeQuery(async (sql) => {
      const [{ count }] = await sql`
        SELECT count(*)::int FROM ${sql(collectionName)} 
        WHERE ${this.buildWhere(sql, query)}
      `;
      return count;
    });
  }
  async findMany(collectionName, query, selectFields) {
    return this.executeQuery(async (sql) => {
      const fields = selectFields && selectFields.length > 0 ? selectFields.map((f) => sql(f)) : sql`*`;
      return await sql`
        SELECT ${fields} FROM ${sql(collectionName)} 
        WHERE ${query ? this.buildWhere(sql, query) : sql`deleted_at IS NULL`}
      `;
    });
  }
  async findOne(collectionName, query) {
    return this.executeQuery(async (sql) => {
      const [row] = await sql`
        SELECT * FROM ${sql(collectionName)} 
        WHERE ${this.buildWhere(sql, query)} 
        LIMIT 1
      `;
      return row;
    });
  }
  async create(collectionName, data) {
    return this.executeQuery(async (sql) => {
      const [result] = await sql`
        INSERT INTO ${sql(collectionName)} ${sql(data)}
        RETURNING id
      `;
      return result?.id;
    });
  }
  async update(collectionName, query, data) {
    return this.executeQuery(async (sql) => {
      const result = await sql`
        UPDATE ${sql(collectionName)} 
        SET ${sql(data)} 
        WHERE ${this.buildWhere(sql, query)}
      `;
      return result.count;
    });
  }
  async remove(collectionName, query) {
    return this.executeQuery(async (sql) => {
      const result = await sql`
        UPDATE ${sql(collectionName)} 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE ${this.buildWhere(sql, query)}
      `;
      return result.count;
    });
  }
};

// src/infra/pattern/DI.ts
var DependencyInjection = class {
  dependency = /* @__PURE__ */ new Map();
  constructor() {
  }
  addDependency(adapter, port) {
    if (this.dependency.get(port))
      throw new Error("Dependency Already Registred");
    this.dependency.set(port, adapter);
  }
  getDependency(port) {
    const dependency = this.dependency.get(port);
    if (dependency)
      return dependency;
    throw new Error("Dependency " + port + " Not Found");
  }
};

// src/infra/server/ServerPort.ts
var ServerPort = class {
  listen(port) {
  }
  addRouter(methodHttp2, path, ...callback) {
  }
};

// src/infra/server/ServerExpressAdapter.ts
import express from "express";
var ServerExpressAdapter = class extends ServerPort {
  app;
  constructor() {
    super();
    this.app = express();
    this.app.use(express.json({ limit: "100mb" }));
  }
  addRouter(methodHttp2, path, ...callback) {
    console.log(`Rota registrada: ${methodHttp2.toUpperCase()}: ${path}`);
    this.app[methodHttp2](path, ...callback);
  }
  listen(port) {
    this.app.listen(port, () => console.log("Servidor rodando em " + port));
  }
};

// src/infra/shared/Validator.ts
var Validator = class {
};

// src/infra/validators/ProductValidator.ts
import { z as z2 } from "zod";
var ProductValidator = class extends Validator {
  schema = z2.object({
    name: z2.string().min(3),
    price: z2.string(),
    discount: z2.string().nullable().optional(),
    stock: z2.number().int()
  });
  validate(data) {
    return this.schema.parse(data);
  }
};

// src/infra/controller/ProductController.ts
var ProductController = class {
  constructor() {
  }
  create(productInput) {
    console.log(productInput);
  }
};

// src/domain/repository/RepositoryPort.ts
var RepositoryPort = class {
  constructor(dataAccess) {
    this.dataAccess = dataAccess;
  }
  dataAccess;
};

// src/domain/entites/Product.ts
var Product = class _Product {
  constructor(id, name, price, discount, stock, created_at = /* @__PURE__ */ new Date(), updated_at = /* @__PURE__ */ new Date(), deleted_at = null) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.discount = discount;
    this.stock = stock;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.deleted_at = deleted_at;
  }
  id;
  name;
  price;
  discount;
  stock;
  created_at;
  updated_at;
  deleted_at;
  static build(createId, name, price, discount, stock) {
    return new _Product(createId(), name, price, discount, stock, /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date(), null);
  }
  markAsUpdated() {
    this.updated_at = /* @__PURE__ */ new Date();
  }
  softDelete() {
    this.deleted_at = /* @__PURE__ */ new Date();
  }
  updateFields(data) {
    if (data.name !== void 0) this.name = data.name;
    if (data.price !== void 0) this.price = data.price;
    if (data.stock !== void 0) this.stock = data.stock;
    this.updated_at = /* @__PURE__ */ new Date();
  }
};

// src/infra/repository/ProductRepository.ts
var ProductRepository = class extends RepositoryPort {
  collectionName = "produtos";
  constructor(dataAccess) {
    super(dataAccess);
  }
  async save(entity) {
    return await this.dataAccess.create(this.collectionName, entity);
  }
  async findById(id) {
    const data = await this.dataAccess.findOne(this.collectionName, { id });
    if (!data) return void 0;
    return new Product(
      data.id,
      data.name,
      data.price,
      data.discount,
      data.stock,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.deleted_at ? new Date(data.deleted_at) : null
    );
  }
  async findAll() {
    const dataList = await this.dataAccess.findMany(this.collectionName);
    return dataList.map((data) => new Product(
      data.id,
      data.name,
      data.price,
      data.discount,
      data.stock,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.deleted_at ? new Date(data.deleted_at) : null
    ));
  }
  async exists(filter) {
    const count = await this.dataAccess.count(this.collectionName, filter);
    return count > 0;
  }
  async update(id, entity) {
    await this.dataAccess.update(this.collectionName, { id }, entity);
  }
  async delete(id) {
    return await this.dataAccess.remove(this.collectionName, { id });
  }
};

// src/infra/routers/ProductRouter.ts
var ProductRouter = class {
  constructor(server, productController, validator) {
    this.server = server;
    this.productController = productController;
    this.validator = validator;
    this.boot();
  }
  server;
  productController;
  validator;
  boot() {
    this.server.addRouter("post", "/", this.validatorProductInput, this.createProduct.bind(this));
  }
  validatorProductInput = (req, res, next) => {
    try {
      const data = this.validator.validate(req.body);
      req.productInput = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          details: error.flatten().fieldErrors
        });
      }
      return res.status(400).json({ error: "Validation failed" });
    }
  };
  createProduct = (req, res) => {
    const input = req.productInput;
    this.productController.create(input);
    res.send("foiii");
  };
};

// src/infra/module/ProductModule.ts
var ProductModule = class {
  constructor(di) {
    this.di = di;
    this.productValidator = this.di.getDependency(Validator);
    this.db = this.di.getDependency(DataAccessPort);
    this.server = this.di.getDependency(ServerPort);
    const controller = new ProductController();
    const productRepository = new ProductRepository(this.db);
    const routers = new ProductRouter(this.server, controller, this.productValidator);
  }
  di;
  server;
  db;
  productValidator;
};

// src/infra/module/AppModule.ts
var AppModule = class {
  di;
  server;
  db;
  config;
  configDb;
  constructor() {
    const productValidator = new ProductValidator();
    this.config = new ConfigEnv();
    this.configDb = new ConfigDb(this.config);
    this.di = new DependencyInjection();
    this.server = new ServerExpressAdapter();
    this.db = new PostgresDataAccess(this.configDb);
    this.di.addDependency(this.server, ServerPort);
    this.di.addDependency(this.server, DataAccessPort);
    this.di.addDependency(productValidator, Validator);
    this.modules();
  }
  modules() {
    new ProductModule(this.di);
  }
  listen(port) {
    this.server.listen(port);
  }
};

// src/main.ts
var app = new AppModule();
app.listen(9090);
