/**
 * The maze element on the page.
 * @type {HTMLElement}
 */

let maze = document.querySelector(".labyrinth-container");
let ctx = maze.getContext("2d");
let generationComplete = false;
let start
let current;
let goal;
let stepsCount = 0;
let goalReached = false;

/**
 * Represents a maze.
 */
class Maze {
  /**
   * Creates a new instance of Maze.
   * @param {number} size - The size of the maze.
   * @param {number} rows - The number of rows in the maze.
   * @param {number} columns - The number of columns in the maze.
   */
  constructor(size, rows, columns) {
    this.size = size;               // Size of the maze
    this.columns = columns;         // Number of columns
    this.rows = rows;               // Number of rows
    this.grid = [];                 // Grid to store cells
    this.initialCell = undefined    // Initial cell
    this.visitedCells = new Set();  // Set to keep track of visited cells during maze generation
    this.frontierCells = new Set(); // Set to keep track of frontier cells during maze generation
    this.stack = [];                // Stack to keep track of cells during maze generation
  }

  /**
   * Sets up the maze by creating the grid and defining adjacent cells for each cell.
   */
  setup() {
    // Create the maze grid
    for (let r = 0; r < this.rows; r++) {
      let row = [];
      for (let c = 0; c < this.columns; c++) {
        const cell = new Cell(r, c, this.grid, this.size);
        row.push(cell);
      }
      this.grid.push(row);
    }

    // Define adjacent cells for each cell
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        this.grid[r][c].adjacentCells = this.grid[r][c].checkNeighbours();
      }
    }

    // Set a random cell as the starting point
    this.initialCell = this.grid[Math.floor(Math.random() * this.rows)][Math.floor(Math.random() * this.columns)];
    // Set the starting cell as the current cell
    start = this.initialCell;
    current = start
    // Set the goal
    this.grid[Math.floor(Math.random() * this.rows)][Math.floor(Math.random() * this.columns)].goal = true;
  }

  /**
   * Draws the maze on the canvas.
   */
  draw() {
    maze.width = this.size;
    maze.height = this.size;
    maze.style.background = "white";

    // Draw all cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        this.grid[r][c].show(this.size, this.rows, this.columns);
      }
    }
    start.drawStart(this.size, this.rows, this.columns);
  }

  /**
   * Generates the maze using the Prim's algorithm.
   */
  Prim() {
    // Remove the current cell from the frontier, mark it as visited
    this.frontierCells.add(current);
    this.frontierCells.delete(current);
    this.visitedCells.add(current);
    current.status = "visited";

    // Explore neighbors of the current cell
    for (let c of current.adjacentCells) {
      if (c.status === "unvisited") {
        // Add unvisited neighbors to the frontier
        this.frontierCells.add(c);
        c.status = "frontier";
        c.connectedCells.push(current);
      } else if (c.status === "frontier") {
        // Add the current cell to the connected cells of frontier cells
        c.connectedCells.push(current);
      }
    }

    // Choose a random frontier cell and connect it with a random connected cell
    let iterable = [...this.frontierCells.values()];
    let randomIndex = Math.floor(Math.random() * iterable.length);
    let frontierCell = iterable[randomIndex];
    if (frontierCell) {
      let randomConn = Math.floor(
        Math.random() * frontierCell.connectedCells.length
      );
      let randomCell = frontierCell.connectedCells[randomConn];
      frontierCell.removeWalls(frontierCell, randomCell);
      current = frontierCell;
    }

    // Clear the canvas and redraw the maze
    ctx.clearRect(0, 0, maze.width, maze.height);
    this.draw();

    // Continue the generation if there are still frontier cells
    if (this.frontierCells.size > 0) {
      // Use setTimeout for a delay before the next iteration
      window.setTimeout(() => {
        newMaze.Prim();
      }, 1);
    } else {
      // Generation complete
      console.log("Prim generation complete!");
    }
  }


  /**
   * Generates the maze using the Depth-First Search (DFS) algorithm.
   */
  DFS() {
    // Mark the current cell as visited
    current.status = "visited";
    let next;
    let neighbours = current.checkNeighbours();

    if (neighbours) {
      // Choose a random unvisited neighbor  
      let random = Math.floor(Math.random() * neighbours.length);
      next = neighbours[random];
    }

    if (next) {
      next.status = "visited";
      // Push the current cell to the stack
      this.stack.push(current);
      current.removeWalls(current, next);
      current = next;
    } else if (this.stack.length > 0) {
      // Pop a cell from the stack if there are no unvisited neighbors
      let cell = this.stack.pop();
      current = cell;
    }

    // Clear the canvas and redraw the maze
    ctx.clearRect(0, 0, maze.width, maze.height);
    this.draw();
    if (this.stack.length === 0) {
      // Generation complete
      console.log("DFS generation complete!");
      generationComplete = true;
      return;
    }

    window.requestAnimationFrame(() => {
        newMaze.DFS();
      });
    }

}

