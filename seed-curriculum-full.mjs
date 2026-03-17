import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const curriculumData = [
  // No Belt (9th Kyu) - White - Curiousity
  { beltRank: 'No Belt', category: 'Striking Techniques', title: 'Front Punch', description: 'Basic straight punch delivered from the front stance.', sortOrder: 1 },
  { beltRank: 'No Belt', category: 'Striking Techniques', title: 'Reverse Punch', description: 'Powerful punch delivered from the rear hand.', sortOrder: 2 },
  { beltRank: 'No Belt', category: 'Striking Techniques', title: 'Knee Strike', description: 'Striking technique using the knee for close-range combat.', sortOrder: 3 },
  { beltRank: 'No Belt', category: 'Striking Techniques', title: 'Front Kick', description: 'Basic kick delivered straight forward with the ball of the foot.', sortOrder: 4 },
  { beltRank: 'No Belt', category: 'Defensive Techniques', title: 'Guarding Block', description: 'Basic defensive position with hands up to protect the face and body.', sortOrder: 5 },
  { beltRank: 'No Belt', category: 'Grappling', title: 'Side Fall and Back Fall', description: 'Safe falling techniques to prevent injury when thrown or knocked down.', sortOrder: 6 },
  { beltRank: 'No Belt', category: 'Combos', title: 'CB#1', description: 'Basic combination sequence of strikes.', sortOrder: 7 },
  { beltRank: 'No Belt', category: 'Self-Defense', title: 'Wrist Escape Technique', description: 'Begin by opening your hands when faced with a single wrist grab, making them slim. Pull away in the direction of the attacker\'s thumb and follow up with a strike.', sortOrder: 8 },
  { beltRank: 'No Belt', category: 'Knowledge', title: 'Willingness to Learn', description: 'A willingness to learn and grow in martial arts.', sortOrder: 9 },
  { beltRank: 'No Belt', category: 'Knowledge', title: 'Dojo Etiquette', description: 'Learn proper behavior and respect in the dojo.', sortOrder: 10 },

  // White Belt (8th Kyu) - The Beginning
  { beltRank: 'White Belt', category: 'Equipment', title: 'White Traditional MyDojo Gi (Uniform)', description: 'Required uniform for training.', sortOrder: 1 },
  { beltRank: 'White Belt', category: 'Grappling', title: 'GP#1', description: 'First grappling position and technique.', sortOrder: 2 },
  { beltRank: 'White Belt', category: 'Combos', title: 'CB#2', description: 'Second combination sequence building on CB#1.', sortOrder: 3 },
  { beltRank: 'White Belt', category: 'Sets', title: 'Blocking Set', description: 'Sequence of defensive blocking techniques.', sortOrder: 4 },
  { beltRank: 'White Belt', category: 'Knowledge', title: 'Student Creed (First 4 Lines)', description: 'Memorize and understand the first four lines of the student creed.', sortOrder: 5 },
  { beltRank: 'White Belt', category: 'Knowledge', title: 'How to Tie Your Belt', description: 'Proper technique for tying the martial arts belt.', sortOrder: 6 },
  { beltRank: 'White Belt', category: 'Knowledge', title: 'White Belt Symbolism', description: 'Understand what the white belt represents: Purity and the beginning of a journey.', sortOrder: 7 },

  // Yellow Belt (7th Kyu) - Growth
  { beltRank: 'Yellow Belt', category: 'Equipment', title: 'MyDojo Striking Gloves', description: 'Required protective equipment for striking practice.', sortOrder: 1 },
  { beltRank: 'Yellow Belt', category: 'Equipment', title: 'Mesh MyDojo Equipment Bag', description: 'Bag for storing and transporting training equipment.', sortOrder: 2 },
  { beltRank: 'Yellow Belt', category: 'Striking Techniques', title: 'Hook Punch', description: 'Circular punch targeting the side of the opponent.', sortOrder: 3 },
  { beltRank: 'Yellow Belt', category: 'Striking Techniques', title: 'Upper Cut Punch', description: 'Upward punch targeting the chin or body.', sortOrder: 4 },
  { beltRank: 'Yellow Belt', category: 'Striking Techniques', title: 'Roundhouse Kick', description: 'Circular kick delivered with the instep or shin.', sortOrder: 5 },
  { beltRank: 'Yellow Belt', category: 'Grappling', title: 'GP#2', description: 'Second grappling position and technique.', sortOrder: 6 },
  { beltRank: 'Yellow Belt', category: 'Combos', title: 'CB#3', description: 'Third combination sequence.', sortOrder: 7 },
  { beltRank: 'Yellow Belt', category: 'Self-Defense', title: 'SD#1', description: 'First self-defense technique sequence.', sortOrder: 8 },
  { beltRank: 'Yellow Belt', category: 'Sets', title: 'Blocking Set (Full) - Punching Set', description: 'Complete blocking set and introduction to punching set.', sortOrder: 9 },
  { beltRank: 'Yellow Belt', category: 'Knowledge', title: 'Yellow Belt Symbolism', description: 'Understand what the yellow belt represents: The first rays of sunlight and the beginning of growth.', sortOrder: 10 },

  // Orange Belt (6th Kyu) - Strength
  { beltRank: 'Orange Belt', category: 'Striking Techniques', title: 'Side Kick', description: 'Powerful kick delivered to the side using the heel.', sortOrder: 1 },
  { beltRank: 'Orange Belt', category: 'Striking Techniques', title: 'Back Fist Strike', description: 'Striking technique using the back of the fist.', sortOrder: 2 },
  { beltRank: 'Orange Belt', category: 'Defensive Techniques', title: 'Outward Block', description: 'Defensive block moving from inside to outside.', sortOrder: 3 },
  { beltRank: 'Orange Belt', category: 'Grappling', title: 'GP#3', description: 'Third grappling position and technique.', sortOrder: 4 },
  { beltRank: 'Orange Belt', category: 'Combos', title: 'CB#4', description: 'Fourth combination sequence.', sortOrder: 5 },
  { beltRank: 'Orange Belt', category: 'Self-Defense', title: 'SD#2', description: 'Second self-defense technique sequence.', sortOrder: 6 },
  { beltRank: 'Orange Belt', category: 'Sets', title: 'Kicking Set', description: 'Sequence of kicking techniques.', sortOrder: 7 },
  { beltRank: 'Orange Belt', category: 'Knowledge', title: 'Orange Belt Symbolism', description: 'Understand what the orange belt represents: The spreading light of dawn and growing strength.', sortOrder: 8 },

  // Green Belt (5th Kyu) - Growth & Stability
  { beltRank: 'Green Belt', category: 'Striking Techniques', title: 'Spinning Back Kick', description: 'Advanced kick delivered while spinning 360 degrees.', sortOrder: 1 },
  { beltRank: 'Green Belt', category: 'Striking Techniques', title: 'Axe Kick', description: 'Downward striking kick using the heel.', sortOrder: 2 },
  { beltRank: 'Green Belt', category: 'Defensive Techniques', title: 'Downward Block', description: 'Defensive block moving downward to protect lower body.', sortOrder: 3 },
  { beltRank: 'Green Belt', category: 'Grappling', title: 'GP#4', description: 'Fourth grappling position and technique.', sortOrder: 4 },
  { beltRank: 'Green Belt', category: 'Combos', title: 'CB#5', description: 'Fifth combination sequence.', sortOrder: 5 },
  { beltRank: 'Green Belt', category: 'Self-Defense', title: 'SD#3', description: 'Third self-defense technique sequence.', sortOrder: 6 },
  { beltRank: 'Green Belt', category: 'Forms', title: 'Basic Form 1', description: 'First traditional form (kata) sequence.', sortOrder: 7 },
  { beltRank: 'Green Belt', category: 'Knowledge', title: 'Green Belt Symbolism', description: 'Understand what the green belt represents: Growth and stability like a plant taking root.', sortOrder: 8 },

  // Advanced Green (4th Kyu)
  { beltRank: 'Advanced Green', category: 'Striking Techniques', title: 'Jump Front Kick', description: 'Front kick performed while jumping for increased height and power.', sortOrder: 1 },
  { beltRank: 'Advanced Green', category: 'Striking Techniques', title: 'Elbow Strike', description: 'Close-range striking technique using the elbow.', sortOrder: 2 },
  { beltRank: 'Advanced Green', category: 'Grappling', title: 'GP#5', description: 'Fifth grappling position and technique.', sortOrder: 3 },
  { beltRank: 'Advanced Green', category: 'Combos', title: 'CB#6', description: 'Sixth combination sequence.', sortOrder: 4 },
  { beltRank: 'Advanced Green', category: 'Self-Defense', title: 'SD#4', description: 'Fourth self-defense technique sequence.', sortOrder: 5 },
  { beltRank: 'Advanced Green', category: 'Forms', title: 'Basic Form 2', description: 'Second traditional form (kata) sequence.', sortOrder: 6 },
  { beltRank: 'Advanced Green', category: 'Knowledge', title: 'Advanced Green Symbolism', description: 'Represents continued growth and deepening understanding.', sortOrder: 7 },

  // Blue Belt (3rd Kyu) - Sky & Expansion
  { beltRank: 'Blue Belt', category: 'Striking Techniques', title: 'Flying Side Kick', description: 'Advanced aerial kick performed while jumping sideways.', sortOrder: 1 },
  { beltRank: 'Blue Belt', category: 'Striking Techniques', title: 'Ridge Hand Strike', description: 'Striking technique using the inside edge of the hand.', sortOrder: 2 },
  { beltRank: 'Blue Belt', category: 'Defensive Techniques', title: 'X-Block', description: 'Crossed-arm blocking technique for overhead attacks.', sortOrder: 3 },
  { beltRank: 'Blue Belt', category: 'Grappling', title: 'GP#6', description: 'Sixth grappling position and technique.', sortOrder: 4 },
  { beltRank: 'Blue Belt', category: 'Combos', title: 'CB#7', description: 'Seventh combination sequence.', sortOrder: 5 },
  { beltRank: 'Blue Belt', category: 'Self-Defense', title: 'SD#5', description: 'Fifth self-defense technique sequence.', sortOrder: 6 },
  { beltRank: 'Blue Belt', category: 'Forms', title: 'Intermediate Form 1', description: 'First intermediate form (kata) sequence.', sortOrder: 7 },
  { beltRank: 'Blue Belt', category: 'Knowledge', title: 'Blue Belt Symbolism', description: 'Understand what the blue belt represents: The sky and the expansion of knowledge.', sortOrder: 8 },

  // Advanced Blue (2nd Kyu)
  { beltRank: 'Advanced Blue', category: 'Striking Techniques', title: 'Tornado Kick', description: 'Complex spinning kick combining rotation and elevation.', sortOrder: 1 },
  { beltRank: 'Advanced Blue', category: 'Grappling', title: 'GP#7', description: 'Seventh grappling position and technique.', sortOrder: 2 },
  { beltRank: 'Advanced Blue', category: 'Combos', title: 'CB#8', description: 'Eighth combination sequence.', sortOrder: 3 },
  { beltRank: 'Advanced Blue', category: 'Self-Defense', title: 'SD#6', description: 'Sixth self-defense technique sequence.', sortOrder: 4 },
  { beltRank: 'Advanced Blue', category: 'Forms', title: 'Intermediate Form 2', description: 'Second intermediate form (kata) sequence.', sortOrder: 5 },
  { beltRank: 'Advanced Blue', category: 'Knowledge', title: 'Advanced Blue Symbolism', description: 'Represents mastery of intermediate techniques and preparation for advanced training.', sortOrder: 6 },

  // Purple Belt (1st Kyu) - Transition to Mastery
  { beltRank: 'Purple Belt', category: 'Striking Techniques', title: '540 Kick', description: 'Advanced spinning kick with 1.5 rotations.', sortOrder: 1 },
  { beltRank: 'Purple Belt', category: 'Grappling', title: 'GP#8', description: 'Eighth grappling position and technique.', sortOrder: 2 },
  { beltRank: 'Purple Belt', category: 'Combos', title: 'CB#9', description: 'Ninth combination sequence.', sortOrder: 3 },
  { beltRank: 'Purple Belt', category: 'Self-Defense', title: 'SD#7', description: 'Seventh self-defense technique sequence.', sortOrder: 4 },
  { beltRank: 'Purple Belt', category: 'Forms', title: 'Advanced Form 1', description: 'First advanced form (kata) sequence.', sortOrder: 5 },
  { beltRank: 'Purple Belt', category: 'Knowledge', title: 'Purple Belt Symbolism', description: 'Understand what the purple belt represents: The transition from student to master, combining red (instructor) and blue (student).', sortOrder: 6 },

  // Advanced Purple
  { beltRank: 'Advanced Purple', category: 'Striking Techniques', title: 'Advanced Combinations', description: 'Complex multi-strike combinations requiring precision and timing.', sortOrder: 1 },
  { beltRank: 'Advanced Purple', category: 'Grappling', title: 'GP#9', description: 'Ninth grappling position and technique.', sortOrder: 2 },
  { beltRank: 'Advanced Purple', category: 'Combos', title: 'CB#10', description: 'Tenth combination sequence.', sortOrder: 3 },
  { beltRank: 'Advanced Purple', category: 'Self-Defense', title: 'SD#8', description: 'Eighth self-defense technique sequence.', sortOrder: 4 },
  { beltRank: 'Advanced Purple', category: 'Forms', title: 'Advanced Form 2', description: 'Second advanced form (kata) sequence.', sortOrder: 5 },

  // Brown Belt - Maturity
  { beltRank: 'Brown Belt', category: 'Striking Techniques', title: 'Master-Level Strikes', description: 'Refinement of all striking techniques with focus on power and precision.', sortOrder: 1 },
  { beltRank: 'Brown Belt', category: 'Grappling', title: 'Advanced Grappling', description: 'Complex grappling techniques and transitions.', sortOrder: 2 },
  { beltRank: 'Brown Belt', category: 'Self-Defense', title: 'Multiple Attacker Defense', description: 'Techniques for defending against multiple opponents.', sortOrder: 3 },
  { beltRank: 'Brown Belt', category: 'Forms', title: 'Master Form 1', description: 'First master-level form (kata) sequence.', sortOrder: 4 },
  { beltRank: 'Brown Belt', category: 'Knowledge', title: 'Brown Belt Symbolism', description: 'Understand what the brown belt represents: Maturity and ripening of skills like autumn leaves.', sortOrder: 5 },

  // Advanced Brown
  { beltRank: 'Advanced Brown', category: 'Striking Techniques', title: 'Weapon Defense', description: 'Techniques for defending against armed attackers.', sortOrder: 1 },
  { beltRank: 'Advanced Brown', category: 'Grappling', title: 'Ground Fighting', description: 'Advanced ground fighting and submission techniques.', sortOrder: 2 },
  { beltRank: 'Advanced Brown', category: 'Forms', title: 'Master Form 2', description: 'Second master-level form (kata) sequence.', sortOrder: 3 },
  { beltRank: 'Advanced Brown', category: 'Knowledge', title: 'Teaching Fundamentals', description: 'Learn how to teach and demonstrate techniques to lower ranks.', sortOrder: 4 },

  // Probationary Black
  { beltRank: 'Probationary Black', category: 'Knowledge', title: 'Black Belt Philosophy', description: 'Understanding the responsibilities and mindset of a black belt.', sortOrder: 1 },
  { beltRank: 'Probationary Black', category: 'Knowledge', title: 'Leadership Training', description: 'Developing leadership skills to guide and mentor other students.', sortOrder: 2 },
  { beltRank: 'Probationary Black', category: 'Forms', title: 'Black Belt Form', description: 'Master-level form demonstrating complete technical proficiency.', sortOrder: 3 },
  { beltRank: 'Probationary Black', category: 'Knowledge', title: 'Teaching Practicum', description: 'Practical experience teaching classes under supervision.', sortOrder: 4 },

  // Black Belt 1st Dan
  { beltRank: 'Black Belt 1st Dan', category: 'Knowledge', title: 'Advanced Philosophy', description: 'Deep understanding of martial arts philosophy and principles.', sortOrder: 1 },
  { beltRank: 'Black Belt 1st Dan', category: 'Knowledge', title: 'Curriculum Development', description: 'Creating and refining training programs for students.', sortOrder: 2 },
  { beltRank: 'Black Belt 1st Dan', category: 'Knowledge', title: 'Mentorship', description: 'Guiding lower-ranked students on their martial arts journey.', sortOrder: 3 },
];

async function seedCurriculum() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Starting full curriculum seed...');
    
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
    console.log('\n✅ Full curriculum seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Curriculum seed failed:', error);
    process.exit(1);
  });
