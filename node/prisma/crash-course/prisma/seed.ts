import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...\n");

  // ─── Clean existing data (orden importa por las relaciones) ───
  console.log("🗑️  Cleaning existing data...");
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database cleaned\n");

  // ─── Create 10 users ───
  console.log("👥 Creating 10 users...");
  const users = await prisma.user.createMany({
    data: [
      { email: "ada.lovelace@prisma.io", name: "Ada Lovelace" },
      { email: "alan.turing@prisma.io", name: "Alan Turing" },
      { email: "grace.hopper@prisma.io", name: "Grace Hopper" },
      { email: "linus.torvalds@prisma.io", name: "Linus Torvalds" },
      { email: "margaret.hamilton@prisma.io", name: "Margaret Hamilton" },
      { email: "donald.knuth@prisma.io", name: "Donald Knuth" },
      { email: "barbara.liskov@prisma.io", name: "Barbara Liskov" },
      { email: "tim.berners.lee@prisma.io", name: "Tim Berners-Lee" },
      { email: "guido.van.rossum@prisma.io", name: "Guido van Rossum" },
      { email: "brendan.eich@prisma.io", name: "Brendan Eich" },
    ],
  });
  console.log(`✅ Created ${users.count} users\n`);

  // Get all users to get their IDs
  const allUsers = await prisma.user.findMany();

  // ─── Create 10+ articles distributed across users ───
  console.log("📝 Creating articles...");
  const articles = await prisma.article.createMany({
    data: [
      // Ada's articles (2)
      {
        title: "Notes on the Analytical Engine",
        body: "The Analytical Engine weaves algebraical patterns just as the Jacquard loom weaves flowers and leaves.",
        authorId: allUsers[0].id,
      },
      {
        title: "On Computing and Mathematics",
        body: "Mathematics is the science which treats of the laws of series of changes.",
        authorId: allUsers[0].id,
      },
      // Alan's articles (2)
      {
        title: "On Computable Numbers",
        body: "The 'computable' numbers can be described briefly as those whose decimals are calculable by finite means.",
        authorId: allUsers[1].id,
      },
      {
        title: "Computing Machinery and Intelligence",
        body: "I propose to consider the question: 'Can machines think?'",
        authorId: allUsers[1].id,
      },
      // Grace's articles (1)
      {
        title: "The First Compiler",
        body: "The compiler transformed English-like instructions into machine code, revolutionizing programming.",
        authorId: allUsers[2].id,
      },
      // Linus's articles (2)
      {
        title: "Just for Fun: The Story of Linux",
        body: "I'm doing a (free) operating system (just a hobby, won't be big and professional).",
        authorId: allUsers[3].id,
      },
      {
        title: "Git: Distributed Version Control",
        body: "Git was created to manage Linux kernel development with speed and efficiency.",
        authorId: allUsers[3].id,
      },
      // Margaret's article (1)
      {
        title: "Apollo 11: Software Engineering",
        body: "The flight program was designed to handle the unexpected, including priority interrupts.",
        authorId: allUsers[4].id,
      },
      // Donald's article (1)
      {
        title: "The Art of Computer Programming",
        body: "Science is what we have learned about how to keep from fooling ourselves.",
        authorId: allUsers[5].id,
      },
      // Barbara's article (1)
      {
        title: "Liskov Substitution Principle",
        body: "If S is a subtype of T, then objects of type T may be replaced with objects of type S.",
        authorId: allUsers[6].id,
      },
      // Tim's article (1)
      {
        title: "The World Wide Web: A Proposal",
        body: "A universal distributed information system that can be accessed from anywhere.",
        authorId: allUsers[7].id,
      },
      // Guido's article (1)
      {
        title: "The Zen of Python",
        body: "Beautiful is better than ugly. Explicit is better than implicit. Simple is better than complex.",
        authorId: allUsers[8].id,
      },
      // Brendan's article (1)
      {
        title: "JavaScript in 10 Days",
        body: "The language was created in 10 days under intense pressure to ship with the browser.",
        authorId: allUsers[9].id,
      },
    ],
  });
  console.log(`✅ Created ${articles.count} articles\n`);

  // ─── Summary ───
  const userCount = await prisma.user.count();
  const articleCount = await prisma.article.count();

  console.log("═══════════════════════════════════════");
  console.log("📊 Seed Summary:");
  console.log(`   Users: ${userCount}`);
  console.log(`   Articles: ${articleCount}`);
  console.log("═══════════════════════════════════════\n");

  // Show a sample
  const sampleUsers = await prisma.user.findMany({
    take: 3,
    include: {
      articles: true,
    },
  });

  console.log("📋 Sample users with articles:");
  sampleUsers.forEach((user) => {
    console.log(`\n  👤 ${user.name} <${user.email}>`);
    console.log(`     📝 ${user.articles.length} article(s):`);
    user.articles.forEach((article) => {
      console.log(`        • "${article.title}"`);
    });
  });

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
