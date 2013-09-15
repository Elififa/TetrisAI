/*
 * PROJECT:  JsTetris
 * VERSION:  1.19
 * LICENSE:  BSD (revised)
 * AUTHOR:  (c) 2004-2009 Cezary Tomczak
 * LINK:  http://www.gosu.pl/tetris/
 *
 * This script can be used freely as long as all
 * copyright messages are intact.
 */

/*
 * NOTE: This file differs from the original.
 *       Modified to run AI module (see a file AIModule.js).
 */


function Tetris()
{
	var self = this;

	this.unit  = 25; // unit = x pixels
	this.areaX = 12; // area width = x units
	this.areaY = 22; // area height = y units

	// parameters for AI
	this.trainingGamesNumber = 3;
	this.maxScore = 255;
	this.actionOfAICycle = 6;
	this.anAIModule = new AIModule(this.areaX, this.areaY);

	this.stats = new Stats();
	this.statsAccel = new StatsAccel(this.trainingGamesNumber);
	this.puzzle = null;
	this.area = null;
	this.puzzleAccel = null;
	this.areaAccel = null;

	this.paused = true;
	this.training = false;
	this.gameOverFlag = true;
	this.i;

	/**
	 * @return void
	 * @access public event
	 */
	
	this.start = function()
	{
		if (self.training == true) { return; }
		if (self.gameOverFlag != true) { return; }
		document.getElementById("tetris-keys").style.display = "none";
		document.getElementById("tetris-a-stats").style.display = "none";
		document.getElementById("tetris-gameover").style.display = "none";
		document.getElementById("tetris-nextpuzzle").style.display = "none";
		document.getElementById("tetris-keys2").style.display = "block";
		document.getElementById("tetris-b-stats").style.display = "block";
		if (self.puzzleAccel) {	self.puzzleAccel = null; }
		if (self.areaAccel) { self.areaAccel = null; }
		self.statsAccel.reset();
		self.paused = false;
		document.getElementById('tetris-pause').style.display = 'block';
		document.getElementById('tetris-resume').style.display = 'none';
		self.training = true;
		self.i = 0;
		self.statsAccel.setGamesCount(0);
		self.gameOverFlag = false;
		self.areaAccel = new AreaAccel(self.areaX, self.areaY);
		self.puzzleAccel = new PuzzleAccel(self, self.areaAccel);
		if (self.areaAccel && self.puzzleAccel && self.puzzleAccel.mayPlace()) {
			self.puzzleAccel.place();
		} else {
			self.gameOverFlag = true;
		}
		self.anAIModule.prepareForANewGame();
		self.continueATrainingGame();
	};
	
	this.continueATrainingGame = function()
	{
		if (!self.gameOverFlag) {
			if (!self.paused) {
				self.actionOfAICycle = self.anAIModule.doAICycle(self.areaAccel, self.puzzleAccel, self.statsAccel, self.actionOfAICycle);
				self.doAIActionsAccel();
				self.statsAccel.incActionsCount();
				self.actionOfAICycle = self.anAIModule.doAICycle(self.areaAccel, self.puzzleAccel, self.statsAccel, self.actionOfAICycle);           
				self.doAIActionsAccel();
				self.statsAccel.incActionsCount();
				self.puzzleAccel.forceMoveDown()
				self.puzzleAccel.fallDown();
			}
			setTimeout(self.continueATrainingGame, 10);
		} else {
			self.continueStart();
		}
	};

	this.continueStart = function()
	{
		self.statsAccel.incGamesCount();
		self.statsAccel.setActionsCount(0);
		self.i++;
		if (self.i < self.trainingGamesNumber) {
			self.gameOverFlag = false;
			self.areaAccel = new AreaAccel(self.areaX, self.areaY);
			self.puzzleAccel = new PuzzleAccel(self, self.areaAccel);
			if (self.areaAccel && self.puzzleAccel && self.puzzleAccel.mayPlace()) {
				self.puzzleAccel.place();
			} else {
				self.gameOverFlag = true;
			}
			self.anAIModule.prepareForANewGame();
			self.continueATrainingGame();
		} else {
			self.continueStart2();
		}
	};

	this.continueStart2 = function()
	{
		if (self.gameOverFlag) {
			setTimeout(self.continueStart2, 1000);
			self.gameOverFlag = false;
		} else {
			document.getElementById("tetris-b-stats").style.display = "none";
			document.getElementById("tetris-keys2").style.display = "none";
			document.getElementById("tetris-gameover").style.display = "none";
			document.getElementById("tetris-nextpuzzle").style.display = "block";
			document.getElementById("tetris-a-stats").style.display = "block";
			self.anAIModule.prepareForANewGame();
			if (self.puzzle) {
				self.puzzle.destroy(); 
				self.puzzle = null;
			}
			if (self.area) {
				self.area.destroy();
				self.area = null;
			}
			self.stats.reset();
			self.stats.start();
			self.paused = false;
			document.getElementById('tetris-pause').style.display = 'block';
			document.getElementById('tetris-resume').style.display = 'none';
			self.training = false;
			self.area = new Area(self.unit, self.areaX, self.areaY, "tetris-area");
			self.puzzle = new Puzzle(self, self.area);
			if (self.area && self.puzzle && self.puzzle.mayPlace()) {
				self.puzzle.place();
			} else {
				self.gameOver();
			}
		}
	};

	this.doAIActions = function()
	{
		switch (self.actionOfAICycle) {
			case 2 : self.up(); break;
		    case 5 : self.down(); break;
		    case 4 : self.left(); break;
		    case 1 : self.right(); break;
			case 7 : self.space(); break;
			default : break;
		}
	}
	
	this.doAIActionsAccel = function()
	{
		switch (self.actionOfAICycle) {
			case 2 : if (self.puzzleAccel.running && self.puzzleAccel.mayRotate()) {
						self.puzzleAccel.rotate();
					}
 					break;
		    case 5 : if (self.puzzleAccel.running) {
						if (self.puzzleAccel.mayMoveDown()) {
							self.puzzleAccel.moveDown();
						} else {
							self.puzzleAccel.running = false;
						}
					}
					break;
		    case 4 : if (self.puzzleAccel.running && self.puzzleAccel.mayMoveLeft()) {
						self.puzzleAccel.moveLeft();
					}
					break;
		    case 1 : if (self.puzzleAccel.running && self.puzzleAccel.mayMoveRight()) {
						self.puzzleAccel.moveRight();
					}
					break;
			case 7 : if (self.puzzleAccel.running) {
						self.puzzleAccel.running = false;
					}
					break;
			default : break;
		}
	}

	/**
	 * Pause / Resume.
	 * @return void
	 * @access public event
	 */
	this.pause = function()
	{
		if (self.gameOverFlag) { return; }
		if (self.training) {
			if (self.paused) {
				self.paused = false;
				document.getElementById('tetris-pause').style.display = 'block';
				document.getElementById('tetris-resume').style.display = 'none';
			} else {
				self.paused = true;
				document.getElementById('tetris-pause').style.display = 'none';
				document.getElementById('tetris-resume').style.display = 'block';
			}
		} else {
			if (self.paused) {
				self.paused = false;
				document.getElementById('tetris-pause').style.display = 'block';
				document.getElementById('tetris-resume').style.display = 'none';
				self.stats.start();
				if (self.puzzle.running) {
					self.puzzle.fallDownID = setTimeout(self.puzzle.fallDown, self.puzzle.speed >> 1);
				} else {
					self.puzzle.forceMoveDownID = setTimeout(self.puzzle.forceMoveDown, 15);
				}
				
			} else {
				self.paused = true;
				document.getElementById('tetris-pause').style.display = 'none';
				document.getElementById('tetris-resume').style.display = 'block';
				self.stats.stop();
				if (self.puzzle.fallDownID) clearTimeout(self.puzzle.fallDownID);
				if (self.puzzle.forceMoveDownID) clearTimeout(self.puzzle.forceMoveDownID);
			}
		}
	};

	/**
	 * End game.
	 * Stop stats, ...
	 * @return void
	 * @access public event
	 */
	this.gameOver = function()
	{
		this.gameOverFlag = true;
		this.paused = true;
		this.stats.stop();
		document.getElementById("tetris-nextpuzzle").style.display = "none";
		document.getElementById("tetris-keys2").style.display = "none";
		document.getElementById("tetris-gameover").style.display = "block";
	};

	/**
	 * @return void
	 * @access public event
	 */
	this.up = function()
	{
		if (self.puzzle && (!self.paused) && self.puzzle.running) {
			if (self.puzzle.mayRotate()) {
				self.puzzle.rotate();
				self.stats.setActions(self.stats.getActions() + 1);
			}
		}
	};

	/**
	 * @return void
	 * @access public event
	 */
	this.down = function()
	{
		if (self.puzzle && (!self.paused) && self.puzzle.running) {
			if (self.puzzle.mayMoveDown()) {
				self.puzzle.moveDown();
				self.stats.setActions(self.stats.getActions() + 1);
			} else {
				self.puzzle.running = false;
			}
		}
	};

	/**
	 * @return void
	 * @access public event
	 */
	this.left = function()
	{
		if (self.puzzle && (!self.paused) && self.puzzle.running) {
			if (self.puzzle.mayMoveLeft()) {
				self.puzzle.moveLeft();
				self.stats.setActions(self.stats.getActions() + 1);
			}
		}
	};

	/**
	 * @return void
	 * @access public event
	 */
	this.right = function()
	{
		if (self.puzzle && (!self.paused) && self.puzzle.running) {
			if (self.puzzle.mayMoveRight()) {
				self.puzzle.moveRight();
				self.stats.setActions(self.stats.getActions() + 1);
			}
		}
	};

	/**
	 * @return void
	 * @access public event
	 */
	this.space = function()
	{
		if (self.puzzle && (!self.paused) && self.puzzle.running) {
			self.stats.setActions(self.stats.getActions() + 1);
			self.puzzle.running = false;
		}
	};
	

	// windows
	var helpwindow = new Window("tetris-help");

	// game menu
	document.getElementById("tetris-menu-start").onclick = function() { helpwindow.close(); self.start(); this.blur(); };
	document.getElementById("tetris-menu-pause").onclick = function() { self.pause(); this.blur(); };
	document.getElementById("tetris-menu-resume").onclick = function() { self.pause(); this.blur(); };

	// help
	document.getElementById("tetris-menu-help").onclick = function() { helpwindow.activate(); this.blur(); };
	document.getElementById("tetris-help-close").onclick = helpwindow.close;

	// keyboard
	var keyboard = new Keyboard();
	keyboard.set(keyboard.n, this.start);
	keyboard.set(keyboard.p, this.pause);
	/*
	keyboard.set(keyboard.up, this.up);
	keyboard.set(keyboard.down, this.down);
	keyboard.set(keyboard.left, this.left);
	keyboard.set(keyboard.right, this.right);
	keyboard.set(keyboard.space, this.space);
	*/
	document.onkeydown = keyboard.event;

	/**
	 * Window replaces game area, for example help window
	 * @param string id
	 */
	function Window(id)
	{
		this.id = id;
		this.el = document.getElementById(this.id);
		var self = this;

		/**
		 * Activate or deactivate a window - update html
		 * @return void
		 * @access event
		 */
		this.activate = function()
		{
			self.el.style.display = (self.el.style.display == "block" ? "none" : "block");
		};

		/**
		 * Close window - update html
		 * @return void
		 * @access event
		 */
		this.close = function()
		{
			self.el.style.display = "none";
		};

		/**
		 * @return bool
		 * @access public
		 */
		this.isActive = function()
		{
			return (self.el.style.display == "block");
		};
	}

	/**
	 * Assigning functions to keyboard events
	 * When key is pressed, searching in a table if any function has been assigned to this key, execute the function.
	 */
	function Keyboard()
	{
		this.up = 38;
		this.down = 40;
		this.left = 37;
		this.right = 39;
		this.n = 78;
		this.p = 80;
		this.r = 82;
		this.space = 32;
		this.f12 = 123;
		this.escape = 27;

		this.keys = [];
		this.funcs = [];

		var self = this;

		/**
		 * @param int key
		 * @param function func
		 * @return void
		 * @access public
		 */
		this.set = function(key, func)
		{
			this.keys.push(key);
			this.funcs.push(func);
		};

		/**
		 * @param object e
		 * @return void
		 * @access event
		 */
		this.event = function(e)
		{
			if (!e) { e = window.event; }
			for (var i = 0; i < self.keys.length; i++) {
				if (e.keyCode == self.keys[i]) {
					self.funcs[i]();
				}
			}
		};
	}

	/**
	 * Live game statistics
	 * Updating html
	 */
	function Stats()
	{
		var self = this;

		this.level;
		this.time;
		this.apm;
		this.lines;
		this.score;
		this.puzzles; // number of puzzles created on current level

		this.actions;

		this.el = {
			"level": document.getElementById("tetris-stats-level"),
			"time":  document.getElementById("tetris-stats-time"),
			"apm":  document.getElementById("tetris-stats-apm"),
			"lines": document.getElementById("tetris-stats-lines"),
			"score": document.getElementById("tetris-stats-score")
		}

		this.timerId = null;

		/**
		 * Start counting statistics, reset stats, turn on the timer
		 * @return void
		 * @access public
		 */
		this.start = function()
		{
			this.timerId = setInterval(this.incTime, 1000);
		};

		/**
		 * Stop counting statistics, turn off the timer
		 * @return void
		 * @access public
		 */
		this.stop = function()
		{
			if (this.timerId) {
				clearInterval(this.timerId);
			}
		};

		/**
		 * Reset statistics - update html
		 * @return void
		 * @access public
		 */
		this.reset = function()
		{
			this.stop();
			this.level = 1;
			this.time  = 0;
			this.apm   = 0;
			this.lines = 0;
			this.score = 0;
			this.puzzles = 0;
			this.actions = 0;
			this.el.level.innerHTML = this.level;
			this.el.time.innerHTML = this.time;
			this.el.apm.innerHTML = this.apm;
			this.el.lines.innerHTML = this.lines;
			this.el.score.innerHTML = this.score;
		};

		/**
		 * Increase time, update apm - update html
		 * This func is called by setInterval()
		 * @return void
		 * @access public event
		 */
		this.incTime = function()
		{
			self.time++;
			self.el.time.innerHTML = self.time;
			self.apm = parseInt((self.actions / self.time) * 60);
			self.el.apm.innerHTML = self.apm;
		};

		/**
		 * Set score - update html
		 * @param int i
		 * @return void
		 * @access public
		 */
		this.setScore = function(i)
		{
			this.score = i;
			this.el.score.innerHTML = this.score;
		};

		/**
		 * Set level - update html
		 * @param int i
		 * @return void
		 * @access public
		 */
		this.setLevel = function(i)
		{
			this.level = i;
			this.el.level.innerHTML = this.level;
		};

		/**
		 * Set lines - update html
		 * @param int i
		 * @return void
		 * @access public
		 */
		this.setLines = function(i)
		{
			this.lines = i;
			this.el.lines.innerHTML = this.lines;
		};

		/**
		 * Number of puzzles created on current level
		 * @param int i
		 * @return void
		 * @access public
		 */
		this.setPuzzles = function(i)
		{
			this.puzzles = i;
		};

		/**
		 * @param int i
		 * @return void
		 * @access public
		 */
		this.setActions = function(i)
		{
			this.actions = i;
		};

		/**
		 * @return int
		 * @access public
		 */
		this.getScore = function()
		{
			return this.score;
		};

		/**
		 * @return int
		 * @access public
		 */
		this.getLevel = function()
		{
			return this.level;
		};

		/**
		 * @return int
		 * @access public
		 */
		this.getLines = function()
		{
			return this.lines;
		};

		/**
		 * Number of puzzles created on current level
		 * @return int
		 * @access public
		 */
		this.getPuzzles = function()
		{
			return this.puzzles;
		};

		/**
		 * @return int
		 * @access public
		 */
		this.getActions = function()
		{
			return this.actions;
		};
	}

	function StatsAccel(trainingGamesNumber)
	{
		var self = this;

		this.score;
		this.level;
		this.lines;
		this.puzzles;
		this.gamesCount;
		this.maxGamesCount = trainingGamesNumber;
		this.actionsCount;
		
		
		this.el = {
			"gamesCount": document.getElementById("tetris-stats-games"),
			"apg": document.getElementById("tetris-stats-apg"),
			"actionsCount": document.getElementById("tetris-stats-actions"),
			"progress": document.getElementById("tetris-stats-progress")
		}

		this.reset = function()
		{
			this.score = 0;
			this.level = 1;
			this.lines = 0;
			this.puzzles = 0;
			this.gamesCount = 0;
			this.actionsCount = 0;
			this.actionsCountSum = 0;
			this.el.actionsCount.innerHTML = 0;
			this.el.gamesCount.innerHTML = 0;
			this.el.apg.innerHTML = 0;
			this.el.progress.innerHTML = "0%";
		};

		this.incActionsCount = function()
		{
			this.actionsCount++;
			this.actionsCountSum++;
			this.el.actionsCount.innerHTML = this.actionsCount;
		};

		this.incGamesCount = function()
		{
			this.gamesCount++;
			this.el.gamesCount.innerHTML = this.gamesCount;
			this.el.progress.innerHTML = Math.round((this.gamesCount / this.maxGamesCount) * 100) + '%';
			this.el.apg.innerHTML = Math.round(this.actionsCountSum / this.gamesCount);
		};

		this.setActionsCount = function(i)
		{
			this.actionsCount = i;
		};

		this.setGamesCount = function(i)
		{
			this.gamesCount = i;
		};

		this.setScore = function(i)
		{
			this.score = i;
		};

		this.setLevel = function(i)
		{
			this.level = i;
		};

		this.setLines = function(i)
		{
			this.lines = i;
		};

		this.setPuzzles = function(i)
		{
			this.puzzles = i;
		};

		this.getScore = function()
		{
			return this.score;
		};

		this.getLevel = function()
		{
			return this.level;
		};

		this.getLines = function()
		{
			return this.lines;
		};

		this.getPuzzles = function()
		{
			return this.puzzles;
		};
	}

	/**
	 * Area consists of blocks (2 dimensional board).
	 * Block contains "0" (if empty) or Html Object.
	 * @param int x
	 * @param int y
	 * @param string id
	 */
	function Area(unit, x, y, id)
	{
		this.unit = unit;
		this.x = x;
		this.y = y;
		this.el = document.getElementById(id);

		this.board = [];

		// create 2-dimensional board
		for (var y = 0; y < this.y; y++) {
			this.board.push(new Array());
			for (var x = 0; x < this.x; x++) {
				this.board[y].push(0);
			}
		}

		this.cloneBoard = function()
		{
			var cloneb = []
			for (var y = 0; y < this.y; y++) {
				this.cloneb.push(new Array());
				for (var x = 0; x < this.x; x++) {
					cloneb[y].push(this.board[y][x]);
				}
			}
			return cloneb;
		}

		/**
		 * Removing html elements from area.
		 * @return void
		 * @access public
		 */
		this.destroy = function()
		{
			for (var y = 0; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						this.el.removeChild(this.board[y][x]);
						this.board[y][x] = 0;
					}
				}
			}
		};

		/**
		 * Searching for full lines.
		 * Must go from the bottom of area to the top.
		 * Returns the number of lines removed - needed for Stats.score.
		 * @see isLineFull() removeLine()
		 * @return void
		 * @access public
		 */
		this.removeFullLines = function()
		{
			var lines = 0;
			for (var y = this.y - 1; y >= 0; y--) {
				if (this.isLineFull(y)) {
					this.removeLine(y);
					lines++;
					y++;
				}
			}
			return lines;
		};

		/**
		 * @param int y
		 * @return bool
		 * @access public
		 */
		this.isLineFull = function(y)
		{
			for (var x = 0; x < this.x; x++) {
				if (!this.board[y][x]) { return false; }
			}
			return true;
		};

		/**
		 * Remove given line
		 * Remove html objects
		 * All lines that are above given line move down by 1 unit
		 * @param int y
		 * @return void
		 * @access public
		 */
		this.removeLine = function(y)
		{
			for (var x = 0; x < this.x; x++) {
				if (this.board[y][x]) {
					this.el.removeChild(this.board[y][x]);
					this.board[y][x] = 0;
				}
			}
			y--;
			for (; y >= 0; y--) {
				for (var x = 0; x < this.x; x++) {
					if (this.board[y][x]) {
						var el = this.board[y][x];
						el.style.top = el.offsetTop + this.unit + "px";
						this.board[y+1][x] = el;
						this.board[y][x] = 0;   // because a condition above does not move zeros
					}
				}
			}
		};

		/**
		 * @param int y
		 * @param int x
		 * @return mixed 0 or Html Object
		 * @access public
		 */
		this.getBlock = function(y, x)
		{
			if (y < 0) { return 0; }
			if (x >= 0 && y < this.y && x < this.x) {
				return this.board[y][x];
			} else {
				throw "Area.getBlock("+y+", "+x+") failed";
			}
		};

		this.setBlock = function(y, x, bl)
		{
			if (y >= 0 && x >= 0 && y < this.y && x < this.x) {
				this.board[y][x] = bl;
			} else {
				throw "Area.setBlock("+y+", "+x+") failed";
			}
 		};

		/**
		 * Add Html Element to the area.
		 * Find (x,y) position using offsetTop and offsetLeft
		 * @param object el
		 * @return void
		 * @access public
		 */
		this.addElement = function(el)
		{
			var x = parseInt(el.offsetLeft / this.unit);
			var y = parseInt(el.offsetTop / this.unit);
			if (y >= 0 && y < this.y && x >= 0 && x < this.x) {
				this.board[y][x] = el;
			} else {
				// not always an error ..
			}
		};
	}

	function AreaAccel(x, y)
	{
		this.x = x;
		this.y = y;
		
		this.board = [];

		for (var y = 0; y < this.y; y++) {
			this.board.push(new Array());
			for (var x = 0; x < this.x; x++) {
				this.board[y].push(0);
			}
		}

		this.cloneBoard = function()
		{
			var cloneb = []
			for (var y = 0; y < this.y; y++) {
				this.cloneb.push(new Array());
				for (var x = 0; x < this.x; x++) {
					cloneb[y].push(this.board[y][x]);
				}
			}
			return cloneb;
		}
		
		/**
		 * @return void
		 * @access public
		 */
		this.destroy = function()
		{
			for (var y = 0; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					this.board[y][x] = 0;
				}
			}
		};

		this.removeFullLines = function()
		{
			var lines = 0;
			for (var y = this.y - 1; y >= 0; y--) {
				if (this.isLineFull(y)) {
					this.removeLine(y);
					lines++;
					y++;
				}
			}
			return lines;
		};

		this.isLineFull = function(y)
		{
			for (var x = 0; x < this.x; x++) {
				if (!this.board[y][x]) { return false; }
			}
			return true;
		};

		this.removeLine = function(y)
		{
			y--;
			for (; y >= 0; y--) {
				for (var x = 0; x < this.x; x++) {
					this.board[y+1][x] = this.board[y][x];
				}
			}
			for (var x = 0; x < this.x; x++) {
				this.board[0][x] = 0;
			}
		};

		this.getBlock = function(y, x)
		{
			if (y < 0) { return 0; }
			if (x >= 0 && y < this.y && x < this.x) {
				return this.board[y][x];
			} else {
				throw "AreaAccel.getBlock("+y+", "+x+") failed";
			}
		};

		this.setBlock = function(y, x, bl)
		{
			if (y >= 0 && x >= 0 && y < this.y && x < this.x) {
				this.board[y][x] = bl;
			} else {
				throw "AreaAccel.setBlock("+y+", "+x+") failed";
			}
 		};
	}

	function Puzzle(tetris, area)
	{
		var self = this;
		this.tetris = tetris;
		this.area = area;

		// timeout ids
		this.fallDownID = null;
		this.forceMoveDownID = null;

		this.type = null; // 0..6
		this.nextType = null; // next puzzle
		this.speed = null;
		this.running = null;
		this.skipping = false;

		this.board = []; // filled with html elements after placing on area
		this.elements = [];
		this.nextElements = []; // next board elements

		// (x,y) position of the puzzle (top-left)
		this.x = null;
		this.y = null;

		// width & height must be the same
		this.puzzles = [
			[
				[0,0,1],
				[1,1,1],
				[0,0,0]
			],
			[
				[1,0,0],
				[1,1,1],
				[0,0,0]
			],
			[
				[0,1,1],
				[1,1,0],
				[0,0,0]
			],
			[
				[1,1,0],
				[0,1,1],
				[0,0,0]
			],
			[
				[0,1,0],
				[1,1,1],
				[0,0,0]
			],
			[
				[1,1],
				[1,1]
			],
			[
				[0,0,0,0],
				[1,1,1,1],
				[0,0,0,0],
				[0,0,0,0]
			]
		];

		/**
		 * Reset puzzle. It does not destroy html elements in this.board.
		 * @return void
		 * @access public
		 */
		this.reset = function()
		{
			if (this.fallDownID) {
				clearTimeout(this.fallDownID);
			}
			if (this.forceMoveDownID) {
				clearTimeout(this.forceMoveDownID);
			}
			this.type = this.nextType;
			this.nextType = Math.floor(Math.random() * this.puzzles.length);
			var puzzle = this.puzzles[this.type];
			var emptyLines = true;
			this.x = (this.area.x - puzzle[0].length) >> 1;
			this.y = 0;
			for (var y = 0; y < puzzle.length; y++) {
				for (var x = 0; x < puzzle[y].length; x++) {
					if (puzzle[y][x]) {
						emptyLines = false;
						break;
					}
				}
				if (emptyLines) {
					this.y--;
				} else {
					break;
				}
			}
			this.speed = 80 + (700 / this.tetris.stats.getLevel());
			this.board = [];
			this.elements = [];
			this.running = true;
			for (var i = 0; i < this.nextElements.length; i++) {
				document.getElementById("tetris-nextpuzzle").removeChild(this.nextElements[i]);
			}
			this.nextElements = [];
		};

		// Init first puzzle
		this.nextType = Math.floor(Math.random() * this.puzzles.length);
		this.reset();

		/**
		 * Check whether new puzzle may be placed on the area.
		 * Find (x,y) in area where beginning of the puzzle will be placed.
		 * Check if first puzzle line (checking from the bottom) can be placed on the area.
		 * @return bool
		 * @access public
		 */
		this.mayPlace = function()
		{
			var puzzle = this.puzzles[this.type];
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < puzzle.length; y++) {
				for (var x = 0; x < puzzle[y].length; x++) {
					if ((puzzle[y][x]) && (this.area.getBlock(this.y + y, this.x + x))) {
						return false;
					}
				}
			}
			return true;
		};

		/**
		 * Create empty board, create blocks in area - html objects, update puzzle board.
		 * Check puzzles on current level, increase level if needed.
		 * @return void
		 * @access public
		 */
		this.place = function()
		{
			// stats
			this.tetris.stats.setPuzzles(this.tetris.stats.getPuzzles() + 1);
			if (this.tetris.stats.getPuzzles() >= (10 + this.tetris.stats.getLevel() * 2)) {
				this.tetris.stats.setLevel(this.tetris.stats.getLevel() + 1);
				this.tetris.stats.setPuzzles(0);
			}
			// create puzzle
			var puzzle = this.puzzles[this.type];
			this.board = this.createEmptyPuzzle(puzzle.length, puzzle[0].length);
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < puzzle.length; y++) {
				for (var x = 0; x < puzzle[y].length; x++) {
					if (puzzle[y][x]) {
						var el = document.createElement("div");
						el.className = "block" + this.type;
						el.style.left = (this.x + x) * this.area.unit + "px";
						el.style.top = (this.y + y) * this.area.unit + "px";
						this.area.el.appendChild(el);
						this.board[y][x] = el;
						this.elements.push(el);
					}
				}
			}
			// next puzzle
			var nextPuzzle = this.puzzles[this.nextType];
			for (var y = 0; y < nextPuzzle.length; y++) {
				for (var x = 0; x < nextPuzzle[y].length; x++) {
					if (nextPuzzle[y][x]) {
						var el = document.createElement("div");
						el.className = "block" + this.nextType;
						el.style.left = (x * this.area.unit) + "px";
						el.style.top = (y * this.area.unit) + "px";
						document.getElementById("tetris-nextpuzzle").appendChild(el);
						this.nextElements.push(el);
					}
				}
			}
			this.tetris.stats.setScore(this.calculateScore());
			this.skipping = true;
			this.tetris.actionOfAICycle = this.tetris.anAIModule.doAICycle(this.tetris.area, this.tetris.puzzle, this.tetris.stats, this.tetris.actionOfAICycle);
			this.tetris.doAIActions();
			if (!this.tetris.paused) {
				if (this.running) {
					this.fallDownID = setTimeout(this.fallDown, this.speed >> 1);
				} else {
					this.forceMoveDownID = setTimeout(this.forceMoveDown, 15);
				}
			}
		};
		
		this.calculateScore = function()
		{
			var r, h, x, y;
			var cleanFlag;
			
			r = 0;
			h = Math.floor(this.tetris.maxScore / (this.tetris.area.board.length + 1));
			for (y = 0; y < this.tetris.area.board.length - 4; y++) {
				cleanFlag = true;
				for (x = 0; x < this.tetris.area.board[y].length; x++) {
					if (this.tetris.area.board[y][x]) {
						cleanFlag = false;
						break;
					}
				}
				if (cleanFlag) { r += h; }
			}
			
			return r;
		}
		
		/**
		 * Remove puzzle from the area.
		 * Clean some other stuff, see reset()
		 * @return void
		 * @access public
		 */
		this.destroy = function()
		{
			for (var i = 0; i < this.elements.length; i++) {
				this.area.el.removeChild(this.elements[i]);
			}
			this.reset();
		};

		/**
		 * @param int y
		 * @param int x
		 * @return array
		 * @access private
		 */
		this.createEmptyPuzzle = function(y, x)
		{
			var puzzle = [];
			for (var y2 = 0; y2 < y; y2++) {
				puzzle.push(new Array());
				for (var x2 = 0; x2 < x; x2++) {
					puzzle[y2].push(0);
				}
			}
			return puzzle;
		};

		/**
		 * Puzzle fall from the top to the bottom.
		 * After placing a puzzle, this event will be called as long as the puzzle is running.
		 * @see place() stop()
		 * @return void
		 * @access event
		 */
		this.fallDown = function()
		{
			if (!self.skipping) {
				if (self.mayMoveDown()) {
					self.moveDown();
					self.skipping = true;
					self.tetris.actionOfAICycle = self.tetris.anAIModule.doAICycle(self.tetris.area, self.tetris.puzzle, self.tetris.stats, self.tetris.actionOfAICycle);
					self.tetris.doAIActions();
					if (!self.tetris.paused) {
						if (self.running) {
							self.fallDownID = setTimeout(self.fallDown, self.speed >> 1);
						} else {
							self.forceMoveDownID = setTimeout(self.forceMoveDown, 15);
						}
					}
				} else {
					// move blocks into area board
					for (var i = 0; i < self.elements.length; i++) {
						self.area.addElement(self.elements[i]);
					}
					// stats
					var lines = self.area.removeFullLines();
					if (lines) {
						self.tetris.stats.setLines(self.tetris.stats.getLines() + lines);
					}
					// reset puzzle
					self.reset();
					if (self.mayPlace()) {
						self.place();
					} else {
						self.tetris.gameOver();
					}
				}
			} else {
				self.skipping = false;
				self.tetris.actionOfAICycle = self.tetris.anAIModule.doAICycle(self.tetris.area, self.tetris.puzzle, self.tetris.stats, self.tetris.actionOfAICycle);
				self.tetris.doAIActions();
				if (!self.tetris.paused) {
					if (self.running) {
						self.fallDownID = setTimeout(self.fallDown, self.speed >> 1);
					} else {
						self.forceMoveDownID = setTimeout(self.forceMoveDown, 15);
					}
				}
			}
		};

		/**
		 * After clicking "space" the puzzle is forced to move down, no user action is performed after
		 * this event is called. this.running must be set to false. This func is similiar to fallDown()
		 * Also update score & actions - like Tetris.down()
		 * @see fallDown()
		 * @return void
		 * @access public event
		 */
		this.forceMoveDown = function()
		{
			if (!self.skipping) {
				if (self.mayMoveDown()) {
					// stats: score, actions
					self.tetris.stats.setActions(self.tetris.stats.getActions() + 1);
					self.moveDown();
					self.skipping = true;
					self.tetris.actionOfAICycle = self.tetris.anAIModule.doAICycle(self.tetris.area, self.tetris.puzzle, self.tetris.stats, self.tetris.actionOfAICycle);
					// no need to invoke self.tetris.doAIActions(); here
					if (!self.tetris.paused) {					
						self.forceMoveDownID = setTimeout(self.forceMoveDown, 15);
					}
				} else {
					// move blocks into area board
					for (var i = 0; i < self.elements.length; i++) {
						self.area.addElement(self.elements[i]);
					}
					// stats: lines
					var lines = self.area.removeFullLines();
					if (lines) {
						self.tetris.stats.setLines(self.tetris.stats.getLines() + lines);
					}
					// reset puzzle
					self.reset();
					if (self.mayPlace()) {
						self.place();
					} else {
						self.tetris.gameOver();
					}
				}
			} else {
				self.skipping = false;
				self.tetris.actionOfAICycle = self.tetris.anAIModule.doAICycle(self.tetris.area, self.tetris.puzzle, self.tetris.stats, self.tetris.actionOfAICycle);
				// no need to invoke self.tetris.doAIActions(); here
				if (!self.tetris.paused) {					
					self.forceMoveDownID = setTimeout(self.forceMoveDown, 15);
				}
			}
		};

		/**
		 * Check whether puzzle may be rotated.
		 * Check down, left, right, rotate
		 * @return bool
		 * @access public
		 */
		this.mayRotate = function()
		{
			for (var y = 0; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						var newY = this.y + this.board[y].length - 1 - x;
						var newX = this.x + y;
						if (newY < 0) { return false; }
						if (newY >= this.area.y) { return false; }
						if (newX < 0) { return false; }
						if (newX >= this.area.x) { return false; }
						if (this.area.getBlock(newY, newX)) { return false; }
					}
				}
			}
			return true;
		};

		/**
		 * Rotate the puzzle to the left.
		 * @return void
		 * @access public
		 */
		this.rotate = function()
		{
			var puzzle = this.createEmptyPuzzle(this.board.length, this.board[0].length);  // TO DO make the rectangle appropriate here
			for (var y = 0; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						var newY = puzzle[y].length - 1 - x;
						var newX = y;
						var el = this.board[y][x];
						var moveY = newY - y;
						var moveX = newX - x;
						el.style.left = el.offsetLeft + (moveX * this.area.unit) + "px";
						el.style.top = el.offsetTop + (moveY * this.area.unit) + "px";
						puzzle[newY][newX] = el;
					}
				}
			}
			this.board = puzzle;
		};

		/**
		 * Check whether puzzle may be moved down.
		 * - is any other puzzle on the way ?
		 * - is it end of the area ?
		 * @return bool
		 * @access public
		 */
		this.mayMoveDown = function()
		{
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						if (this.y + y + 1 >= this.area.y) { return false; }
						if (this.area.getBlock(this.y + y + 1, this.x + x)) { return false; }
					}
				}
			}
			return true;
		};

		/**
		 * Move the puzzle down by 1 unit.
		 * @return void
		 * @access public
		 */
		this.moveDown = function()
		{
			for (var i = 0; i < this.elements.length; i++) {
				this.elements[i].style.top = this.elements[i].offsetTop + this.area.unit + "px";
			}
			this.y++;
		};

		/**
		 * Check whether puzzle may be moved left.
		 * - is any other puzzle on the way ?
		 * - is the end of the area
		 * @return bool
		 * @access public
		 */
		this.mayMoveLeft = function()
		{
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						if (this.x + x - 1 < 0) { return false; }
						if (this.area.getBlock(this.y + y, this.x + x - 1)) { return false; }
					}
				}
			}
			return true;
		};

		/**
		 * Move the puzzle left by 1 unit
		 * @return void
		 * @access public
		 */
		this.moveLeft = function()
		{
			for (var i = 0; i < this.elements.length; i++) {
				this.elements[i].style.left = this.elements[i].offsetLeft - this.area.unit + "px";
			}
			this.x--;
		};

		/**
		 * Check whether puzle may be moved right.
		 * - is any other puzzle on the way ?
		 * - is the end of the area
		 * @return bool
		 * @access public
		 */
		this.mayMoveRight = function()
		{
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						if (this.x + x + 1 >= this.area.x) { return false; }
						if (this.area.getBlock(this.y + y, this.x + x + 1)) { return false; }
					}
				}
			}
			return true;
		};

		/**
		 * Move the puzzle right by 1 unit.
		 * @return void
		 * @access public
		 */
		this.moveRight = function()
		{
			for (var i = 0; i < this.elements.length; i++) {
				this.elements[i].style.left = this.elements[i].offsetLeft + this.area.unit + "px";
			}
			this.x++;
		};
	}

	function PuzzleAccel(tetris, area)
	{
		var self = this;
		this.tetris = tetris;
		this.area = area;

		this.type = null;
		this.nextType = null;
		this.running = null;
		this.board = [];

		this.x = null;
		this.y = null;

		// width & height must be the same
		this.puzzles = [
			[
				[0,0,1],
				[1,1,1],
				[0,0,0]
			],
			[
				[1,0,0],
				[1,1,1],
				[0,0,0]
			],
			[
				[0,1,1],
				[1,1,0],
				[0,0,0]
			],
			[
				[1,1,0],
				[0,1,1],
				[0,0,0]
			],
			[
				[0,1,0],
				[1,1,1],
				[0,0,0]
			],
			[
				[1,1],
				[1,1]
			],
			[
				[0,0,0,0],
				[1,1,1,1],
				[0,0,0,0],
				[0,0,0,0]
			]
		];

		this.reset = function()
		{
			this.type = this.nextType;
			this.nextType = Math.floor(Math.random() * this.puzzles.length);
			var puzzle = this.puzzles[this.type];
			var emptyLines = true;
			this.x = (this.area.x - puzzle[0].length) >> 1;
			this.y = 0;
			for (var y = 0; y < puzzle.length; y++) {
				for (var x = 0; x < puzzle[y].length; x++) {
					if (puzzle[y][x]) {
						emptyLines = false;
						break;
					}
				}
				if (emptyLines) {
					this.y--;
				} else {
					break;
				}
			}
			this.board = [];
			this.running = true;
		};

		this.nextType = Math.floor(Math.random() * this.puzzles.length);
		this.reset();

		this.mayPlace = function()
		{
			var puzzle = this.puzzles[this.type];
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < puzzle.length; y++) {
				for (var x = 0; x < puzzle[y].length; x++) {
					if ((puzzle[y][x]) && (this.area.getBlock(this.y + y, this.x + x))) {
						return false;
					}
				}
			}
			return true;
		};

		this.place = function()
		{
			this.tetris.statsAccel.setPuzzles(this.tetris.statsAccel.getPuzzles() + 1);
			if (this.tetris.statsAccel.getPuzzles() >= (10 + this.tetris.statsAccel.getLevel() * 2)) {
				this.tetris.statsAccel.setLevel(this.tetris.statsAccel.getLevel() + 1);
				this.tetris.statsAccel.setPuzzles(0);
			}
			var puzzle = this.puzzles[this.type];
			this.board = this.createEmptyPuzzle(puzzle.length, puzzle[0].length);
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < puzzle.length; y++) {
				for (var x = 0; x < puzzle[y].length; x++) {
					if (puzzle[y][x]) {
						this.board[y][x] = 1;
					}
				}
			}
			this.tetris.statsAccel.setScore(this.calculateScore());
		};
		
		this.calculateScore = function()
		{
			var r, h, x, y;
			var cleanFlag;
			
			r = 0;
			h = Math.floor(this.tetris.maxScore / (this.tetris.areaAccel.board.length + 1));
			for (y = 0; y < this.tetris.areaAccel.board.length - 4; y++) {
				cleanFlag = true;
				for (x = 0; x < this.tetris.areaAccel.board[y].length; x++) {
					if (this.tetris.areaAccel.board[y][x]) {
						cleanFlag = false;
						break;
					}
				}
				if (cleanFlag) { r += h; }
			}
			
			return r;
		}
		
		this.createEmptyPuzzle = function(y, x)
		{
			var puzzle = [];
			for (var y2 = 0; y2 < y; y2++) {
				puzzle.push(new Array());
				for (var x2 = 0; x2 < x; x2++) {
					puzzle[y2].push(0);
				}
			}
			return puzzle;
		};

		this.fallDown = function()
		{
			if (self.running) {
				if (self.mayMoveDown()) {
					self.moveDown();
				} else {
					var y = 0;
					if (self.y < 0) { y = -self.y; }
					for ( ; y < self.board.length; y++) {
						for (var x = 0; x < self.board[y].length; x++) {
							if (self.board[y][x]) {
								self.area.setBlock(self.y + y, self.x + x, 1);
							}
						}
					}
					var lines = self.area.removeFullLines();
					if (lines) {
						self.tetris.statsAccel.setLines(self.tetris.statsAccel.getLines() + lines);
					}
					self.reset();
					if (self.mayPlace()) {
						self.place();
					} else {
						self.tetris.gameOverFlag = true;
					}
				}
			}
		};

		this.forceMoveDown = function()
		{
			if (!self.running) {
				if (self.mayMoveDown()) {
					self.moveDown();
				} else {
					var y = 0;
					if (self.y < 0) { y = -self.y; }
					for ( ; y < self.board.length; y++) {
						for (var x = 0; x < self.board[y].length; x++) {
							if (self.board[y][x]) {
								self.area.setBlock(self.y + y, self.x + x, 1);
							}
						}
					}
					var lines = self.area.removeFullLines();
					if (lines) {
						self.tetris.statsAccel.setLines(self.tetris.statsAccel.getLines() + lines);
					}
					self.reset();
					if (self.mayPlace()) {
						self.place();
					} else {
						self.tetris.gameOverFlag = true;
					}
				}
			}
		};

		this.mayRotate = function()
		{
			for (var y = 0; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						var newY = this.y + this.board[y].length - 1 - x;
						var newX = this.x + y;
						if (newY < 0) { return false; }
						if (newY >= this.area.y) { return false; }
						if (newX < 0) { return false; }
						if (newX >= this.area.x) { return false; }
						if (this.area.getBlock(newY, newX)) { return false; }
					}
				}
			}
			return true;
		};

		this.rotate = function()
		{
			var puzzle = this.createEmptyPuzzle(this.board.length, this.board[0].length);  // TO DO make the rectangle appropriate here
			for (var y = 0; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						var newY = puzzle[y].length - 1 - x;
						var newX = y;
						puzzle[newY][newX] = 1;
					}
				}
			}
			this.board = puzzle;
		};

		this.mayMoveDown = function()
		{
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						if (this.y + y + 1 >= this.area.y) { return false; }
						if (this.area.getBlock(this.y + y + 1, this.x + x)) { return false; }
					}
				}
			}
			return true;
		};

		this.moveDown = function()
		{
			this.y++;
		};

		this.mayMoveLeft = function()
		{
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						if (this.x + x - 1 < 0) { return false; }
						if (this.area.getBlock(this.y + y, this.x + x - 1)) { return false; }
					}
				}
			}
			return true;
		};

		this.moveLeft = function()
		{
			this.x--;
		};

		this.mayMoveRight = function()
		{
			var y = 0;
			if (this.y < 0) { y = -this.y; }
			for ( ; y < this.board.length; y++) {
				for (var x = 0; x < this.board[y].length; x++) {
					if (this.board[y][x]) {
						if (this.x + x + 1 >= this.area.x) { return false; }
						if (this.area.getBlock(this.y + y, this.x + x + 1)) { return false; }
					}
				}
			}
			return true;
		};

		this.moveRight = function()
		{
			this.x++;
		};
	}
	
}

if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s*|\s*$/g, "");
	};
}

if (!Array.prototype.removeByIndex) {
	Array.prototype.removeByIndex = function(index) {
		this.splice(index, 1);
	};
}

if (!String.prototype.format) {
	String.prototype.format = function() {
		if (!arguments.length) { throw "String.format() failed, no arguments passed, this = "+this; }
		var tokens = this.split("?");
		if (arguments.length != (tokens.length - 1)) { throw "String.format() failed, tokens != arguments, this = "+this; }
		var s = tokens[0];
		for (var i = 0; i < arguments.length; ++i) {
			s += (arguments[i] + tokens[i + 1]);
		}
		return s;
	};
}