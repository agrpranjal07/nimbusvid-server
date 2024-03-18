# Project Name: Videotube (Backend Project)


## Project Summary:
This project is a comprehensive backend application built using Node.js, Express.js, MongoDB, Mongoose, JWT, Bcrypt, and other technologies. It aims to create a full-fledged video hosting website similar to YouTube with features like user authentication, video upload, like/dislike, commenting, tweeting, subscribing, and more.

## Key Features:
- User authentication using JWT and Bcrypt for secure password hashing.
- Video upload functionality.
- Like and dislike videos.
- Commenting on videos.
- Tweeting and subscribing to other users.
- Utilizes standard practices such as access tokens and refresh tokens.

## Project Duration:
I've dedicated over a month to develop and refine this project.

## Model Design Link:
You can view the design model for this project [here](https://app.eraser.io/workspace/IjuDeHAW1WwnKRJ6Oc0R?origin=share).

## Postman File:
Included in this repository is a Postman collection file (`videotube.postman_collection.json`) for testing and interacting with the backend API.

## PM2 Integration:
The project includes PM2 for process management in production environments. PM2 is used to ensure reliable and efficient execution of the Node.js application.

## Installation:
1. Clone the repository: `git clone https://github.com/agrpranjal07/Videotube_Backend-Project.git`
2. Install dependencies: `npm install`
3. Start the server: `npm start`

## Environment Variables:

To run this project, you will need to set up the following environment variables in a `.env` file at the root of your project:

- `PORT`: The port number on which the server will run (default: `8000`).
- `MONGODB_URI`: The connection URI for your MongoDB database.
- `CORS_ORIGIN`: The allowed origin for Cross-Origin Resource Sharing (CORS) (default: `*`).
- `ACCESS_TOKEN_SECRET`: Secret key for generating access tokens.
- `ACCESS_TOKEN_EXPIRY`: Expiry time for access tokens (e.g., `1d` for 1 day).
- `REFRESH_TOKEN_SECRET`: Secret key for generating refresh tokens.
- `REFRESH_TOKEN_EXPIRY`: Expiry time for refresh tokens (e.g., `10d` for 10 days).
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image/video hosting.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.

Example `.env` file:

```plaintext
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/dbname
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=bfdc443e9efdb8f5700e848f262cca500b40cadf1605292a736f7374f0c38dfa
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=bd8448bc6ecddb722f194e1a926aac3e934d040299cf92c298c4da3
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=dyjhsyblr
CLOUDINARY_API_KEY=285598114231897
CLOUDINARY_API_SECRET=TWg9ZXoCFxfTVWiEsX1KicgpHYs
```

## Usage:
1. Ensure MongoDB is running.
2. Start the server using the provided start script.
3. Access the API endpoints using tools like Postman or integrate them into your frontend application.

## Contributing:
Contributions are welcome! Feel free to open issues or submit pull requests to help improve this project.

## Why I Chose Not to Deploy:
While deploying a project to a server can be beneficial for showcasing and accessibility, I've decided not to deploy this project for several reasons:

1. **Learning Focus**: My primary goal for this project was to gain hands-on experience with backend technologies and development practices. Deploying the project to a server wasn't essential for achieving this goal.

2. **Cost Considerations**: Deploying to a server often involves some cost, especially for cloud hosting services. As this project is for learning and personal use, I preferred to avoid unnecessary expenses.

3. **Time Constraints**: Setting up and maintaining a server can be time-consuming, especially for a complex project like this. I wanted to prioritize development and refinement of the project itself rather than dealing with deployment complexities.

4. **Project Scope**: Since this project is a backend application and doesn't require external access for demonstration purposes, deploying it to a server wasn't a high priority.

## Future Plans:
While I've chosen not to deploy the project at this time, I may revisit this decision in the future. If there's interest from users or potential collaborators, or if I decide to expand the project further, I may consider deploying it to make it more accessible.

## Feedback and Contact:
I welcome any feedback or suggestions for improving this project. If you have questions, ideas, or just want to connect, feel free to reach out to me via email at [myselfpranjal2005@gmail.com](mailto:myselfpranjal2005@gmail.com) or through my [GitHub profile](https://github.com/agrpranjal07).

Thank you for your interest in Videotube (Backend Project)!


## License:
This project is licensed under the [MIT License](LICENSE).
