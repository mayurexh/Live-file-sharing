<div align="center">

# Live-file-sharing

</div>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/actions/nodejs-ci/workflows/Node.js%20CI/badge.svg)](https://github.com/actions/nodejs-ci/actions)
[![Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mayurexh/Live-file-sharing)

</div>

This repository contains the backend code for "Live-file-sharing," an application designed for real-time file sharing and communication. It utilizes Node.js with Express for the server and Socket.IO for enabling live, bidirectional communication between the client and server.

## Features

-   **File Uploading:** Allows users to upload files to the server.
-   **Real-time Communication:** Uses Socket.IO for instant updates and notifications.
-   **Express Routing:** Manages API endpoints for file handling and serving static content.
-   **Middleware Integration:** Employs middleware like `multer` for file management and `cors` for handling Cross-Origin Resource Sharing.

## Table of Contents

-   [Installation](#installation)
-   [Running the Project](#running-the-project)
-   [Dependencies](#dependencies)
-   [Contributing](#contributing)
-   [License](#license)
-   [Contact](#contact)

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

## Dependencies

-   **express**: A fast, unopinionated, minimalist web framework for Node.js.
-   **multer**: Middleware for handling `multipart/form-data`, which is primarily used for uploading files.
-   **socket.io**: Enables real-time, bidirectional communication between web clients and servers.
-   **nodemon**: A tool that automatically restarts the server after detecting file changes in the project, useful during development.

## Contributing

Contributions are welcome! Here's how you can contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Commit your changes with descriptive commit messages.
4.  Push your changes to your fork.
5.  Submit a pull request to the main repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Mayuresh Holay - [mayureshholay@gmail.com](mailto:mayureshholay@gmail.com)
