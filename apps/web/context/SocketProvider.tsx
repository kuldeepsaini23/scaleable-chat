"use client";
import React, { useCallback, useContext, useEffect } from "react";
import { io,Socket } from "socket.io-client";

type Props = {
  children?: React.ReactNode;
};

type PSocketContext = {
  sendMessage: (msg: string) => void;
  messages?: string[];
};

const SocketContext = React.createContext<PSocketContext | null>(null);

export const useSocket = () => {
  const state = useContext(SocketContext);
  if(!state) throw new Error("SocketProvider not found or Socket not defined");

  return state;
}

export const SocketProvider = ({ children }: Props) => {
  const [socket, setSocket] = React.useState<Socket>();
  const [messages, setMessages] = React.useState<string[]>([]);

  const sendMessage: PSocketContext["sendMessage"] = useCallback((msg) => {
    console.log(`Sending Message: ${msg}`);
    // console.log(socket);
    if(socket){
      socket.emit("event:message", {message:msg});
    }
  }, [socket]);

  const onMessageRec = useCallback((msg: any) => {
    console.log("From Server Msg Rec", msg);
    const { message } = JSON.parse(msg?.message);
    setMessages((prev) => [...prev, message]);
  }, []);

  useEffect(() => {
    //inside io we have to give backend server url
    const _socket = io("http://localhost:8000/");
    _socket.on("message", onMessageRec);
    setSocket(_socket);
    //clean up function that will run when the component is unmounted
    return () => {
      _socket.off("message", onMessageRec); 
      _socket.disconnect();

      setSocket(undefined);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ sendMessage, messages}}>
      {children}
    </SocketContext.Provider>
  );
};
