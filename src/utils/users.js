const users = [];

//returns an object with either an error or the user
const addUser = ({ id, username, room }) => {
  //clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  //validate the data
  if (!username || !room) return { error: "Username and Room are required!" };

  //check for existing user with the same name in the same room
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  //validate username
  if (existingUser) return { error: "Username is in use! " };

  //store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

//returns undefined if no user found, else an object
const getUser = (id) => {
  return users.find((user) => user.id === id);
};

//returns an array of objects if room is found, else an empty array
const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase();
  return users.filter((user) => user.room === room);
};

export default {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
