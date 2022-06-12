import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import http from 'http'
import { Server } from 'socket.io'
import Filter from 'bad-words'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//define paths for express config
const publicDirectoryPath = join(__dirname, '../public')

import express from 'express'
const app = express()
const port = process.env.PORT || 3000
const httpServer = http.createServer(app)
const io = new Server(httpServer)
import msgUtil from './utils/messages.js'
const { generateMessage, generateLocationMessage } = msgUtil
import usrUtil from './utils/users.js'
const { addUser, removeUser, getUser, getUsersInRoom } = usrUtil

//setup static directory to serve
app.use(express.static(publicDirectoryPath))

//following function runs everytime there's a new connection
//'connection' is a type of event
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    //socket.emit, io.emit, socket.broadcast.emit
    //for a room : io.to.emit, socket.broadcast.to.emit

    socket.on('join', (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options })

        if (error)
            return callback(error)

        //join method can only be used from a server not a client
        socket.join(user.room)
        //send message to that specific client/connection
        socket.emit('message', generateMessage('admin', 'Welcome!'))
        //send update to all other clients in that specific room
        socket.broadcast.to(user.room).emit('message', generateMessage('admin', `${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message))
            return callback('Profanity is not allowed!')
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('shareLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.lat},${coords.lon}`))
        callback('Delivered to server')
    })

    //we use socket.on to listen to disconnections
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('admin', `${user.username} has left!`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

httpServer.listen(port, () => {
    console.log(`server is up and running on port ${port}!`)
})
