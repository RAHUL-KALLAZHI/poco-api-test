FROM node:16 as builder
# Set the working directory
WORKDIR /src
COPY . /src
RUN npm install
RUN npm install socket.io@4.1.0
CMD ["node","index.js"]
