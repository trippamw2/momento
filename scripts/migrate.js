const { Client } = require("pg");
const fs = require("fs");
const dns = require("dns");
dns.setDefaultResultOrder("verbatim");

const ref = "vuixuqdcaetnxmfiqjdq";
const region = "eu-west-1";
const dbPassword = "Nar-vin1997k";

const poolerHost = `aws-0-${region}.pooler.supabase.com`;
const directHost = `db.${ref}.supabase.co`;

const configs = [
  // Direct connection with explicit params
  { params: { host: directHost, port: 5432, user: "postgres", password: dbPassword, database: "postgres" }, ssl: { rejectUnauthorized: false }, label: "Direct (postgres)" },
  // Pooler (postgres.REF) - transaction mode
  { params: { host: poolerHost, port: 6543, user: `postgres.${ref}`, password: dbPassword, database: "postgres" }, ssl: { rejectUnauthorized: false }, label: "Pooler (postgres.REF) :6543" },
  // Pooler (postgres.REF) - session mode
  { params: { host: poolerHost, port: 5432, user: `postgres.${ref}`, password: dbPassword, database: "postgres" }, ssl: { rejectUnauthorized: false }, label: "Pooler (postgres.REF) :5432" },
  // Pooler (REF.postgres) - transaction mode
  { params: { host: poolerHost, port: 6543, user: `${ref}.postgres`, password: dbPassword, database: "postgres" }, ssl: { rejectUnauthorized: false }, label: "Pooler (REF.postgres) :6543" },
  // Pooler (REF.postgres) - session mode
  { params: { host: poolerHost, port: 5432, user: `${ref}.postgres`, password: dbPassword, database: "postgres" }, ssl: { rejectUnauthorized: false }, label: "Pooler (REF.postgres) :5432" },
];

async function tryConnect(config) {
  const clientOptions = {
    connectionTimeoutMillis: 15000,
    ...(config.params
      ? { host: config.params.host, port: config.params.port, user: config.params.user, password: config.params.password, database: config.params.database }
      : { connectionString: config.cs }),
    lookup: dns.lookup,
  };
  if (config.ssl) clientOptions.ssl = config.ssl;
  const client = new Client(clientOptions);
  try {
    await client.connect();
    console.log(`Connected with: ${config.label}`);
    const res = await client.query("SELECT version()");
    console.log(`  ${res.rows[0].version}`);
    return client;
  } catch (e) {
    console.log(`FAILED ${config.label}: ${e.message.substring(0, 120)}`);
    try { await client.end(); } catch(e2) {}
    return null;
  }
}

async function run() {
  console.log("Trying connection methods...\n");
  let client = null;
  for (const config of configs) {
    client = await tryConnect(config);
    if (client) break;
  }
  if (!client) {
    console.error("\nCould not connect with any method.");
    process.exit(1);
  }

  try {
    // Run schema.sql
    console.log("\n--- Running schema.sql ---");
    const schema = fs.readFileSync("supabase/schema.sql", "utf8");
    const schemaStatements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let schemaCount = 0;
    for (const stmt of schemaStatements) {
      try {
        const fullStmt = stmt + ";";
        await client.query(fullStmt);
        schemaCount++;
        console.log(`  OK (${schemaCount}): ${fullStmt.substring(0, 60)}...`);
      } catch (err) {
        if (
          err.message.includes("already exists") ||
          err.message.includes("duplicate key")
        ) {
          console.log(`  SKIP: ${fullStmt.substring(0, 60)}...`);
        } else {
          console.log(`  ERROR: ${err.message.substring(0, 120)}`);
          console.log(`  Statement: ${fullStmt.substring(0, 200)}`);
        }
      }
    }

    // Run RLS policies
    console.log("\n--- Running RLS policies ---");
    const rls = fs.readFileSync("supabase/rls.sql", "utf8");
    const rlsStatements = rls
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let rlsCount = 0;
    for (const stmt of rlsStatements) {
      try {
        const fullStmt = stmt + ";";
        await client.query(fullStmt);
        rlsCount++;
        console.log(`  OK (${rlsCount}): ${fullStmt.substring(0, 60)}...`);
      } catch (err) {
        if (
          err.message.includes("already exists") ||
          err.message.includes("duplicate key")
        ) {
          console.log(`  SKIP: ${fullStmt.substring(0, 60)}...`);
        } else {
          console.log(`  ERROR: ${err.message.substring(0, 120)}`);
          console.log(`  Statement: ${fullStmt.substring(0, 200)}`);
        }
      }
    }

    // Verify
    console.log("\n--- Verification ---");
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log("Tables in public schema:");
    tables.rows.forEach((r) => console.log(`  - ${r.table_name}`));

    const enums = await client.query(
      `SELECT t.typname FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e' ORDER BY t.typname`
    );
    console.log("\nEnums in public schema:");
    enums.rows.forEach((r) => console.log(`  - ${r.typname}`));

    console.log("\nMigration complete!");
  } catch (err) {
    console.error("Fatal error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
