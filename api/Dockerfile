# Step 1: Start FROM an official base image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy dependency files FIRST (smart caching trick)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install --production

# Step 5: Copy the rest of your app code
COPY . .

# Step 6: Tell Docker which port your app uses
EXPOSE 3000

# Step 7: The command to start your app
CMD ["node", "index.js"]
