import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  type?: string;
  name?: string;
  image?: string;
  keywords?: string;
}

export default function SEO({ 
  title, 
  description = "Experience the next evolution of martial arts training at MyDojo. Build confidence, discipline, and strength in a supportive, high-energy environment. Programs for all ages from Little Ninjas (3-5) to Adults (18+).", 
  canonical, 
  type = "website", 
  name = "MyDojo Martial Arts & Fitness",
  image = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg",
  keywords = "martial arts, karate, kickboxing, self defense, fitness, kids martial arts, adult martial arts, Tomball martial arts, Texas martial arts, Little Ninjas, Dragon Kids, teen martial arts, after school program"
}: SEOProps) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : "https://mydojoma.manus.space";
  const fullTitle = `${title} | ${name}`;
  const fullImage = image.startsWith("http") ? image : `${siteUrl}${image}`;
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : siteUrl);

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="MyDojo Martial Arts & Fitness" />
      
      {/* Geo Tags for Local SEO */}
      <meta name="geo.region" content="US-TX" />
      <meta name="geo.placename" content="Tomball" />
      <meta name="geo.position" content="30.0933;-95.6160" />
      <meta name="ICBM" content="30.0933, -95.6160" />

      {/* Open Graph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={name} />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
    </Helmet>
  );
}
