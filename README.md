<div align="center">

# Live-file-sharing

</div>


This repository contains code for "Live-file-sharing" an application designed for real-time file sharing and communication. It utilizes Node.js with Express for the server and Socket.IO and WebRTC for peer to peer live file sharing..

## Features

-   **File Uploading:** Allows users to upload files to the and other user who is connected via signaling can download the file.
-   **File Chunking:** Chunks file and send it to the other user using array buffer and rearrange all the chunks on the other end
-   **Chating:** Allows users to communicate once they are connected via signaling.
-   **Real-time Communication:** Uses Socket.IO for instant for signaling between two parties and WebRTC for file sharing.

## Table of Contents

-   [Installation](#installation)
-   [Running the Project](#running-the-project)
-   [Contributing](#contributing)


## Installation

To set up the project locally, follow these steps:

1.  Clone the repository:
    ```bash
    git clone https://github.com/mayurexh/Live-file-sharing.git
    ```
2.  Navigate to the `backend` directory:
    ```bash
    cd Live-file-sharing/backend
    ```
3.  Install the dependencies using npm:
    ```bash
    npm install
    ```

## Running the Project

To start the server, use the following command:

```bash
npm start
```

For development, you can use nodemon to automatically restart the server on file changes:

```bash
npm run dev
```

The server will run on the default port (typically 3000 or 8080).

## Contributing

Contributions are welcome! Here's how you can contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Commit your changes with descriptive commit messages.
4.  Push your changes to your fork.
5.  Submit a pull request to the main repository.

