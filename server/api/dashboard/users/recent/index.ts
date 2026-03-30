import { prisma } from "../../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.min(Math.max(Number(query.limit ?? 10) || 10, 1), 100);

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
    },
  });
});

