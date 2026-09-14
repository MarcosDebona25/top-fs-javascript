import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─── UPSERT users (idempotent: no rompe si ya existen) ───
  const ada = await prisma.user.upsert({
    where: { email: "ada@prisma.io" },
    update: {},
    create: { email: "ada@prisma.io", name: "Ada" },
  });

  const marcos = await prisma.user.upsert({
    where: { email: "hola@gmail.com" },
    update: {},
    create: { email: "hola@gmail.com", name: "Marcos" },
  });

  const alice = await prisma.user.upsert({
    where: { email: "alice@prisma.io" },
    update: {},
    create: { email: "alice@prisma.io", name: "Alice" },
  });

  console.log("Users upserted:", ada.name, marcos.name, alice.name);

  // ─── CREATE articles with connect (relacionar con user existente) ───
  // Usamos upsert para no duplicar si ya corriste el script
  await prisma.article.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Ada's first article",
      body: "Este es el contenido del primer articulo de Ada.",
      authorId: ada.id,
    },
  });

  await prisma.article.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: "Marcos' first article",
      body: "Este es el contenido del primer articulo de Marcos.",
      authorId: marcos.id,
    },
  });

  // ─── CREATE user + article en una sola operacion (nested write) ───
  // upsert no soporta nested create en el create, asi que verificamos primero
  const aliceArticles = await prisma.article.findMany({
    where: { authorId: alice.id },
  });

  if (aliceArticles.length === 0) {
    const userWithArticle = await prisma.user.update({
      where: { id: alice.id },
      data: {
        articles: {
          create: {
            title: "Alice's first article",
            body: "Este es el contenido del primer articulo de Alice.",
          },
        },
      },
      include: { articles: true },
    });
    console.log("Alice with article:", JSON.stringify(userWithArticle, null, 2));
  }

  // ─── CONNECT: crear article y asociar a user existente via relation ───
  const adaSecondArticle = await prisma.article.upsert({
    where: { id: 100 },
    update: {},
    create: {
      title: "Ada's second article",
      body: "Este es el contenido del segundo articulo de Ada.",
      author: { connect: { id: ada.id } },
    },
  });
  console.log(
    "Article with existing user:",
    JSON.stringify(adaSecondArticle, null, 2),
  );

  // ─── FIND: consultas de lectura ───
  console.log("\n=== All users with articles ===");
  const users = await prisma.user.findMany({
    include: { articles: true },
  });

  users.forEach((user) => {
    console.log(`\nUser: ${user.name} (${user.email})`);
    if (user.articles.length === 0) {
      console.log("  (no articles)");
    } else {
      user.articles.forEach((article) => {
        console.log(`  - ${article.title}: ${article.body}`);
      });
    }
  });

  // ─── FIND_UNIQUE: buscar por campo unico ───
  const foundUser = await prisma.user.findUnique({
    where: { email: "ada@prisma.io" },
    include: { articles: true },
  });
  console.log("\nfindUnique by email:", JSON.stringify(foundUser, null, 2));

  // ─── FIND_FIRST: buscar el primero que matchee ───
  const firstArticle = await prisma.article.findFirst({
    where: { title: { contains: "Ada" } },
  });
  console.log("\nfindFirst article with 'Ada' in title:", firstArticle);

  // ─── WHERE con filtros ───
  const adaArticles = await prisma.article.findMany({
    where: {
      author: { email: "ada@prisma.io" },
    },
    orderBy: { id: "desc" },
    take: 5,
  });
  console.log("\nAda's articles (filtered via relation):", adaArticles);

  // ─── UPDATE: modificar un registro ───
  const updatedUser = await prisma.user.update({
    where: { email: "ada@prisma.io" },
    data: { name: "Ada Lovelace" },
  });
  console.log("\nUpdated user:", updatedUser);

  // ─── UPDATE MANY: actualizar varios registros ───
  const updatedArticles = await prisma.article.updateMany({
    where: { authorId: ada.id },
    data: { body: "Updated body content" },
  });
  console.log("\nupdateMany count:", updatedArticles.count);

  // ─── DELETE: borrar un registro especifico ───
  // (comentado para no romper datos — descomenta para probar)
  // const deleted = await prisma.article.delete({
  //   where: { id: 100 },
  // });
  // console.log("Deleted:", deleted);

  // ─── AGGREGATE: contar, min, max, etc. ───
  const stats = await prisma.article.aggregate({
    _count: true,
    _min: { id: true },
    _max: { id: true },
  });
  console.log("\nArticle stats:", stats);

  // ─── GROUP BY ───
  const articlesByAuthor = await prisma.article.groupBy({
    by: ["authorId"],
    _count: { id: true },
  });
  console.log("\nArticles grouped by authorId:", articlesByAuthor);

  // ─── TRANSACTION: multiple ops en un solo commit ───
  const [newUser, newArticle] = await prisma.$transaction([
    prisma.user.create({
      data: { email: `user_${Date.now()}@test.io`, name: "Transaction User" },
    }),
    prisma.article.create({
      data: {
        title: "Transaction article",
        body: "Created inside a transaction",
        authorId: ada.id,
      },
    }),
  ]);
  console.log("\nTransaction result:", newUser.name, newArticle.title);

  // Cleanup: borrar el user de test de la transaccion
  await prisma.user.delete({ where: { email: newUser.email } });

  console.log("\n=== Script completado sin errores ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
