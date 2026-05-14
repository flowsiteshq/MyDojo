export interface ClassSession {
  time: string;
  name: string;
  ageGroup: string;
  instructor?: string;
}

export interface DaySchedule {
  day: string;
  classes: ClassSession[];
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hours: string[];
  distance?: number; // Distance in miles
  description?: string;
  image?: string;
  schedule?: DaySchedule[];
  timezone?: string;
  isAffiliate?: boolean;
  affiliateNote?: string;
}

export const locations: Location[] = [
  {
    id: "yaegers-sda",
    name: "Yaeger's Self Defense of America",
    address: "306 East Pasadena Blvd",
    city: "Deer Park",
    state: "TX",
    zip: "77536",
    phone: "(281) 479-3880",
    coordinates: {
      lat: 29.7052,
      lng: -95.1241
    },
    timezone: "America/Chicago",
    hours: [
      "Mon–Fri: 5:30 PM – 9:15 PM",
      "Tue & Thu: 1:30 PM – 2:15 PM (Mommy & Me)",
      "Sat–Sun: Tournaments & Special Events"
    ],
    description: "Yaeger's Self Defense of America is a proud affiliate dojo of MyDojo Martial Arts & Fitness, located in Deer Park, TX. Founded by Grand Master Chris Yaeger — a Hall of Famer with over 45 years of experience and trusted by multiple law enforcement agencies — Yaeger's SDA offers a blended martial arts and self-defense program for kids, teens, and adults focused on delivering real-life skills and real-world defense measures.",
    isAffiliate: true,
    affiliateNote: "Affiliate Dojo",
    schedule: [
      {
        day: "Monday",
        classes: [
          { time: "5:00 PM", name: "Intermediate Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Beginner Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Fitness Kickboxing (Early)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Fitness Kickboxing (Evening)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Teen Warriors / Adult Beginners", ageGroup: "Ages 12+", instructor: "Grand Master Chris Yaeger" }
        ]
      },
      {
        day: "Tuesday",
        classes: [
          { time: "1:30 PM", name: "Mommy & Me / Little Ninjas", ageGroup: "Ages 4–5", instructor: "Grand Master Chris Yaeger" },
          { time: "5:00 PM", name: "Beginner Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Intermediate Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Fitness Kickboxing (Early)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Advanced Teen Warriors / Adult", ageGroup: "Ages 12+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Fitness Kickboxing (Evening)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "8:15 PM", name: "Thai Kickboxing", ageGroup: "Ages 14+", instructor: "Grand Master Chris Yaeger" }
        ]
      },
      {
        day: "Wednesday",
        classes: [
          { time: "5:00 PM", name: "Intermediate Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Beginner Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Fitness Kickboxing (Early)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Fitness Kickboxing (Evening)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Teen Warriors / Adult Beginners", ageGroup: "Ages 12+", instructor: "Grand Master Chris Yaeger" }
        ]
      },
      {
        day: "Thursday",
        classes: [
          { time: "1:30 PM", name: "Mommy & Me / Little Ninjas", ageGroup: "Ages 4–5", instructor: "Grand Master Chris Yaeger" },
          { time: "5:00 PM", name: "Beginner Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Intermediate Dragon Kids", ageGroup: "Ages 6–11", instructor: "Grand Master Chris Yaeger" },
          { time: "6:00 PM", name: "Fitness Kickboxing (Early)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Advanced Teen Warriors / Adult", ageGroup: "Ages 12+", instructor: "Grand Master Chris Yaeger" },
          { time: "7:00 PM", name: "Fitness Kickboxing (Evening)", ageGroup: "Ages 16+", instructor: "Grand Master Chris Yaeger" },
          { time: "8:15 PM", name: "Thai Kickboxing", ageGroup: "Ages 14+", instructor: "Grand Master Chris Yaeger" }
        ]
      },
      {
        day: "Friday",
        classes: [
          { time: "TBA", name: "Competition Team", ageGroup: "All Ages", instructor: "Grand Master Chris Yaeger" }
        ]
      }
    ]
  },
  {
    id: "nokc-belle-chasse",
    name: "New Orleans Karate Club - Belle Chasse",
    address: "1510 LA-406, 2nd Floor",
    city: "Belle Chasse",
    state: "LA",
    zip: "70037",
    phone: "(504) 391-7200",
    coordinates: {
      lat: 29.8574,
      lng: -90.0004
    },
    timezone: "America/Chicago",
    hours: [
      "Mon–Fri: 12:00 PM – 9:00 PM",
      "Sat–Sun: Closed"
    ],
    description: "New Orleans Karate Club Belle Chasse is a proud affiliate dojo of MyDojo Martial Arts & Fitness. Founded in 1999 by Burton and Nancy Maben, NOKC is the premier family martial arts training center in the New Orleans metropolitan area. With decades of experience, they offer traditional karate, kickboxing, and self-defense programs for all ages — from Lil' Dragons (ages 3+) to adult competition teams — with a strong emphasis on character development, leadership, and community service.",
    isAffiliate: true,
    affiliateNote: "Affiliate Dojo",
    schedule: [
      {
        day: "Monday",
        classes: [
          { time: "12:00 PM", name: "Executive Fitness", ageGroup: "Adults" },
          { time: "4:00 PM", name: "Lil' Dragons / Tiny Tigers", ageGroup: "Ages 3–6" },
          { time: "5:00 PM", name: "Superkids", ageGroup: "Ages 7–12" },
          { time: "6:00 PM", name: "Teen / Adult Karate", ageGroup: "Ages 13+" },
          { time: "7:00 PM", name: "Advanced / Black Belt", ageGroup: "Advanced Students" }
        ]
      },
      {
        day: "Tuesday",
        classes: [
          { time: "12:00 PM", name: "Executive Fitness", ageGroup: "Adults" },
          { time: "4:00 PM", name: "Lil' Dragons / Tiny Tigers", ageGroup: "Ages 3–6" },
          { time: "5:00 PM", name: "Superkids", ageGroup: "Ages 7–12" },
          { time: "6:00 PM", name: "Teen / Adult Karate", ageGroup: "Ages 13+" },
          { time: "7:00 PM", name: "Kickboxing / MMA", ageGroup: "Adults" }
        ]
      },
      {
        day: "Wednesday",
        classes: [
          { time: "12:00 PM", name: "Executive Fitness", ageGroup: "Adults" },
          { time: "4:00 PM", name: "Lil' Dragons / Tiny Tigers", ageGroup: "Ages 3–6" },
          { time: "5:00 PM", name: "Superkids", ageGroup: "Ages 7–12" },
          { time: "6:00 PM", name: "Teen / Adult Karate", ageGroup: "Ages 13+" },
          { time: "7:00 PM", name: "Advanced / Black Belt", ageGroup: "Advanced Students" }
        ]
      },
      {
        day: "Thursday",
        classes: [
          { time: "12:00 PM", name: "Executive Fitness", ageGroup: "Adults" },
          { time: "4:00 PM", name: "Lil' Dragons / Tiny Tigers", ageGroup: "Ages 3–6" },
          { time: "5:00 PM", name: "Superkids", ageGroup: "Ages 7–12" },
          { time: "6:00 PM", name: "Teen / Adult Karate", ageGroup: "Ages 13+" },
          { time: "7:00 PM", name: "Kickboxing / MMA", ageGroup: "Adults" }
        ]
      },
      {
        day: "Friday",
        classes: [
          { time: "12:00 PM", name: "Executive Fitness", ageGroup: "Adults" },
          { time: "4:00 PM", name: "Lil' Dragons / Tiny Tigers", ageGroup: "Ages 3–6" },
          { time: "5:00 PM", name: "Superkids", ageGroup: "Ages 7–12" },
          { time: "6:00 PM", name: "Teen / Adult Karate", ageGroup: "Ages 13+" }
        ]
      }
    ]
  },
  {
    id: "hq",
    name: "MyDojo Headquarters - Tomball",
    address: "11721 Spring Cypress Rd",
    city: "Tomball",
    state: "TX",
    zip: "77377",
    phone: "(877) 4-MYDOJO",
    coordinates: {
      lat: 30.0112706,
      lng: -95.6025971
    },
    timezone: "America/Chicago",
    hours: [
      "Mon-Thu: 12:00 PM - 9:00 PM",
      "Fri: 12:00 PM - 8:00 PM",
      "Sat: 9:00 AM - 2:00 PM",
      "Sun: Closed"
    ],
    description: "Our headquarters in Tomball features a state-of-the-art facility with over 5,000 sq ft of training space, professional mats, and a dedicated viewing area for parents.",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QCDmgxbjdlfUOCPT.jpg",
    schedule: [
      {
        day: "Monday",
        classes: [
          { time: "12:00 PM", name: "Kickboxing (Dojo 2)", ageGroup: "Ages 18+" },
          { time: "12:00 PM", name: "Dragon Kids & Teens", ageGroup: "Ages 5-17" },
          { time: "4:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "5:00 PM", name: "Little Ninjas", ageGroup: "Ages 3-5" },
          { time: "5:00 PM", name: "Intro Class", ageGroup: "New Students" },
          { time: "6:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "7:00 PM", name: "Teens & Adults", ageGroup: "Ages 12+" }
        ]
      },
      {
        day: "Tuesday",
        classes: [
          { time: "4:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "5:00 PM", name: "Little Ninjas", ageGroup: "Ages 3-5" },
          { time: "5:00 PM", name: "Intro Class", ageGroup: "New Students" },
          { time: "6:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "7:00 PM", name: "Teens & Adults", ageGroup: "Ages 12+" }
        ]
      },
      {
        day: "Wednesday",
        classes: [
          { time: "12:00 PM", name: "Kickboxing (Dojo 2)", ageGroup: "Ages 18+" },
          { time: "12:00 PM", name: "Dragon Kids & Teens", ageGroup: "Ages 5-17" },
          { time: "2:00 PM", name: "Little Ninjas & Me", ageGroup: "Ages 3-5" },
          { time: "4:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "5:00 PM", name: "Little Ninjas", ageGroup: "Ages 3-5" },
          { time: "5:00 PM", name: "Intro Class", ageGroup: "New Students" },
          { time: "6:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "7:00 PM", name: "Teens & Adults", ageGroup: "Ages 12+" }
        ]
      },
      {
        day: "Thursday",
        classes: [
          { time: "12:00 PM", name: "Women's Self-Defense", ageGroup: "Women 18+" },
          { time: "4:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "5:00 PM", name: "Little Ninjas", ageGroup: "Ages 3-5" },
          { time: "5:00 PM", name: "Intro Class", ageGroup: "New Students" },
          { time: "6:00 PM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "7:00 PM", name: "Teens & Adults", ageGroup: "Ages 12+" }
        ]
      },
      {
        day: "Friday",
        classes: [
          { time: "12:00 PM", name: "Kickboxing (Dojo 2)", ageGroup: "Ages 18+" },
          { time: "12:00 PM", name: "Dragon Kids & Teens", ageGroup: "Ages 5-17" },
          { time: "2:00 PM", name: "Little Ninjas & Me", ageGroup: "Ages 3-5" },
          { time: "5:00 PM", name: "Leadership", ageGroup: "Advanced Students" },
          { time: "6:00 PM", name: "Sparring", ageGroup: "Advanced Students" },
          { time: "7:00 PM", name: "Weapons Class", ageGroup: "Advanced Students" }
        ]
      },
      {
        day: "Saturday",
        classes: [
          { time: "8:00 AM", name: "Instructor Training", ageGroup: "Instructors Only" },
          { time: "9:00 AM", name: "Kickboxing (Dojo 2)", ageGroup: "Ages 18+" },
          { time: "10:00 AM", name: "Little Ninjas", ageGroup: "Ages 3-5" },
          { time: "10:45 AM", name: "Dragon Kids", ageGroup: "Ages 5-12" },
          { time: "11:30 AM", name: "Family Class", ageGroup: "All Ages" },
          { time: "12:15 PM", name: "Teen Warriors", ageGroup: "Ages 12-17" },
          { time: "1:00 PM", name: "Demo/Competition Team", ageGroup: "Competition Team" }
        ]
      }
    ]
  }
];
