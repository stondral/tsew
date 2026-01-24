"use client";

import { motion } from "framer-motion";
import { 
  Heart, 
  Target, 
  Users, 
  Lightbulb, 
  Globe, 
  TrendingUp,
  Award,
  Sparkles,
  Rocket,
  Shield,
  Leaf,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true }
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container relative z-10 px-4 md:px-6 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-bold">
              <Sparkles className="w-4 h-4 mr-2" />
              Our Story
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              Empowering India&apos;s
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200">
                Next Generation
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-medium">
              Curating exceptional products from India&apos;s most innovative startups,
              bringing you the future of commerce, sustainability, and craftsmanship.
            </p>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full"></div>
        </div>
        <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full"></div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid md:grid-cols-2 gap-8"
          >
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-2xl shadow-orange-100 bg-gradient-to-br from-orange-50 to-white rounded-3xl overflow-hidden h-full">
                <CardContent className="p-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Our Mission</h2>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    To connect conscious consumers with India&apos;s brightest innovators, 
                    creating a marketplace where quality, sustainability, and innovation thrive. 
                    We&apos;re building bridges between visionary startups and customers who value 
                    excellence and authenticity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-2xl shadow-purple-100 bg-gradient-to-br from-purple-50 to-white rounded-3xl overflow-hidden h-full">
                <CardContent className="p-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Our Vision</h2>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    To become India&apos;s premier platform for discovering innovative products, 
                    where every purchase supports the entrepreneurial spirit and contributes 
                    to a more sustainable, locally-driven economy. We envision a future where 
                    Indian innovation leads global markets.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-orange-100 text-orange-700 px-4 py-2 text-sm font-bold">
              What Drives Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from curating products to serving our community.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Heart,
                title: "Quality First",
                description: "Every product is carefully vetted to ensure it meets our high standards of excellence and craftsmanship.",
                color: "from-red-500 to-pink-500",
                bgColor: "bg-red-50"
              },
              {
                icon: Leaf,
                title: "Sustainability",
                description: "We prioritize eco-friendly products and practices, supporting startups committed to environmental responsibility.",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-50"
              },
              {
                icon: Users,
                title: "Community",
                description: "Building strong relationships between makers and buyers, fostering a supportive ecosystem for innovation.",
                color: "from-blue-500 to-indigo-500",
                bgColor: "bg-blue-50"
              },
              {
                icon: Shield,
                title: "Trust & Transparency",
                description: "Honest communication, secure transactions, and authentic product information you can rely on.",
                color: "from-purple-500 to-violet-500",
                bgColor: "bg-purple-50"
              },
              {
                icon: Rocket,
                title: "Innovation",
                description: "Championing cutting-edge ideas and creative solutions that push boundaries and inspire change.",
                color: "from-orange-500 to-amber-500",
                bgColor: "bg-orange-50"
              },
              {
                icon: Star,
                title: "Excellence",
                description: "Striving for perfection in every aspect, from product selection to customer experience and support.",
                color: "from-yellow-500 to-orange-500",
                bgColor: "bg-yellow-50"
              }
            ].map((value, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 ${value.bgColor} rounded-2xl overflow-hidden h-full group hover:-translate-y-2`}>
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 px-4 py-2 text-sm font-bold">
              The Stondemporium Difference
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Why Choose Us
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: Globe,
                title: "Pan-India Network",
                stat: "500+",
                label: "Startup Partners"
              },
              {
                icon: Award,
                title: "Premium Quality",
                stat: "100%",
                label: "Vetted Products"
              },
              {
                icon: TrendingUp,
                title: "Growth Support",
                stat: "3x",
                label: "Average Revenue Growth"
              },
              {
                icon: Users,
                title: "Happy Customers",
                stat: "50K+",
                label: "Satisfied Buyers"
              }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="border-2 border-gray-100 hover:border-orange-300 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden text-center group hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 mb-2">
                      {stat.stat}
                    </div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {stat.label}
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{stat.title}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Join the Innovation Revolution
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Discover unique products, support Indian entrepreneurs, and be part of
              a movement that&apos;s reshaping India&apos;s commerce landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="rounded-full text-lg px-10 h-14 bg-white text-orange-600 hover:bg-gray-50 shadow-2xl font-bold">
                  Explore Products
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/startups">
                <Button size="lg" variant="outline" className="rounded-full text-lg px-10 h-14 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 font-bold">
                  Meet Startups
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
