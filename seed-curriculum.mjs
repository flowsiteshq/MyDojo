import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const curriculumData = [
  // No Belt (9th Kyu) - White - Curiousity
  {
    beltRank: 'No Belt',
    category: 'Striking Techniques',
    title: 'Front Punch',
    description: 'Basic straight punch delivered from the front stance.',
    sortOrder: 1
  },
  {
    beltRank: 'No Belt',
    category: 'Striking Techniques',
    title: 'Reverse Punch',
    description: 'Powerful punch delivered from the rear hand.',
    sortOrder: 2
  },
  {
    beltRank: 'No Belt',
    category: 'Striking Techniques',
    title: 'Knee Strike',
    description: 'Striking technique using the knee for close-range combat.',
    sortOrder: 3
  },
  {
    beltRank: 'No Belt',
    category: 'Striking Techniques',
    title: 'Front Kick',
    description: 'Basic kick delivered straight forward with the ball of the foot.',
    sortOrder: 4
  },
  {
    beltRank: 'No Belt',
    category: 'Defensive Techniques',
    title: 'Guarding Block',
    description: 'Basic defensive position with hands up to protect the face and body.',
    sortOrder: 5
  },
  {
    beltRank: 'No Belt',
    category: 'Grappling',
    title: 'Side Fall and Back Fall',
    description: 'Safe falling techniques to prevent injury when thrown or knocked down.',
    sortOrder: 6
  },
  {
    beltRank: 'No Belt',
    category: 'Combos',
    title: 'CB#1',
    description: 'Basic combination sequence of strikes.',
    sortOrder: 7
  },
  {
    beltRank: 'No Belt',
    category: 'Self-Defense',
    title: 'Wrist Escape Technique',
    description: 'Begin by opening your hands when faced with a single wrist grab, making them slim. Pull away in the direction of the attacker\'s thumb and follow up with a strike.',
    sortOrder: 8
  },
  {
    beltRank: 'No Belt',
    category: 'Knowledge',
    title: 'Willingness to Learn',
    description: 'A willingness to learn and grow in martial arts.',
    sortOrder: 9
  },
  {
    beltRank: 'No Belt',
    category: 'Knowledge',
    title: 'Dojo Etiquette',
    description: 'Learn proper behavior and respect in the dojo.',
    sortOrder: 10
  },

  // White Belt (8th Kyu) - The Beginning
  {
    beltRank: 'White Belt',
    category: 'Equipment',
    title: 'White Traditional MyDojo Gi (Uniform)',
    description: 'Required uniform for training.',
    sortOrder: 1
  },
  {
    beltRank: 'White Belt',
    category: 'Grappling',
    title: 'GP#1',
    description: 'First grappling position and technique.',
    sortOrder: 2
  },
  {
    beltRank: 'White Belt',
    category: 'Combos',
    title: 'CB#2',
    description: 'Second combination sequence building on CB#1.',
    sortOrder: 3
  },
  {
    beltRank: 'White Belt',
    category: 'Sets',
    title: 'Blocking Set',
    description: 'Sequence of defensive blocking techniques.',
    sortOrder: 4
  },
  {
    beltRank: 'White Belt',
    category: 'Knowledge',
    title: 'Student Creed (First 4 Lines)',
    description: 'Memorize and understand the first four lines of the student creed.',
    sortOrder: 5
  },
  {
    beltRank: 'White Belt',
    category: 'Knowledge',
    title: 'How to Tie Your Belt',
    description: 'Proper technique for tying the martial arts belt.',
    sortOrder: 6
  },
  {
    beltRank: 'White Belt',
    category: 'Knowledge',
    title: 'White Belt Symbolism',
    description: 'Understand what the white belt represents: Purity and the beginning of a journey.',
    sortOrder: 7
  },

  // Yellow Belt (7th Kyu)
  {
    beltRank: 'Yellow Belt',
    category: 'Equipment',
    title: 'MyDojo Striking Gloves',
    description: 'Required protective equipment for striking practice.',
    sortOrder: 1
  },
  {
    beltRank: 'Yellow Belt',
    category: 'Striking Techniques',
    title: 'Jab',
    description: 'Quick, straight punch from the lead hand.',
    sortOrder: 2
  },
  {
    beltRank: 'Yellow Belt',
    category: 'Striking Techniques',
    title: 'Cross',
    description: 'Powerful straight punch from the rear hand.',
    sortOrder: 3
  },
  {
    beltRank: 'Yellow Belt',
    category: 'Striking Techniques',
    title: 'Roundhouse Kick',
    description: 'Circular kick delivered with the instep or shin.',
    sortOrder: 4
  },
  {
    beltRank: 'Yellow Belt',
    category: 'Defensive Techniques',
    title: 'Inward Block',
    description: 'Defensive block moving from outside to inside.',
    sortOrder: 5
  },
  {
    beltRank: 'Yellow Belt',
    category: 'Grappling',
    title: 'GP#2',
    description: 'Second grappling position and technique.',
    sortOrder: 6
  },
  {
    beltRank: 'Yellow Belt',
    category: 'Combos',
    title: 'CB#3',
    description: 'Third combination sequence.',
    sortOrder: 7
  },
  {
    beltRank: 'Yellow Belt',
    category: 'Knowledge',
    title: 'Yellow Belt Symbolism',
    description: 'Understand what the yellow belt represents: The first rays of sunlight and the beginning of knowledge.',
    sortOrder: 8
  },

  // Orange Belt (6th Kyu)
  {
    beltRank: 'Orange Belt',
    category: 'Striking Techniques',
    title: 'Hook Punch',
    description: 'Circular punch targeting the side of the opponent.',
    sortOrder: 1
  },
  {
    beltRank: 'Orange Belt',
    category: 'Striking Techniques',
    title: 'Side Kick',
    description: 'Powerful kick delivered to the side using the heel.',
    sortOrder: 2
  },
  {
    beltRank: 'Orange Belt',
    category: 'Defensive Techniques',
    title: 'Outward Block',
    description: 'Defensive block moving from inside to outside.',
    sortOrder: 3
  },
  {
    beltRank: 'Orange Belt',
    category: 'Grappling',
    title: 'GP#3',
    description: 'Third grappling position and technique.',
    sortOrder: 4
  },
  {
    beltRank: 'Orange Belt',
    category: 'Combos',
    title: 'CB#4',
    description: 'Fourth combination sequence.',
    sortOrder: 5
  },
  {
    beltRank: 'Orange Belt',
    category: 'Self-Defense',
    title: 'Bear Hug Defense',
    description: 'Techniques to escape from a bear hug attack.',
    sortOrder: 6
  },
  {
    beltRank: 'Orange Belt',
    category: 'Knowledge',
    title: 'Orange Belt Symbolism',
    description: 'Understand what the orange belt represents: The spreading light of dawn and growing strength.',
    sortOrder: 7
  },
];

async function seedCurriculum() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Starting curriculum seed...');
    
    // Clear existing curriculum data
    await connection.execute('DELETE FROM curriculumContent');
    console.log('Cleared existing curriculum data');
    
    // Insert new curriculum data
    for (const item of curriculumData) {
      await connection.execute(
        `INSERT INTO curriculumContent (beltRank, category, title, description, sortOrder, isPublished, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [item.beltRank, item.category, item.title, item.description, item.sortOrder]
      );
    }
    
    console.log(`Successfully seeded ${curriculumData.length} curriculum items`);
    
    // Display summary
    const [rows] = await connection.execute(
      'SELECT beltRank, COUNT(*) as count FROM curriculumContent GROUP BY beltRank ORDER BY beltRank'
    );
    console.log('\nCurriculum summary by belt:');
    console.table(rows);
    
  } catch (error) {
    console.error('Error seeding curriculum:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedCurriculum()
  .then(() => {
    console.log('\n✅ Curriculum seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Curriculum seed failed:', error);
    process.exit(1);
  });
