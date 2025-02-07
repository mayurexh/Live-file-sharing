// Client-side code (index.js)
// Socket connection
const socket = io('http://localhost:3000');
let peerConnection = null;
let dataChannel = null;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Generate random session ID
function generateSessionID() {
    return Math.random().toString(36).substr(2, 9);
}

// Get session ID from URL
function getSessionIDFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("session");
}

// Initialize session
const sessionID = getSessionIDFromURL() || generateSessionID();
if (sessionID) {
    console.log(`Joining session: ${sessionID}`);
    
    // If we're peer A (creating the session), show the link
    if (!getSessionIDFromURL()) {
        const shareableLink = `${window.location.origin}?session=${sessionID}`;
        const linkElement = document.createElement("p");
        linkElement.innerHTML = `Share this link: <a href="${shareableLink}">${shareableLink}</a>`;
        document.body.appendChild(linkElement);
    }
    
    joinSession(sessionID);
}

function joinSession(sessionID) {
    console.log(`Attempting to join session: ${sessionID}`);
    socket.emit("joinSession", { sessionID });
}



socket.on('connect', () => {
    console.log('Connected to signaling server');
});

// Handle start of call (for peer A)
socket.on("startCall", async ({ targetId }) => {
    console.log("Starting call with:", targetId);
    await createOffer(targetId);
});

// Create offer (peer A)
async function createOffer(targetId) {
    peerConnection = new RTCPeerConnection(configuration);
    
    // Create data channel
    dataChannel = peerConnection.createDataChannel("chat");
    setupDataChannel(dataChannel);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("signal", {
                targetId,
                data: { type: "candidate", candidate: event.candidate }
            });
        }
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    socket.emit("signal", {
        targetId,
        data: { type: "offer", offer }
    });
}

// Handle incoming signals
socket.on("signal", async ({ senderId, data }) => {
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(configuration);
        
        // Handle incoming data channel (peer B)
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel(dataChannel);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("signal", {
                    targetId: senderId,
                    data: { type: "candidate", candidate: event.candidate }
                });
            }
        };
    }

    // Handle different signal types
    switch (data.type) {
        case "offer":
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("signal", {
                targetId: senderId,
                data: { type: "answer", answer }
            });
            break;
            
        case "answer":
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            break;
            
        case "candidate":
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
    }
});
const receivedChunks = []; // Array to store incoming file chunks

// Setup data channel
function setupDataChannel(channel) {
    channel.onopen = () => {
        console.log("Data channel is open");
        document.getElementById("status").textContent = "Connected!";
        document.getElementById("chatBox").style.display = "block";
        
        
    };

    channel.onclose = () => {
        console.log("Data channel is closed");
        document.getElementById("status").textContent = "Disconnected";
        document.getElementById("chatBox").style.display = "none";
    };

    channel.onmessage = (event) => {
        if (typeof event.data === "string" && event.data !== "DONE") {
            const message = event.data;
            const messageElement = document.createElement("p");
            messageElement.textContent = `Peer: ${message}`;
            messageElement.classList.add("message");
            document.getElementById("messages").appendChild(messageElement);
            console.log(event.data);
        } else if (event.data === "DONE") {
            console.log("All chunks received. Assembling file...");
            assembleFile();
        } else {
            receivedChunks.push(event.data);
            console.log(`Received chunk ${receivedChunks.length}`);
        }
    };
    dataChannel = channel

}

// Function to reassemble the chunks into a file
function assembleFile() {
    if (receivedChunks.length === 0) return;

    const fileBlob = new Blob(receivedChunks); // Merge chunks into one file

    // Create a downloadable link
    const url = URL.createObjectURL(fileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "received_file"; // Default filename
    a.innerText = "Click to download file sent by other peer"
    document.body.appendChild(a);
    console.log("File successfully reassembled and ready for download!");

    receivedChunks.length = 0; // Clear array after assembly
}

// Send message
function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value;
    
    if (message && dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(message);
        const messageElement = document.createElement("p");
        messageElement.textContent = `You: ${message}`;
        document.getElementById("messages").appendChild(messageElement);
        input.value = "";
    }
}



//Chunk files function
// Function to chunk the file
function chunkFile(file, chunkSize = 64 * 1024) { // Default chunk size: 64 KB
    const chunks = [];
    let start = 0;

    while (start < file.size) {
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end); // Slice the file into chunks
        chunks.push(chunk);
        start = end;
    }

    return chunks; // Return an array of file chunks
}

// Example: Handling file selection and chunking
document.getElementById("fileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (file) {
        console.log(`File selected: ${file.name}, size: ${file.size} bytes`);
        const chunks = chunkFile(file); // Get the chunks
        console.log(`File divided into ${chunks.length} chunks`);

        // Example: Sending metadata (file info) before starting transfer
        const metadata = {
            fileName: file.name,
            fileSize: file.size,
            totalChunks: chunks.length,
        };

        // Send metadata via data channel
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(JSON.stringify({ type: "file-metadata", metadata }));
            console.log("File metadata sent:", metadata);
        }

        // Start sending chunks (we'll handle this part next)
        sendChunks(chunks);
    }
});

// Function to send file chunks via the data channel
async function sendChunks(chunks) {
    let chunkIndex = 0;

    function sendNextChunk() {
        if (chunkIndex < chunks.length) {
            if (dataChannel.readyState === "open" && dataChannel.bufferedAmount === 0) {
                const reader = new FileReader();

                reader.onload = (event) => {
                    const arrayBuffer = event.target.result; // Convert Blob to ArrayBuffer
                    dataChannel.send(arrayBuffer);
                    console.log(`Sent chunk ${chunkIndex + 1}/${chunks.length}`);
                    chunkIndex++;

                    // Send the next chunk after a small delay (prevents congestion)
                    setTimeout(sendNextChunk, 10);
                };

                reader.readAsArrayBuffer(chunks[chunkIndex]); // Read the chunk
            } else {
                // Wait for buffer to clear before resuming
                setTimeout(sendNextChunk, 50);
            }
        } else {
            // All chunks sent, notify receiver
            dataChannel.send("DONE");
            console.log("All chunks sent. Transfer complete.");
        }
    }

    sendNextChunk(); // Start sending chunks
}


























// socket.on('connect',()=>{
//     fileInput = document.getElementById("file-input")

//     fileInput.addEventListener("change",()=>{
//         if (fileInput.files[0]){
//             file = fileInput.files[0];
//             console.log("Sending", file)
//         }
        
//     })
//     file.arryBuffer().then(buffer=>{
//         dataChannel.send(buffer)
//     })
// })

// socket.on("data",(data)=>{
// // Convert the file back to Blob
//   const file = new Blob([ data ]);

//   console.log('Received', file);
//   // Download the received file using downloadjs
//   download(file, 'test.png');

// })




