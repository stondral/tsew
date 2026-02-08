const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

async function run() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // ✅ Initialize Socket.IO server directly
  try {
    const io = new SocketIOServer(httpServer, {
      path: "/api/realtime",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "*",
        methods: ["GET", "POST"],
      },
    });

    // ✅ Middleware to verify authentication token
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        console.log(`🔐 Socket auth attempt - Token received: ${token ? 'YES' : 'NO'}`);

        if (!token) {
          console.warn('❌ No token provided');
          return next(new Error('Authentication required'));
        }

        try {
          // ✅ Decode JWT token directly
          const parts = token.split('.');
          console.log(`🔍 Token parts: ${parts.length}`);

          if (parts.length !== 3) {
            console.error(`❌ Invalid token format: expected 3 parts, got ${parts.length}`);
            return next(new Error('Invalid token format'));
          }

          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
          );

          console.log(`✅ Token decoded - ID: ${payload.id}, Email: ${payload.email}`);

          if (!payload.id) {
            console.error('❌ No user ID in token payload');
            return next(new Error('Invalid token payload'));
          }

          // Verify token expiration
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.error('❌ Token expired');
            return next(new Error('Token expired'));
          }

          // Store user info in socket for later access
          socket.user = { id: payload.id, email: payload.email };
          socket.userId = payload.id;
          socket.userRole = payload.role || 'user';

          console.log(`✅ User authenticated: ${payload.id} (${socket.userRole})`);
          next();
        } catch (error) {
          console.error('❌ Token verification error:', error.message);
          next(new Error('Token verification failed'));
        }
      } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });

    io.on("connection", (socket) => {
      const userId = socket.userId;
      const userRole = socket.userRole;
      
      console.log(`✅ Client connected: ${socket.id} - User: ${userId} (${userRole})`);

      // Auto-join admin to all support rooms
      if (userRole === 'admin') {
        socket.join('admin-support');
        console.log(`👤 Admin ${userId} joined admin-support room`);
      }

      socket.on("join", (roomId) => {
        socket.join(roomId);
        console.log(`📍 Socket ${socket.id} joined room ${roomId}`);

        // Notify others in room about presence
        io.to(roomId).emit("user-joined", {
          userId,
          userRole,
          timestamp: new Date(),
        });
      });

      socket.on("leave", (roomId) => {
        socket.leave(roomId);
        console.log(`📍 Socket ${socket.id} left room ${roomId}`);

        io.to(roomId).emit("user-left", {
          userId,
          timestamp: new Date(),
        });
      });

      socket.on("message", async (data) => {
        const { ticketId, senderId, senderType, content, orderId } = data;
        
        console.log(`📨 Socket message received from ${senderId} (${senderType}) for ticket ${ticketId}: "${content.substring(0, 50)}..."`);
        
        try {
          // Broadcast to specific ticket room
          console.log(`📢 Broadcasting message to room support:${ticketId}`);
          io.to(`support:${ticketId}`).emit("message", {
            id: `msg-${Date.now()}`,
            ticketId,
            sender: senderId,
            senderType,
            content,
            deliveryStatus: "sent",
            createdAt: new Date(),
            orderId,
          });

          // ✅ Also broadcast to admin room for notifications
          io.to("admin-support").emit("notification", {
            type: "support_message",
            ticketId,
            senderType,
            senderName: socket.user?.email || senderId,
            content: content.substring(0, 50),
            timestamp: new Date(),
          });
          
          console.log(`✅ Message for ticket ${ticketId} sent and notified`);
        } catch (error) {
          console.error("❌ Error handling message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    console.log("✅ Socket.IO server initialized on /api/realtime");
  } catch (err) {
    console.error("❌ Failed to initialize Socket.IO:", err);
  }

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}

run().catch(console.error);

