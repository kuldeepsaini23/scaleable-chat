import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import prismaClient from "./prisma";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER as string],
  ssl: {
    ca: [fs.readFileSync(path.resolve("./src/services/ca.pem"), "utf-8")],
  },
  sasl: {
    username: process.env.KAFKA_USERNAME as string,
    password: process.env.KAFKA_PASSWORD as string,
    mechanism: "plain",
  },
});

// Donot want to create a new producer for every message, so we will create a single producer and cache it
let producer: null | Producer = null;

//Create a producer
export async function createProducer() {
  if (producer) {
    return producer;
  }
  const _producer = kafka.producer();
  await _producer.connect();
  producer = _producer;
  return producer;
}

//Producing a message
export async function produceMessage(message: string) {
  const producer = await createProducer();

  await producer.send({
    messages: [{ key: `message-${Date.now()}`, value: message }],
    topic: "MESSAGES",
  });

  return true;
}

export async function startMessageConsumer() {
  console.log("Starting Kafka Consumer");
  const consumer = kafka.consumer({ groupId: "default" });
  await consumer.connect();
  await consumer.subscribe({ topic: "MESSAGES" , fromBeginning: true});
  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ message, pause }) => {
      console.log(`New MSG Received(kafka): ${message.value?.toString()}`);
      if (!message.value) return;
      try {
        await prismaClient.message.create({
          data: {
            text: message.value?.toString(),
          },
        });
      } catch (e) {
        console.log("Something is wrong", e);
        pause();
        setTimeout(() => {
          consumer.resume([{ topic: "MESSAGES" }]);
        }, 60 * 1000);
      }
    },
  });
  return consumer;
}

export default kafka;
