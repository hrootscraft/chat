//client side socket enables data (/event) transfer to and from server
const socket = io()

//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocButton = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = ()=>{
    //new mesage element
    const $newMessage = $messages.lastElementChild
    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //visible height
    const visibleHeight = $messages.offsetHeight
    //height of messages container
    const containerHeight = $messages.scrollHeight
    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    //was i at the bottom before the last message was added
    if(containerHeight-newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message : message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message)=>{
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    //disable the form after sending message and until the action is completed
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        //clear the message after being sent
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error)
            return console.log(error)
        console.log('Message Delivered!')
    })
})

$shareLocButton.addEventListener('click', ()=>{
    if(!navigator.geolocation)
        return alert('Geolocation is not supported by your browser.')

    //disable the form after sharing location and until the action is completed
    $shareLocButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('shareLocation', {
            lat: position.coords.latitude, 
            lon: position.coords.longitude
        }, (msg)=>{
            $shareLocButton.removeAttribute('disabled')
            console.log('Location Shared from Client!', msg)
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if (error) {
        alert(error)
        location.href = '/'
    }
})
