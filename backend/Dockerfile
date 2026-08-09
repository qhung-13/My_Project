# Using Node.js version 22
FROM node:22-alpine

# Creating work folder in container
WORKDIR /app

# Copy package.json 
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy all code into container
COPY . .

# Expose port 5000
EXPOSE 5000

# Running server
CMD ["node", "index.js"]