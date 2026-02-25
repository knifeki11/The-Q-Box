"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const galleryImages = [
  { src: "/images/gallery-1.jpg", caption: "Main Gaming Floor", span: "md:col-span-2 md:row-span-2" },
  { src: "/images/gallery-2.jpg", caption: "Premium PS5 Setup", span: "" },
  { src: "/images/gallery-3.jpg", caption: "Lounge Interior", span: "" },
  { src: "/images/gallery-4.jpg", caption: "Tournament Arena", span: "md:col-span-2" },
  { src: "/images/gallery-5.jpg", caption: "VIP Gaming Booth", span: "" },
  { src: "/images/gallery-6.jpg", caption: "Lounge Bar", span: "" },
];

export default function Gallery() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-primary">
            The Space
          </span>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Experience the Ambience
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            Step inside Q-BOX and discover a gaming environment unlike any other.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid gap-4 md:grid-cols-4 md:auto-rows-[200px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.src}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl ${image.span}`}
            >
              <Image
                src={image.src}
                alt={image.caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              {/* Dark overlay with caption */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="p-4 text-sm font-medium text-foreground">
                  {image.caption}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
