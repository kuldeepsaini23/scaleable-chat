import http from 'http'
import SocketServices from './services/socket'; 
import {config} from 'dotenv'
import { startMessageConsumer } from './services/kafka';

async function init() { 
  config();
  startMessageConsumer();
  const socketService = new SocketServices();

  const httpServer = http.createServer();
  const PORT = process.env.PORT || 8000;

  socketService.io.attach(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  socketService.initListeners();
}

init();