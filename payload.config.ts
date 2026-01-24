import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import nodemailer from "nodemailer";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";
import { Addresses } from "./collections/Addresses";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Products, Orders, Addresses],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_EMAIL || "noreply@stondemporium.tech",
    defaultFromName: "Stond Emporium",
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }),
  }),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  sharp,
  serverURL: process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000",
  cors: [
    "https://stondemporium.tech",
    "https://www.stondemporium.tech",
    "http://localhost:3000"
  ],
  csrf: [
    "https://stondemporium.tech",
    "https://www.stondemporium.tech",
    "http://localhost:3000"
  ],
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET ?? '',
      config: {
        endpoint: process.env.R2_ENDPOINT ?? '',
        region: "auto",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        },
        forcePathStyle: true, // Required for Cloudflare R2
      },
    }),
  ],
});
