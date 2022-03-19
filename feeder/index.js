const { Kafka } = require("kafkajs");
const Web3 = require("web3");
const url = `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

console.log("Proveider: ", url)

// Using web3js
const web3 = new Web3(url);

const brokers = [process.env.KAFKA_BROKER || "localhost:9092"];

console.log("Broker: ", brokers);

console.log("Starting..");

const kafka = new Kafka({
    clientId: "kafkaClient",
    brokers,
});
const topicName = "ethereum_logs";

const asyncCall = async () => {
    const topics = await kafka.admin().listTopics();
    console.log("Topics: ", topics, !topics.includes(topicName));
    if (!topics.includes(topicName)) {
        console.log("Creating topic..");
        await kafka.admin().createTopics({
            topics: [
                {
                    topic: topicName,
                },
            ],
        });
    }

    const producer = kafka.producer();
    await producer.connect();

    web3.eth
        .subscribe("logs", { topics: [] }, (error, blockHeader) => {
            if (error) return console.log(error);
        })
        .on("data", async (log) => {
            try {
                await producer.send({
                    topic: topicName,
                    messages: [{ value: JSON.stringify(log) }],
                });
            } catch (errKafka) {
                console.log(errKafka);
            }
        }).on("error", console.log).on("disconnected", () => { console.log("Disconnected.") });
};

asyncCall();