// Class representing a cell in the maze
class Cell {
  constructor(rowNum, colNum, parentGrid, parentSize) {
    this.rowNum = rowNum;        // Row number of the cell
    this.colNum = colNum;        // Column number of the cell
    this.status = "unvisited";   // Status of the cell (visited, frontier, unvisited)
    this.walls = {               // Walls surrounding the cell
      topWall: true,
      rightWall: true,
      bottomWall: true,
      leftWall: true,
    };
    this.goal = false;           // Indicates if the cell is the goal
    this.parentGrid = parentGrid; // Reference to the parent grid
    this.parentSize = parentSize; // Size of the parent maze
    this.adjacentCells = [];      // List of neighboring cells
    this.connectedCells = [];     // List of connected cells during maze generation
  }

  // Check neighboring cells that haven't been visited
  checkNeighbours() {
    const grid = this.parentGrid;
    const row = this.rowNum;
    const col = this.colNum;
    const neighbours = [];

    const top = row !== 0 ? grid[row - 1][col] : undefined;
    const right = col !== grid[0].length - 1 ? grid[row][col + 1] : undefined;
    const bottom = row !== grid.length - 1 ? grid[row + 1][col] : undefined;
    const left = col !== 0 ? grid[row][col - 1] : undefined;

    if (top && top.status === "unvisited") neighbours.push(top);
    if (right && right.status === "unvisited") neighbours.push(right);
    if (bottom && bottom.status === "unvisited") neighbours.push(bottom);
    if (left && left.status === "unvisited") neighbours.push(left);

    if (neighbours.length > 0) {
      return neighbours;
    } else {
      return undefined; // No unvisited neighbors found
    }
  }

