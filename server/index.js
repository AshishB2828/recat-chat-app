const http = require('http');
const express = require('express');
// const socketio = require('socket.io');
const cors = require('cors');
const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./Users');


const app =express();

const server = http.createServer(app);

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());
app.use(router);
const PORT = process.env.PORT || 5000;



io.on("connection", socket=>{

    console.log("connection")


    socket.on('join',({name, room}, callback)=>{

        const {user, error} = addUser({id: socket.id, name, room})

        if(error) return callback(error);

        socket.join(user.room)

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        socket.emit("message", {user: 'admin', text:`${user.name}, Welcome to ${user.room}`})
        socket.broadcast.to(user.room).emit("message", {user: 'admin', text:`${user.name},has joined`})
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
            const user = getUser(socket.id)

            io.to(user.room).emit('message', {user: user.name, text: message})
            io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})


            callback()
    })

// Disconnect
    socket.on('disconnect',()=>{
        console.log("user left")
        const user  =removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', {user: 'admin', text:`${user.name} left`})
        }
    })

});


server.listen(PORT, () =>console.log(`listening on port ${PORT}`))
