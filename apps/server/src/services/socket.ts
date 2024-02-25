import { Server } from "socket.io";
import {Redis} from 'ioredis';
import { produceMessage } from "./kafka";


const pub = new Redis({
  host:process.env.REDIS_HOST as string,
  port: parseInt(process.env.REDIS_PORT as string) as unknown as number,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

const sub = new Redis({
  host:process.env.REDIS_HOST as string,
  port: parseInt(process.env.REDIS_PORT as string) as unknown as number, 
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

class SocketServices {
  private _io: Server;

  constructor() {
    console.log("Initializing Socket Service....");
    this._io = new Server({
      cors:{
        allowedHeaders:['*'],
        origin: '*'
      }
    });
    
    sub.subscribe("MESSAGES");
  }

  public initListeners() {
    console.log("Initializing Socket Listeners....");
    const io = this.io;
    io.on('connect', (socket)=>{
      console.log(`New Socket Connected: `, socket.id);

      socket.on('event:message', async({message}:{message:string})=>{
        console.log(`New Message Received: ${message}`);
        // io.emit('event:message', {message});
        console.log('Publishing Message', JSON.stringify({ message }));
        await pub.publish("MESSAGES", JSON.stringify({ message }));
      })
    })

    sub.on('message', async(channel,message)=>{
      if(channel === 'MESSAGES'){
        // console.log(`New Message in Sub: ${message}`);
        io.emit('message', {message});

        //Store in DB
        await produceMessage(message);
        console.log('Message Produced to Kafka Broker');
      }
    })
  }

  get io() {
    return this._io;
  }
}

export default SocketServices;