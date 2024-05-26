console.log("LIVE");

const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

const PREFIX = ".s"


// Function to handle continuous input
function getInput() {
	readline.question('Enter a string: ', input => {
		parsing(input);
		getInput(); // Recursively call getInput to ask for input again
	});
}

// Start the input loop
getInput();
