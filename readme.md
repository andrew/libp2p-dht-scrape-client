docker build -t libp2p-dht-scrape-client .

docker run -it --init libp2p-dht-scrape-client

docker build -t ipfsshipyard/libp2p-dht-scrape-client:latest . && docker push ipfsshipyard/libp2p-dht-scrape-client:latest
