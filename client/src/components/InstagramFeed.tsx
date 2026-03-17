import { motion } from "framer-motion";
import { Instagram, Heart, MessageCircle } from "lucide-react";

const posts = [
  {
    id: 1,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/CRAvhHhQitQViikb.jpg",
    likes: 124,
    comments: 18,
    caption: "Our Little Ninjas earning their stripes today! 🥋 #MyDojo #LittleNinjas #MartialArtsKids"
  },
  {
    id: 2,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BRDAWpxDTQGxESXr.jpg",
    likes: 89,
    comments: 12,
    caption: "Sweat equity. Adult Kickboxing class crushing it this morning. 💪 #FitnessGoals #Kickboxing"
  },
  {
    id: 3,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/fuSBokvVxpbpQKpP.png",
    likes: 256,
    comments: 45,
    caption: "What an amazing turnout for our annual belt ceremony! So proud of everyone. 🏆 #BlackBeltExcellence"
  },
  {
    id: 4,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/jRfpjBmwhTaRoIDg.jpg",
    likes: 167,
    comments: 23,
    caption: "Focus. Discipline. Respect. Building the leaders of tomorrow. 🌟 #CoreKids #MartialArtsLife"
  }
];

export default function InstagramFeed() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-black">
              FOLLOW THE <span className="text-primary">ACTION</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-xl">
              Join our community online. See daily training clips, student spotlights, and dojo updates.
            </p>
          </div>
          <a 
            href="https://www.instagram.com/mydojo/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 text-black font-bold uppercase tracking-wider hover:text-primary transition-colors mt-6 md:mt-0"
          >
            <Instagram className="h-5 w-5" />
            @mydojo
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative aspect-square overflow-hidden cursor-pointer bg-gray-100"
            >
              <img 
                src={post.image} 
                alt={post.caption} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-white p-6 text-center">
                <div className="flex gap-6 mb-4">
                  <span className="flex items-center gap-2 font-bold">
                    <Heart className="h-5 w-5 fill-white" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-2 font-bold">
                    <MessageCircle className="h-5 w-5 fill-white" /> {post.comments}
                  </span>
                </div>
                <p className="text-sm line-clamp-3 font-medium">
                  {post.caption}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <a 
            href="https://www.instagram.com/mydojo/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-black font-bold uppercase tracking-wider hover:text-primary transition-colors"
          >
            <Instagram className="h-5 w-5" />
            @mydojo
          </a>
        </div>
      </div>
    </section>
  );
}
