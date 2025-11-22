FROM mcr.microsoft.com/playwright:v1.56.1-noble AS build
WORKDIR /app

# 1) Copy manifests first for cacheable deps layer
COPY package.json package-lock.json tsconfig*.json ./

# 2) Install deps INCLUDING dev deps, but DO NOT run lifecycle scripts yet
RUN npm ci --include=dev --ignore-scripts

# 3) Now copy sources
COPY src ./src

# 4) Build explicitly
RUN npm run build

# 5) Prune dev deps for slim runtime node_modules
RUN npm prune --omit=dev && npm cache clean --force


FROM mcr.microsoft.com/playwright:v1.56.1-noble AS runtime
WORKDIR /app
ENV PLAYWRIGHT_HEADLESS=1

# Data dir for resources (mount a volume here in prod)
RUN mkdir -p /data

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8000
ENTRYPOINT ["node", "dist/index.js"]