  // Draw the red dot to indicate the starting position
  drawStart(size, columns, rows) {
    const x = (this.colNum * size) / columns + size / (2 * columns);
    const y = (this.rowNum * size) / rows + size / (2 * rows);

    ctx.beginPath();
    ctx.arc(x, y, size / (3 * columns), 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  }

  // Draw a wall between two points
  drawWall(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Draw the cell with its walls
  drawCell(x, y, size, columns, rows) {
    const x1 = x;
    const y1 = y;
    const x2 = x + size / columns;
    const y2 = y;
    const x3 = x + size / columns;
    const y3 = y + size / rows;
    const x4 = x;
    const y4 = y + size / rows;

    // If the cell has a top wall, draw a line from (x1, y1) to (x2, y2)
    if (this.walls.topWall) this.drawWall(x1, y1, x2, y2);
    // If the cell has a right wall, draw a line from (x2, y2) to (x3, y3)
    if (this.walls.rightWall) this.drawWall(x2, y2, x3, y3);
    // If the cell has a bottom wall, draw a line from (x3, y3) to (x4, y4)
    if (this.walls.bottomWall) this.drawWall(x3, y3, x4, y4);
    // If the cell has a left wall, draw a line from (x4, y4) to (x1, y1)
    if (this.walls.leftWall) this.drawWall(x4, y4, x1, y1);
  }

  // Remove walls between two connected cells
  removeWalls(cell1, cell2) {
    // compares to two cells on x axis
    let x = cell1.colNum - cell2.colNum;
    // Removes the relevant walls if there is a different on x axis
    if (x === 1) {
      cell1.walls.leftWall = false;
      cell2.walls.rightWall = false;
    } else if (x === -1) {
      cell1.walls.rightWall = false;
      cell2.walls.leftWall = false;
    }
    // compares to two cells on x axis
    let y = cell1.rowNum - cell2.rowNum;
    // Removes the relevant walls if there is a different on x axis
    if (y === 1) {
      cell1.walls.topWall = false;
      cell2.walls.bottomWall = false;
    } else if (y === -1) {
      cell1.walls.bottomWall = false;
      cell2.walls.topWall = false;
    }
  }

  // Show the cell on the canvas
  show(size, rows, columns) {
    const x = (this.colNum * size) / columns;
    const y = (this.rowNum * size) / rows;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    this.drawCell(x, y, size, columns, rows);

    // Fill the cell based on its status
    if (this.status === "visited") {
      ctx.fillStyle = "white";
      ctx.fillRect(x + 1, y + 1, size / columns - 2, size / rows - 2);
    }
    if (this.goal) {
      ctx.fillStyle = "rgb(83, 247, 43)";
      ctx.fillRect(x + 1, y + 1, size / columns - 2, size / rows - 2);
    }
  }
}



// When the DOM is loaded, add an event listener to the "Start" button
document.addEventListener("DOMContentLoaded", function () {
  // Add an event listener to the "Start" button
  const generateMazeButton = document.getElementById("generateMaze");
  const mazeSizeMenu = document.getElementById("mazeSize");
  let size;

  // Liste des tailles que vous souhaitez prendre en charge
  const availableSizes = [5, 10, 15, 20, 30, 50, 70];

  // Remplissez dynamiquement le sélecteur avec les options
  availableSizes.forEach(size => {
    const option = document.createElement("option");
    option.value = size;
    option.text = `${size}x${size}`;
    mazeSizeMenu.add(option);
  });

  mazeSizeMenu.addEventListener("change", function () {
    // Mettez à jour la variable size lorsque la taille du labyrinthe est modifiée
    size = this.value;
  });

  generateMazeButton.addEventListener("click", function () {
    // Get the selected algorithm from the dropdown menu
    const menu = document.getElementById("dropdown");
    const selectedAlgorithm = menu.value;

     // Si la taille n'a pas été sélectionnée, utilisez la première taille de la liste
     if (!size) {
      size = availableSizes[0];
      mazeSizeMenu.value = size;
    }

    newMaze = new Maze(3000, size, size);
    newMaze.setup(); // Setup and draw the maze initially

    // Choose the algorithm based on the user's selection
    if (selectedAlgorithm === "prim") {
      newMaze.Prim();
    } else if (selectedAlgorithm === "dfs") {
      newMaze.DFS();
    }
  });
});

// When the DOM is loaded, add an event listener to the "Reset" button
document.addEventListener("DOMContentLoaded", function () {
  // Get the "Reset" button by its ID
  const resetMazeButton = document.getElementById("resetMaze");

  // Add an event listener for the "Reset" button click
  resetMazeButton.addEventListener("click", function () {
    // Reset the starting position to the beginning of the maze
    start = newMaze.initialCell;

    // Clear the canvas and redraw the maze with the new starting position
    ctx.clearRect(0, 0, maze.width, maze.height);
    newMaze.draw();
    start.drawStart(newMaze.size, newMaze.columns, newMaze.rows);

    // Reset goalReached to false
    goalReached = false;

    // Reset the stepsCount to zero
    stepsCount = 0;
  });
});



// When the DOM is loaded, add an event listener to move the red dot with the arrow keys
document.addEventListener("keydown", function(event) {
  // Check if the goal has already been reached
  if (goalReached) {
    return;  // Exit the function if the goal has already been reached
  }

  const stepSize = newMaze.size / newMaze.columns;

  switch (event.key) {
    case "ArrowUp":
      // Move up if there is no top wall
      if (start.rowNum > 0 && !start.walls.topWall) {
        start = newMaze.grid[start.rowNum - 1][start.colNum];
        stepsCount++;
      }
      break;
    case "ArrowDown":
      // Move down if there is no bottom wall
      if (start.rowNum < newMaze.rows - 1 && !start.walls.bottomWall) {
        start = newMaze.grid[start.rowNum + 1][start.colNum];
        stepsCount++;
      }
      break;
    case "ArrowLeft":
      // Move left if there is no left wall
      if (start.colNum > 0 && !start.walls.leftWall) {
        start = newMaze.grid[start.rowNum][start.colNum - 1];
        stepsCount++;
      }
      break;
    case "ArrowRight":
      // Move right if there is no right wall
      if (start.colNum < newMaze.columns - 1 && !start.walls.rightWall) {
        start = newMaze.grid[start.rowNum][start.colNum + 1];
        stepsCount++;
      }
      break;
    default:
      break;
  }

  // Clear the canvas and redraw the maze with the new starting position
  ctx.clearRect(0, 0, maze.width, maze.height);
  newMaze.draw();
  start.drawStart(newMaze.size, newMaze.columns, newMaze.rows);

  // Check if the goal is reached
  if (start.goal) {
    goalReached = true;  // Set the variable to true to not display the message again
    alert(`Congratulations! You reached the goal in ${stepsCount} steps.`);
  }
});
