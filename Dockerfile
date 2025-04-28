FROM node:18-silm

# Set working directory inside container
WORKDIR /app

# Copy only package.json and package-lock.json first (for better cache)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other app files (except what is in .dockerignore)
COPY . .

# Expose app port
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
