FROM apify/actor-node:20

COPY package*.json ./
RUN npm --quiet set progress=false \
    && npm install --include=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

CMD ["npm", "start"]
