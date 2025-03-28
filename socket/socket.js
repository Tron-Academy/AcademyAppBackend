import express from "express";
import http from "http";
import { Server } from "socket.io";
import Message from "../models/MessageModel.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import uploadToCloudinary from "../utils/cloudinaryUtils.js";
import { formatImage } from "../middleware/multerMiddleware.js";

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join community room
  socket.on("joinCommunity", async (subCommunityId) => {
    try {
      socket.join(subCommunityId);
      console.log(`Client ${socket.id} joined community ${subCommunityId}`);

      const messages = await Message.find({ subCommunityId })
        .populate("user", "firstName lastName profilePicUrl")
        .populate("subCommunityId", "name")
        .sort({ createdAt: 1 })
        .limit(100);

      socket.emit("previousMessages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", "Failed to load messages");
    }
  });

  // Handle text messages
  socket.on("sendMessage", async ({ subCommunityId, message, user }) => {
    try {
      const newMessage = new Message({
        message,
        type: "text",
        user: user?._id,
        subCommunityId,
      });

      await newMessage.save();
      const populatedMsg = await newMessage.populate(
        "user",
        "firstName lastName profilePicUrl"
      );

      io.to(subCommunityId).emit("receiveMessage", populatedMsg);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Handle image uploads
  socket.on(
    "sendImage",
    async ({ subCommunityId, imageBuffer, tempMessageId, user }) => {
      try {
        const result = await uploadToCloudinary(
          imageBuffer,
          "image",
          `chat/${subCommunityId}/images`
        );

        const newMessage = new Message({
          imageUrl: result.secure_url,
          type: "image",
          user: user?._id,
          subCommunityId,
        });

        await newMessage.save();
        const populatedMsg = await newMessage.populate(
          "user",
          "firstName lastName profilePicUrl"
        );

        io.to(subCommunityId).emit("receiveMessage", {
          ...populatedMsg.toObject(),
          tempMessageId,
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        socket.emit("error", {
          message: "Failed to send image",
          tempMessageId,
        });
      }
    }
  );

  // Handle voice messages
  socket.on(
    "sendVoice",
    async ({ subCommunityId, audioBuffer, duration, tempMessageId, user }) => {
      try {
        const result = await uploadToCloudinary(
          audioBuffer,
          "video",
          `chat/${subCommunityId}/audio`
        );

        const newMessage = new Message({
          audioUrl: result.secure_url,
          duration,
          type: "voice",
          user: user?._id,
          subCommunityId,
        });

        await newMessage.save();
        const populatedMsg = await newMessage.populate(
          "user",
          "firstName lastName profilePicUrl"
        );

        io.to(subCommunityId).emit("receiveMessage", {
          ...populatedMsg.toObject(),
          tempMessageId,
        });
      } catch (error) {
        console.error("Error uploading voice:", error);
        socket.emit("error", {
          message: "Failed to send voice message",
          tempMessageId,
        });
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

export { app, io, server };

// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import Message from "../models/MessageModel.js";
// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import uploadToCloudinary from "../utils/cloudinaryUtils.js";
// import { formatImage } from "../middleware/multerMiddleware.js";

// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024,
//   },
// });

// // Create Express app and HTTP server
// const app = express();
// const server = http.createServer(app);

// // Configure Socket.IO server with CORS settings
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all origins (adjust for production)
//     methods: ["GET", "PUT", "POST", "PATCH"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log("a user connected: ", socket.id);

//   socket.on("joinCommunity", async (subCommunityId) => {
//     try {
//       socket.join(subCommunityId);
//       console.log(`User ${socket.id} joined sub-community ${subCommunityId}`);

//       const messages = await Message.find({ subCommunityId })
//         .populate("user")
//         .sort({ timeStamp: 1 });

//       socket.emit("previousMessages", messages);
//     } catch (error) {
//       console.error("Error joining community:", error);
//       socket.emit("error", "Failed to join community");
//     }
//   });

//   socket.on("sendMessage", async (data) => {
//     try {
//       const { subCommunityId, user, message } = data;
//       // Create new text message in database
//       const newMessage = new Message({
//         subCommunityId,
//         user,
//         message,
//         type: "text",
//       });
//       await newMessage.save();

//       // Broadcast message to all in the sub-community
//       io.to(subCommunityId).emit("receiveMessage", {
//         _id: newMessage._id,
//         user,
//         message,
//         type: "text",
//         timestamp: newMessage.createdAt,
//       });
//     } catch (error) {
//       console.error("Error sending message:", error);
//       socket.emit("error", "Failed to send message");
//     }
//   });

//   socket.on("sendImage", async (data) => {
//     try {
//       const { subCommunityId, user, imageBuffer } = data;

//       // Upload image to Cloudinary
//       const file = formatImage(imageBuffer);
//       const result = await cloudinary.uploader.upload(file);

//       // Save message with image URL to database
//       const newMessage = new Message({
//         subCommunityId,
//         user,
//         imageUrl: result.secure_url,
//         type: "image",
//       });
//       await newMessage.save();

//       // Broadcast image message
//       io.to(subCommunityId).emit("receiveMessage", {
//         _id: newMessage._id,
//         user,
//         imageUrl: result.secure_url,
//         type: "image",
//         timestamp: newMessage.createdAt,
//       });
//     } catch (error) {
//       console.error("Error sending image:", error);
//       socket.emit("error", "Failed to send image");
//     }
//   });

//   socket.on("sendVoice", async (data) => {
//     try {
//       const { subCommunityId, user, audioBuffer, duration } = data;

//       // Upload audio to Cloudinary (using 'video' type for audio)
//       const file = formatImage(audioBuffer);
//       const result = await cloudinary.uploader.upload(file);

//       // Save voice message with audio URL and duration
//       const newMessage = new Message({
//         subCommunityId,
//         user,
//         audioUrl: result.secure_url,
//         duration,
//         type: "voice",
//       });
//       await newMessage.save();

//       // Broadcast voice message
//       io.to(subCommunityId).emit("receiveMessage", {
//         _id: newMessage._id,
//         user,
//         audioUrl: result.secure_url,
//         duration,
//         type: "voice",
//         timestamp: newMessage.createdAt,
//       });
//     } catch (error) {
//       console.error("Error sending voice message:", error);
//       socket.emit("error", "Failed to send voice message");
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("user disconnected: ", socket.id);
//   });
// });

// // app.post("/api/upload", upload.single("file"), async (req, res) => {
// //   try {
// //     if (!req.file) {
// //       return res.status(400).json({ error: "No file uploaded" });
// //     }

// //     const resourceType = req.file.mimetype.startsWith("image/")
// //       ? "image"
// //       : req.file.mimetype.startsWith("audio/")
// //       ? "video"
// //       : "auto";

// //     const result = await uploadToCloudinary(req.file.buffer, resourceType);

// //     res.json({
// //       url: result.secure_url,
// //       resourceType,
// //       duration: req.body.duration, // For voice messages
// //     });
// //   } catch (error) {
// //     console.error("Upload error:", error);
// //     res.status(500).json({ error: "Failed to upload file" });
// //   }
// // });

// export { app, io, server };

// // import express from "express";
// // import http from "http";
// // import { Server } from "socket.io";
// // import Message from "../models/MessageModel.js";
// // import { timeStamp } from "console";

// // const app = express();
// // const server = http.createServer(app);
// // const io = new Server(server, {
// //   cors: {
// //     origin: "*",
// //     methods: ["GET", "PUT", "POST", "PATCH"],
// //   },
// // });

// // io.on("connection", (socket) => {
// //   console.log("a user connected: ", socket.id);
// //   socket.on("joinCommunity", async (subCommunityId) => {
// //     socket.join(subCommunityId);
// //     console.log(`User ${socket.id} joined sub community ${subCommunityId}`);

// //     const messages = await Message.find({ subCommunityId })
// //       .populate("user")
// //       .sort({ timeStamp: 1 });
// //     socket.emit("previousMessages", messages);
// //   });
// //   socket.on("sendMessage", async (data) => {
// //     const { subCommunityId, user, message } = data;
// //     const newMessage = new Message({ subCommunityId, user, message });
// //     await newMessage.save();
// //     io.to(subCommunityId).emit("receiveMessage", {
// //       user,
// //       message,
// //       timestamp: newMessage.createdAt,
// //     });
// //   });
// //   socket.on("disconnect", () => {
// //     console.log("user disconnected", socket.id);
// //   });
// // });
// // export { app, io, server };
