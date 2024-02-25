import { Server } from "socket.io";
import {Redis} from 'ioredis';
import { channel } from "diagnostics_channel";


const pub = new Redis({
  host:'redis-chatapp-kuldeepsaini02311-43f7.a.aivencloud.com',
  port:17543 ,
  username:"default" ,
  password: 'AVNS_rzqUkTXrMIEs_N0OMQO'
});

const sub = new Redis({
  host:'redis-chatapp-kuldeepsaini02311-43f7.a.aivencloud.com',
  port:17543 ,
  username:"default" ,
  password: 'AVNS_rzqUkTXrMIEs_N0OMQO'
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

    sub.on('message', (channel,message)=>{
      if(channel === 'MESSAGES'){
        // console.log(`New Message in Sub: ${message}`);
        io.emit('message', {message});

        //Store in DB
      }
    })
  }

  get io() {
    return this._io;
  }
}

export default SocketServices;