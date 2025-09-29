# Use the Node.js 18 Alpine image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Install build tools (needed for some npm packages)
RUN apk update && apk add --no-cache g++ make python3

# Copy only the package.json and package-lock.json files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose backend port
EXPOSE 3001

# Start the backend server
CMD ["node", "server.js"]
