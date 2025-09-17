# Build

npm i

npm run generate

docker build -t droneblocks/dexi-droneblocks:latest .

# Save image for DEXI OS build

docker save droneblocks/dexi-droneblocks:latest > dexi-droneblocks.tar

# Run from host with Docker

docker run -d --restart unless-stopped -p 3000:80 droneblocks/dexi-droneblocks:latest