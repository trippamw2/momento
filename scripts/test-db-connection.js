const { Client } = require("pg");
const fs = require("fs");

const envRaw = fs.readFileSync(".env.local", "utf8");
const lines = envRaw.split("\n");
let serviceKey = "", anonKey = "", url = "";
lines.forEach((l) => {
  const m = l.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (m) serviceKey = m[1].trim();
  const m2 = l.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  if (m2) anonKey = m2[1].trim();
  const m3 = l.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  if (m3) url = m3[1].trim();
});

const ref = "vuixuqdcaetnxmfiqjdq";
const region = "eu-west-1";

const configs = [
  {
    connectionString: `postgresql://${ref}.postgres:${serviceKey}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    label: "Pooler + service key",
    ssl: { rejectUnauthorized: false },
  },
  {
    connectionString: `postgresql://${ref}.postgres:${anonKey}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    label: "Pooler + anon key",
    ssl: { rejectUnauthorized: false },
  },
];

async function tryConnect(config) {
  const client = new Client({
    connectionString: config.connectionString,
    connectionTimeoutMillis: 8000,
    ssl: config.ssl ?? undefined,
  });
  try {
    await client.connect();
    const res = await client.query("SELECT version()");
    console.log("CONNECTED with", config.label);
    console.log(res.rows[0].version);
    await client.end();
    return true;
  } catch (e) {
    console.log("FAILED", config.label, "-", e.message.substring(0, 120));
    try {
      await client.end();
    } catch (e2) {}
    return false;
  }
}

(async () => {
  for (const config of configs) {
    if (await tryConnect(config)) break;
  }
})();
