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
    name: "Yaeger's SDA",
    address: "306 East Pasadena Blvd",
    city: "Deer Park",
    state: "TX",
    zip: "77536",
    phone: "",
    coordinates: {
      lat: 29.7052,
      lng: -95.1241
    },
    timezone: "America/Chicago",
    hours: [],
    description: "Yaeger's SDA is a proud affiliate dojo of MyDojo Martial Arts & Fitness, located in Deer Park, TX.",
    isAffiliate: true,
    affiliateNote: "Affiliate Dojo"
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
