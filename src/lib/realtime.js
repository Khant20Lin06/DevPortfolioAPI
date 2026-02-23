let ioInstance = null;

export const initRealtime = (io) => {
  ioInstance = io;
};

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

export const emitToAdmins = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.to("role:admin").emit(event, payload);
};

export const emitBroadcast = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
};
