import { PrismaClient, RequestStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Create an Admin user
  const adminPassword = bcrypt.hashSync("pass", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      name: "Recessions Admin",
      email: "admin@gmail.com",
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log("Admin user seeded:", admin.email);

  // 2. Create a regular User
  const userPassword = bcrypt.hashSync("pass", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@gmail.com" },
    update: {},
    create: {
      name: "Guest One",
      email: "user@gmail.com",
      isEmailVerified: false,
      password: userPassword,
      role: Role.USER,
    },
  });
  console.log("Regular user seeded:", user.email);

  // 3. Seed some SongRequest entries
  const req1 = await prisma.songRequest.create({
    data: {
      name: "Alice",
      email: "alice@gmail.com",
      song: "Bohemian Rhapsody",
      // createdAt defaults to now()
      // status defaults to PENDING
    },
  });
  console.log("SongRequest #1:", req1.id, req1.song);

  const req2 = await prisma.songRequest.create({
    data: {
      name: "Bob",
      email: "bob@gmail.com",
      song: "Perfect",
      status: RequestStatus.APPROVED,
      statusById: admin.id,
      statusChanged: new Date(),
    },
  });
  console.log("SongRequest #2 (approved):", req2.id, req2.song);

  // 4. Create an email verification token for the regular user
  const token = await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      emailVerifyToken: "verify-token-example-001",
      expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    },
  });
  console.log("EmailVerificationToken seeded for:", user.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
