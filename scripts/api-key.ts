/**
 * Gestão de chaves de API (issue #3105).
 *
 * Deliberadamente um script, não uma rota administrativa: criar chave é
 * operação rara e privilegiada, e uma rota nova seria superfície de ataque
 * permanente para um ganho de conveniência pequeno.
 *
 *   pnpm api-key list
 *   pnpm api-key create <email-do-usuario> "<nome da chave>"
 *   pnpm api-key revoke <id-da-chave>
 *
 * A chave em claro aparece UMA vez, na criação: o banco guarda só o SHA-256.
 * Se perder, revogue e crie outra.
 */
import { PrismaClient } from "../src/generated/prisma";
import { generateApiKey, hashApiKey } from "../src/lib/api-key";

const prisma = new PrismaClient();

async function list() {
  const keys = await prisma.apiKey.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (keys.length === 0) {
    console.log("Nenhuma chave no banco.");
    console.log("A chave de API_KEY (ambiente) continua valendo como ponte.");
    return;
  }

  for (const k of keys) {
    const estado = k.revokedAt ? `REVOGADA em ${k.revokedAt.toISOString().slice(0, 10)}` : "ativa";
    const uso = k.lastUsedAt ? k.lastUsedAt.toISOString().slice(0, 16) : "nunca usada";
    console.log(`${k.id}  ${estado.padEnd(26)}  ${k.user.email.padEnd(32)}  ${uso}  ${k.name}`);
  }
}

async function create(email: string, name: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Usuário não encontrado: ${email}`);
    process.exit(1);
  }

  const key = generateApiKey();
  const row = await prisma.apiKey.create({
    data: { name, hash: hashApiKey(key), userId: user.id },
  });

  console.log(`Chave criada para ${email} (${row.id})`);
  console.log("");
  console.log(key);
  console.log("");
  console.log("Guarde agora — ela não é recuperável. O banco só tem o hash.");
  console.log("Destino sugerido: ~/.wb-project-manager-api-key (chmod 600), fora de repo.");
}

async function revoke(id: string) {
  const row = await prisma.apiKey.findUnique({ where: { id } });
  if (!row) {
    console.error(`Chave não encontrada: ${id}`);
    process.exit(1);
  }
  if (row.revokedAt) {
    console.log(`Já estava revogada em ${row.revokedAt.toISOString()}`);
    return;
  }

  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  console.log(`Revogada: ${id} (${row.name})`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case "list":
      await list();
      break;
    case "create":
      if (args.length < 2) {
        console.error('uso: pnpm api-key create <email> "<nome da chave>"');
        process.exit(1);
      }
      await create(args[0], args.slice(1).join(" "));
      break;
    case "revoke":
      if (args.length < 1) {
        console.error("uso: pnpm api-key revoke <id>");
        process.exit(1);
      }
      await revoke(args[0]);
      break;
    default:
      console.error('uso: pnpm api-key <list|create|revoke>');
      process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
