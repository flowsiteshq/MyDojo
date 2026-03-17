import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, User, ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blog-posts";
import NotFound from "./NotFound";

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const slug = params?.slug;
  
  const post = blogPosts.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px]">
        <img 
          src={post.imageUrl} 
          alt={post.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="container mx-auto max-w-4xl">
            <Link href="/blog">
              <Button variant="outline" className="mb-6 text-white border-white hover:bg-white hover:text-black transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Learning Center
              </Button>
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center space-x-4 text-white/90 mb-4 text-sm md:text-base">
                <span className="bg-primary px-3 py-1 rounded-full text-white font-bold text-xs uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> {post.date}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" /> {post.readTime}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center text-white/90">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm">Written by</p>
                  <p className="text-sm">{post.author}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Article */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl"
            >
              {/* Render content dynamically */}
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </motion.div>

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Share2 className="w-5 h-5 mr-2" /> Share this article
              </h3>
              <div className="flex space-x-4">
                <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors">
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-colors">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Newsletter Signup */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-xl font-heading font-bold mb-2">Join Our Newsletter</h3>
              <p className="text-gray-600 mb-4 text-sm">Get the latest training tips and dojo news delivered to your inbox.</p>
              <div className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button className="w-full font-bold">Subscribe</Button>
              </div>
            </div>

            {/* Related Posts */}
            <div>
              <h3 className="text-xl font-heading font-bold mb-4">Related Articles</h3>
              <div className="space-y-4">
                {blogPosts
                  .filter(p => p.id !== post.id && p.category === post.category)
                  .slice(0, 3)
                  .map(relatedPost => (
                    <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                      <div className="group cursor-pointer flex gap-4 items-start">
                        <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                          <img 
                            src={relatedPost.imageUrl} 
                            alt={relatedPost.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                            {relatedPost.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">{relatedPost.date}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
