# Use an official Node runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npx prisma generate
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the app
CMD ["npm", "start"]
