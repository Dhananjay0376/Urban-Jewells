import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Gem, Heart, Leaf, Users } from 'lucide-react';
import { useLenis, useScrollReveal } from '../lib/hooks';

const About = () => {
  useLenis();
  const storyRef = useScrollReveal();
  const missionRef = useScrollReveal({ delay: 0.2 });
  const craftRef = useScrollReveal({ delay: 0.3 });
  const sustainabilityRef = useScrollReveal({ delay: 0.4 });
  const teamRef = useScrollReveal({ delay: 0.5 });

  const missions = [
    {
      icon: Gem,
      title: 'Exceptional Quality',
      description: 'We source only the finest materials and work with skilled artisans to create pieces that last.'
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Your satisfaction is our priority. We go above and beyond to ensure you love your Urban Jewells pieces.'
    },
    {
      icon: Leaf,
      title: 'Sustainable Practices',
      description: 'We are committed to ethical sourcing and environmentally conscious production methods.'
    }
  ];

  const team = [
    { name: 'Amara Nkosi', role: 'Founder & Creative Director', image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Thabo Molefe', role: 'Head of Design', image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Nomsa Dlamini', role: 'Production Manager', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Kagiso Mahlangu', role: 'Customer Experience Lead', image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300' }
  ];

  return (
    <div className="bg-[#FAFAF7] min-h-screen pt-24">
      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#2D5016] to-[#1A3A0F]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            Our Story
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white/80"
          >
            Crafting beauty, one piece at a time
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section ref={storyRef} className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-6">
              From Passion to Purpose
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Urban Jewells was born from a deep love for jewellery and a vision to create pieces
                that resonate with the modern South African spirit. Founded in 2020, we set out to
                blend contemporary design with timeless elegance.
              </p>
              <p>
                What started as a small passion project has grown into a beloved brand, known for
                our attention to detail, quality craftsmanship, and commitment to customer
                satisfaction.
              </p>
              <p>
                Every piece in our collection tells a story — of skilled hands that crafted it, of
                the carefully sourced materials, and of the person who will wear it with pride.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Jewellery craftsmanship"
              className="rounded-2xl shadow-xl"
            />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#A8E6CF] rounded-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section ref={missionRef} className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] text-center mb-12">
            Our Mission
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-8 rounded-2xl bg-[#FAFAF7] hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-[#A8E6CF]/30 rounded-full flex items-center justify-center">
                  <mission.icon className="w-8 h-8 text-[#2D5016]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3">{mission.title}</h3>
                <p className="text-gray-600">{mission.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section ref={craftRef} className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] text-center mb-16">
            Our Craftsmanship
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <img
              src="https://images.pexels.com/photos/2697598/pexels-photo-2697598.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Design process"
              className="rounded-2xl shadow-lg"
            />
            <div>
              <h3 className="text-2xl font-serif font-semibold text-[#1A1A1A] mb-4">Design</h3>
              <p className="text-gray-600 leading-relaxed">
                Each piece begins as a sketch, carefully drawn by our talented designers. We draw
                inspiration from nature, architecture, and the diverse cultures of South Africa to
                create unique designs that stand out.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="md:order-2">
              <img
                src="https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Materials"
                className="rounded-2xl shadow-lg"
              />
            </div>
            <div className="md:order-1">
              <h3 className="text-2xl font-serif font-semibold text-[#1A1A1A] mb-4">Materials</h3>
              <p className="text-gray-600 leading-relaxed">
                We source only the finest materials — from sterling silver and gold-plated metals
                to genuine gemstones and pearls. Quality is never compromised in our pursuit of
                beauty.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <img
              src="https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Creation"
              className="rounded-2xl shadow-lg"
            />
            <div>
              <h3 className="text-2xl font-serif font-semibold text-[#1A1A1A] mb-4">Creation</h3>
              <p className="text-gray-600 leading-relaxed">
                Our skilled artisans bring each design to life using traditional techniques passed
                down through generations, combined with modern precision tools for impeccable
                results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section ref={sustainabilityRef} className="py-20 px-4 bg-[#A8E6CF]/20">
        <div className="max-w-4xl mx-auto text-center">
          <Leaf className="w-16 h-16 mx-auto mb-6 text-[#2D5016]" />
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-6">
            Our Commitment to Sustainability
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              We believe beautiful jewellery shouldn't come at the expense of our planet. That's
              why we're committed to sustainable practices throughout our supply chain.
            </p>
            <p>
              From ethically sourced materials to eco-friendly packaging, every decision we make
              considers our environmental impact. We work with suppliers who share our values and
              continuously seek ways to reduce our carbon footprint.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section ref={teamRef} className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] text-center mb-12">
            Meet Our Team
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group text-center"
              >
                <div className="relative overflow-hidden rounded-2xl mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-[#2D5016]/0 group-hover:bg-[#2D5016]/20 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
