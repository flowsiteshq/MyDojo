export interface SocialPost {
  id: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  user: string;
  aspectRatio: "square" | "portrait" | "landscape";
}

export const socialFeed: SocialPost[] = [
  {
    id: "1",
    image: "/images/social/instagram-post-1.webp",
    caption: "Master discipline, focus, and toughness in our martial arts community. 🥋✨ #MyDojo #MartialArts #Community",
    likes: 124,
    comments: 12,
    user: "@mydojo",
    aspectRatio: "square",
  },
  {
    id: "2",
    image: "/images/social/instagram-post-2.webp",
    caption: "Focus. Power. Breakthrough. 💥 Incredible focus from our students today! #MyDojo #Focus #Training",
    likes: 256,
    comments: 34,
    user: "@mydojo",
    aspectRatio: "square",
  },
  {
    id: "3",
    image: "/images/social/instagram-post-3.webp",
    caption: "Sweat equity. 💪 Crushing goals one class at a time. #MyDojo #FitnessGoals #Kickboxing",
    likes: 189,
    comments: 21,
    user: "@mydojo",
    aspectRatio: "square",
  },
  {
    id: "4",
    image: "/images/social/instagram-post-4.webp",
    caption: "Guidance every step of the way. Dedicated to your success. 🙏 #MyDojo #Mentorship #MartialArts",
    likes: 145,
    comments: 8,
    user: "@mydojo",
    aspectRatio: "square",
  },
  {
    id: "5",
    image: "/images/social/instagram-post-5.webp",
    caption: "Post-class vibes! ✌️ Love the energy of our community. #MyDojo #MartialArts #Community",
    likes: 210,
    comments: 28,
    user: "@mydojo",
    aspectRatio: "square",
  },
  {
    id: "6",
    image: "/images/social/instagram-post-6.webp",
    caption: "Hard work pays off. Congratulations to all our students! 🎉🥋 #MyDojo #Achievement #Success",
    likes: 342,
    comments: 56,
    user: "@mydojo",
    aspectRatio: "square",
  },
];
