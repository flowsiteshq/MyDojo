import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DATABASE_URL);

const kihonKatas = [
  {
    beltRank: "Yellow Belt",
    category: "Forms",
    title: "Kihon Kata (Basic H) — First Half",
    description:
      "The first half of Kihon Kata, also known as Basic H, introduces students to their first formal kata sequence. The 'H' pattern refers to the floor pattern traced during the form — two parallel lines connected by a center line, resembling the letter H. In this first half, students learn the ready stance (yoi), the initial downward block (gedan-barai) stepping into front stance (zenkutsu-dachi), and the first series of stepping punches (oi-zuki) moving forward and backward along the vertical lines of the H. Emphasis is placed on proper stance width and depth, synchronized arm and leg movement, and crisp technique execution. Mastery of the first half is required to advance to Orange Belt.",
    sortOrder: 8,
  },
  {
    beltRank: "Orange Belt",
    category: "Forms",
    title: "Kihon Kata (Basic H) — Complete Form",
    description:
      "The complete Kihon Kata (Basic H) is the first full kata requirement in the MyDojo curriculum. Building on the first half learned at Yellow Belt, students now add the horizontal crossbar of the H pattern — stepping across the center line with a downward block, executing stepping punches across, then returning. The complete form finishes with a return to the starting point and a closing yame (finish). Students must demonstrate the full kata with proper zanshin (awareness), strong stances, sharp techniques, and correct breathing. Full mastery and clean execution of Kihon Kata is required to advance to Green Belt.",
    sortOrder: 8,
  },
];

console.log("Inserting Kihon Kata entries...");

let inserted = 0;
let skipped = 0;

for (const kata of kihonKatas) {
  const [existing] = await db.execute(
    "SELECT id FROM curriculumContent WHERE title = ? AND beltRank = ?",
    [kata.title, kata.beltRank]
  );
  if (existing.length > 0) {
    console.log(`  ⏭  Skipping (already exists): [${kata.beltRank}] ${kata.title}`);
    skipped++;
    continue;
  }

  await db.execute(
    `INSERT INTO curriculumContent (beltRank, category, title, description, sortOrder, isPublished)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [kata.beltRank, kata.category, kata.title, kata.description, kata.sortOrder]
  );
  console.log(`  ✅ Inserted: [${kata.beltRank}] ${kata.title}`);
  inserted++;
}

console.log(`\nDone! ${inserted} entries inserted, ${skipped} skipped.`);
await db.end();
