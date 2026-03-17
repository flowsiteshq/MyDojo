export interface Program {
  id: string;
  title: string;
  ages: string;
  duration: string;
  image: string;
  description: string;
  longDescription: string;
  benefits: string[];
  features: string[];
  schedule: string;
}

export const programs: Program[] = [
  {
    id: "little-ninjas",
    title: "Little Ninjas",
    ages: "Ages 3-5",
    duration: "30 Minutes",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/CRAvhHhQitQViikb.jpg",
    description: "The Little Ninjas Program is a \"stealthy\" way to teach children life skills. These skills will help them enter society with a more confident and enthusiastic outlook.",
    longDescription: "Our Little Ninjas program is specifically designed for preschool-aged children. Through fun, game-based learning, we introduce the fundamentals of martial arts while focusing on essential life skills. We understand that children at this age learn best through play, so our classes are high-energy and engaging. Your child will learn to follow directions, interact with peers, and develop coordination and balance, all while having a blast.",
    benefits: [
      "Builds integrity and character",
      "Creates better listeners at home",
      "Improves focus at school",
      "Enhances positive development",
      "Fun and motivating environment"
    ],
    features: [
      "Age-appropriate curriculum",
      "Positive reinforcement",
      "Safety awareness",
      "Motor skill development",
      "Social interaction"
    ],
    schedule: "Classes available weekday afternoons and Saturday mornings."
  },
  {
    id: "core-kids",
    title: "Dragon Kids",
    ages: "Ages 5-12",
    duration: "45 Minutes",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/jRfpjBmwhTaRoIDg.jpg",
    description: "The perfect way to give your kids confidence and improve their self-discipline. Our program teaches your child the life skills of self-defense, which can help them feel more at ease while facing the challenges of growing up.",
    longDescription: "The Dragon Kids program is the heart of our youth curriculum. We combine traditional martial arts values with modern teaching techniques to help children excel in all areas of life. Students learn goal setting through our belt ranking system, perseverance by mastering difficult techniques, and respect for themselves and others. This program is not just about kicking and punching; it's about building strong, capable, and resilient children.",
    benefits: [
      "Proven karate techniques",
      "Emphasis on safety and fun",
      "Strengthens mind and body",
      "Improves stress management",
      "Reduces ADD symptoms"
    ],
    features: [
      "Self-defense techniques",
      "Bully prevention strategies",
      "Leadership opportunities",
      "Fitness and conditioning",
      "Focus and concentration drills"
    ],
    schedule: "Classes available daily after school."
  },
  {
    id: "teens",
    title: "Teens",
    ages: "Ages 12-17",
    duration: "60 Minutes",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/brTVNDgpgOhyLKAj.jpg",
    description: "Most teens see the value of things and realize that active fitness will improve their quality of life. Studying martial arts has been shown to aid in developing the body physically and mentally.",
    longDescription: "Our Teen program provides a constructive outlet for energy and a supportive community where teenagers can thrive. We focus on practical self-defense, physical fitness, and mental toughness. In an age of digital distractions, our dojo offers a place to disconnect and focus on personal growth. Teens learn to handle peer pressure, manage stress, and build a physique they can be proud of.",
    benefits: [
      "Muscular Development & Toning",
      "Cardiovascular Conditioning",
      "Flexibility & Agility",
      "Self-Defense Skills",
      "Stress Relief"
    ],
    features: [
      "MMA-style training",
      "High-intensity workouts",
      "Real-world self-defense",
      "Confidence building",
      "Peer support network"
    ],
    schedule: "Evening classes available."
  },
  {
    id: "adult-karate",
    title: "Adult Karate",
    ages: "Ages 18+",
    duration: "60 Minutes",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg",
    description: "Traditional martial arts training focused on discipline, self-defense, and personal growth. Learn authentic karate techniques while building strength, confidence, and mental fortitude.",
    longDescription: "Our Adult Karate program offers traditional martial arts training with a modern approach. Perfect for those seeking discipline, self-defense skills, and a structured path to personal development. You'll learn authentic karate techniques, forms (kata), and practical self-defense applications. This program emphasizes respect, focus, and continuous improvement through our belt ranking system.",
    benefits: [
      "Traditional karate techniques",
      "Structured belt progression",
      "Self-defense mastery",
      "Mental discipline",
      "Builds confidence"
    ],
    features: [
      "Forms and kata training",
      "Practical self-defense",
      "Belt ranking system",
      "Mind-body connection",
      "Respectful community"
    ],
    schedule: "Morning and evening classes available."
  },
  {
    id: "kickboxing",
    title: "Kickboxing",
    ages: "Ages 18+",
    duration: "45 Minutes",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BRDAWpxDTQGxESXr.jpg",
    description: "High-energy cardio workout with music and hex lights! Burn up to 800 calories in 45 minutes while learning real kickboxing techniques. Fun, intense, and incredibly effective.",
    longDescription: "Our Kickboxing program is where fitness meets fun! Set to energizing music with dynamic hex lights creating an electric atmosphere, you'll punch and kick your way to the best shape of your life. This high-intensity workout combines authentic kickboxing techniques with cardio conditioning to torch calories and build lean muscle. No experience needed – just bring your energy and we'll handle the rest!",
    benefits: [
      "Burn up to 800 calories",
      "High-energy atmosphere",
      "Music and hex lights",
      "Full-body workout",
      "Stress relief"
    ],
    features: [
      "Intense bag workouts",
      "Partner pad drills",
      "Energizing music",
      "Dynamic lighting",
      "All fitness levels welcome"
    ],
    schedule: "Evening classes with music and lights."
  },
  {
    id: "summer-camp",
    title: "Summer Camp",
    ages: "Ages 5-12",
    duration: "Full Day",
    image: "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/aJCC6iMT7oE7yJNKA3cHCA-img-1_1771516020000_na1fn_c3VtbWVyLWNhbXAta2lkcy1tYXJ0aWFsLWFydHM.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L2FKQ0M2aU1UN29FN3lKTktBM2NIQ0EtaW1nLTFfMTc3MTUxNjAyMDAwMF9uYTFmbl9jM1Z0YldWeUxXTmhiWEF0YTJsa2N5MXRZWEowYVdGc0xXRnlkSE0uanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=c8wQAZEqMKO4kImtn2XhWQOWw83UGBY-NADAbLiDoqLBM~T8AdxrFTjayrIaj9QetUIC5co4hr5UNdhxTgW4xOCzZntOUWdt6pHQ-y3hkwyHtVd58PzgZ6myxGJskGuXQ-wMZ-W4YnUwiIndMVcXOP44dyU9o8PUoZPDA33pslBaNlOzxODaIoVuP5Rxi0l4t8bCwHqRuW-5MxHEquZOIBlRK1TepuTNVSG5NOa2rCx6zHurwWbiBT3XBhG6us7cRHAIOn0vzOt9wddudZ165Vb2M3JT0NXeLTSrnCnNKiMkeZIF441ENCeYLzIDvnrNPn6hMPvC7LDzC4x~vjaXdA__",
    description: "Action-packed summer camp combining martial arts training, outdoor activities, field trips, and character development. A safe, fun environment where kids make friends and create lasting memories.",
    longDescription: "Our Summer Camp program transforms summer break into an adventure! Each week features martial arts training, exciting field trips, outdoor games, swimming, and character-building activities. Kids develop confidence, make new friends, and stay active all summer long. With certified instructors and a structured schedule, parents get peace of mind while kids have the time of their lives.",
    benefits: [
      "Full-day supervision",
      "Martial arts training",
      "Weekly field trips",
      "Character development",
      "New friendships"
    ],
    features: [
      "Martial arts classes",
      "Swimming & outdoor games",
      "Educational field trips",
      "Healthy snacks & lunch",
      "Certified staff"
    ],
    schedule: "Summer weeks, Monday - Friday 9 AM - 3 PM."
  },
  {
    id: "after-school",
    title: "After School",
    ages: "Ages 5-12",
    duration: "3 Hours",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ZCQGReaYeOoQyxkc.jpg",
    description: "We understand that parents have busy schedules. At select MyDojo locations, we provide transportation for children from their school to our facility.",
    longDescription: "Our After School program is the ultimate alternative to daycare. We pick your child up from school and bring them to a safe, positive environment where they can be productive. The afternoon includes dedicated homework time, a healthy snack, and a full martial arts class. It's peace of mind for parents and a fun, growth-oriented afternoon for kids.",
    benefits: [
      "Transportation from school",
      "Coverage on Teacher Work Days",
      "Daily structured martial arts",
      "Life skills & anti-bullying",
      "Homework time"
    ],
    features: [
      "Safe transportation",
      "Homework assistance",
      "Character development",
      "Physical activity",
      "Socialization"
    ],
    schedule: "Monday - Friday until 6:30 PM."
  }
];
