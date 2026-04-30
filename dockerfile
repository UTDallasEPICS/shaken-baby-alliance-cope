FROM node:22-alpine
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN pnpm run build

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node .output/server/index.mjs"]
