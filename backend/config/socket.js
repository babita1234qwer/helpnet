const { Server } = require('socket.io');
let io;

module.exports = {
  init: function(server) {
    io = new Server(server, {
      cors: {
        origin: ['http://localhost:5174'],
        credentials: true
      }
    });
    return io;
  },
  getIO: function() {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};