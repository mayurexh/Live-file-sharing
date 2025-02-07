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
        const message = event.data;
        const messageElement = document.createElement("p");
        messageElement.textContent = `Peer: ${message}`;
        document.getElementById("messages").appendChild(messageElement);
    };
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