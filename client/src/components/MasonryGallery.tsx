import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Instagram } from "lucide-react";
import { socialFeed } from "@/data/social-feed";

export function MasonryGallery() {
  const { t } = useTranslation();
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-4">
              Dojo <span className="text-primary">Life</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Real moments from our community. Join us on the mats and become part of the family.
            </p>
          </div>
          <a
            href="https://www.instagram.com/mydojo/"
            className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors"
          >
            <Instagram className="w-5 h-5" />
            Follow @mydojo
          </a>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {socialFeed.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`relative w-full ${
                post.aspectRatio === 'square' ? 'aspect-square' :
                post.aspectRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'
              }`}>
                <img
                  src={post.image}
                  alt={post.caption}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <p className="text-white text-sm font-medium mb-4 line-clamp-3">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between text-white/90">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 fill-current" />
                        <span className="text-xs font-bold">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span className="text-xs font-bold">{post.comments}</span>
                      </div>
                    </div>
                    <span className="text-xs opacity-75">{post.user}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
