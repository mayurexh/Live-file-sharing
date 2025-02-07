const http = require('http');
const express = require('express');
const {greetUser, getId} = require('./modules/helper')
const path = require("path") // node module to handle path
const app = express(); // Initialize Express
const PORT = 3000; // Port to run the server
const multer = require("multer")
const fs = require("fs")

const { Server } = require('socket.io');
const { time } = require('console');

// Wrap the Express app with an HTTP server
const server = http.createServer(app);


// Initialize Socket.io
const io = new Server(server,{
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
});


// serve satatic files
app.use(express.static('public'));

server.listen(PORT, () => {'Server is running on http://localhost:${PORT}'});
// Store active sessions
const sessions = new Map();


io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('joinSession', ({ sessionID }) => {
      console.log(`Socket ${socket.id} joining session ${sessionID}`);

      if (!sessions.has(sessionID)) {
          sessions.set(sessionID, new Set([socket.id]));
      } else {
          const session = sessions.get(sessionID);
          if (session.size >= 2) {
              socket.emit('error', { message: 'Session is full' });
              return;
          }
          session.add(socket.id);

          // If we now have two peers, start the call
          if (session.size === 2) {
              const [firstPeer, secondPeer] = session;
              io.to(firstPeer).emit('startCall', { targetId: secondPeer });
          }
      }

      socket.join(sessionID);
      socket.sessionID = sessionID;
  });

  socket.on('signal', ({ targetId, data }) => {
      io.to(targetId).emit('signal', {
          senderId: socket.id,
          data
      });
  });

  socket.on('disconnect', () => {
      if (socket.sessionID && sessions.has(socket.sessionID)) {
          const session = sessions.get(socket.sessionID);
          session.delete(socket.id);
          if (session.size === 0) {
              sessions.delete(socket.sessionID);
          }
      }
  });
});

// Define a basic route
app.get('/', (req, res) => {
  
  pagePath = path.join(__dirname,'public', 'notification.html')
  res.sendFile(pagePath);
});

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

app.get('/greet/:name', (req,res)=>{
    const {name} = req.params
    const message = greetUser(name)
    res.send(message);
});

app.get('/getid/:id', (req,res)=>{
    const {id} = req.params
    res.send(getId(id))
})

app.get('/download', (req,res)=>{
  const {type} = req.query
  const {file} = req.query
  if (!file){
    res.status(400).send(`File is a required property`)
  }
  if (!type){
    res.send(`Your file is of format pdf`)
  }
  res.send(`Your file is of type ${type}`)
  
})

// Middleware to log requests
const requestLogger = (req, res, next) => {
  const method = req.method;
  const url = req.url;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} ${url}`);
  next(); // Pass control to the next middleware/route handler
};

// Use the middleware
app.use(requestLogger);


//serving static files
//node provides express.static() as a middleware to serve static files

//serve static files form public directory 
app.use('/files', express.static(path.join(__dirname,'public')))


// Example route to explain how this works
app.get('/files-info', (req, res) => {
  res.send('Access your files at http://localhost:3000/files/<filename>');
});

// route to handle single file display
app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.access(filePath, fs.F_OK, (err)=>{
    if (err){
      res.status(404).send('File not found')
    }
  })
  const fileExtension = path.extname(filePath).toLowerCase(); //extract file name extension
  if (fileExtension === '.pdf' || fileExtension === '.txt' || fileExtension == '.docx'){
    res.sendFile(filePath)
  }
  else if (fileExtension === '.jpg' || fileExtension === '.png' || fileExtension === '.jpeg'){
    res.sendFile(filePath)
  }
  else{
    //force download for any other file format
    res.download(filePath)
  }
})

//handling file uploads using muttler 
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function(req, file, cb){
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null,  uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only .pdf and .txt files are allowed.'));
    }
    cb(null, true); // Accept the file
  },
})



// Route to handle file uploads
app.post('/upload', upload.single('file'), (req, res)=>{
  if (!req.file){
    res.status(400).send('File is required')
  }
  filename = req.file.filename
  timestamp = new Date().toISOString()
  fileURL = `/files/${filename}`

  //notify all users that file is uploaded
  io.emit('fileUploaded', { filename, url: fileURL, timestamp });
  res.send(`File uploaded successfully: ${filename}`);
});

// Error-handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send(`Multer Error: ${err.message}`);
  }
  if (err) {
    return res.status(400).send(`Error: ${err.message}`);
  }
  next();
});

//download files
app.get('/download/:filename', (req, res) => {
  const { filename} = req.params;
  const filepath = path.join(__dirname, 'uploads', filename)

  res.download(filepath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
    
})


