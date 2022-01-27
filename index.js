const io = require("socket.io")(3001, {
	cors: {
		origin: "*",
	},
});

function CheckForWinner(grid) {
	for (let i = 0; i < 3; i++) {
		for (const key of ["X", "O"]) {
			if (grid[i][0] === key && grid[i][1] === key && grid[i][2] === key)
				return key;
			if (grid[0][i] === key && grid[1][i] === key && grid[2][i] === key)
				return key;
		}
	}
	for (const key of ["X", "O"]) {
		if (grid[0][0] === key && grid[1][1] === key && grid[2][2] === key)
			return key;

		if (grid[0][2] === key && grid[1][1] === key && grid[2][0] === key)
			return key;
	}
  return false
}

function RemoveHost(hostId){
  hosts = hosts.filter((host) => host.id !== hostId);
  io.emit("GetHosts", hosts);
}

let hosts = [];

io.on("connection", (socket) => {
	let roomId;
	console.log("New client connected");
	socket.emit("GetHosts", hosts);

	socket.on("Move", (grid) => {
    let winner = CheckForWinner(grid)
		if(winner)
      io.sockets.in(roomId).emit("Winner", winner);

		socket.to(roomId).emit("Move", grid);
	});

	socket.on("JoinRoom", (id) => {
    roomId = id;
    RemoveHost(roomId)
		socket.join(roomId);
		io.sockets.in(roomId).emit("StartGame");
	});

	socket.on("StartHost", (name) => {
		roomId = socket.client.id;
		socket.join(roomId);
		hosts.push({ owner: name, id: socket.client.id });

		socket.broadcast.emit("NewHost", hosts);
	});

  socket.on("VoteRestart", () => {
    socket.to(roomId).emit("VoteRestart");
  })

  socket.on("RestartGame", () => {
    io.sockets.in(roomId).emit("RestartGame");
  })

  socket.on("ExitGame",() => {
    io.sockets.in(roomId).emit("PlayerLeft");
  })

	socket.on("disconnect", () => {
		RemoveHost(roomId)

		io.sockets.in(roomId).emit("PlayerLeft");

		console.log("Client disconnected");
	});
});
