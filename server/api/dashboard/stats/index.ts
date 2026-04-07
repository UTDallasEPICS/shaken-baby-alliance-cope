import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [totalUsers, verifiedUsers, newUsers7d] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      newLast7Days: newUsers7d,
    },
  };
});

