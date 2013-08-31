/*
 * PROJECT:  AIModule
 * VERSION:  0.01
 * LICENSE:  GNU GPL v3 (LICENSE.txt)
 * AUTHOR:  (c) 2013 Eugene Zavidovsky
 * LINK:  https://github.com/Eug145/TetrisAI
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function AIModule(areaX, areaY)
{
	function Angel()
	{
		this.schemeForProjection = createScheme(Angel.schemeForProjectionLength, Angel.maxSchemeIndex);
		this.schemeForMemory = createScheme(Angel.memorySize, Angel.maxSchemeIndex);
		this.memory = new AngelMemory();
		this.memory.copyFromArray(createMemory(Angel.memorySize));
		this.projections = [];
		this.portfolio = [];
		this.projectionStartCount = 0;
		this.timer = 0;
		
		this.doProjectionCycle = function(actionCode, currentSensor) 
		{	
			var g, j, q, s;
			
			s = currentSensor.getScore();
			for (j = (this.projections.length - 1); j >= 0; j--) {
				if (this.projections[j].doProjectionCycle(actionCode)) {
					this.projections.splice(j, 1);
					continue;
				}
				q = this.projections[j].aprojectedSensor.getScore();
				if (s < q) {
					g = s / q;
				} else {
					g = q / s;
				}
				this.insertAdequacyToPortfolio(this.projections[j].timer, g);
			}
			
			return false;
		}
		
		this.insertAdequacyToPortfolio = function(projectionTimer, adequacyValue)
		{
			var pfo;
			var t;
			
			t = this.portfolio.length;
			if (projectionTimer >= t) {
				if (t < Angel.portfolioLength) {
					pfo = new ElementOfPortfolio();
					pfo.total = adequacyValue;
					pfo.count = 1;
					this.portfolio.push(pfo);
				} else {
					this.portfolio[t - 1].total += adequacyValue;
					this.portfolio[t - 1].count++;
				}
			} else {
				this.portfolio[projectionTimer].total += adequacyValue;
				this.portfolio[projectionTimer].count++;
			}
			
			return false;
		}
		
		this.getOverallAdequacy = function()
		{
			var j, r, t;
			
			r = 0;
			for (j = 0; j < this.portfolio.length; j++) {
				t = this.portfolio[j].total;
				r += t / this.portfolio[j].count;
			}
			
			return r;
		}
		
		this.copyPortfolio = function(sourceAngel)
		{
			var i;
			var pfo;
			
			this.portfolio = [];
			for (i = 0; i < sourceAngel.portfolio.length; i++) {
				pfo = new ElementOfPortfolio();
				pfo.total = sourceAngel.portfolio[i].total / sourceAngel.portfolio[i].count;
				pfo.count = Angel.portfolioInheritance;
				this.portfolio.push(pfo);
			}
			
			return false;
		}
		
		this.update = function(currentSensor, aplan)
		{
			var j, d, t;
			var prj;
			
			for (j = 0; j < this.projections.length; j++) {
				this.projections[j].timer++;
			}
			for (j = 1; j < this.projections.length; j++) {
				t = this.projections[j].timer;
				d = t >> 2;
				if ((this.projections[j - 1].timer - t) < d) {
					this.projections.splice(j, 1);
					j--;
				}
			}
			if (this.projections.length < Angel.projectionsLength) {
				if (this.projectionStartCount == 0) {
					prj = new Projection(this, currentSensor, aplan);
					prj.timer = 0;
					this.projections.push(prj);
					this.projectionStartCount = Math.round(Math.random()*Angel.maxProjectionCreatingInterval);
				} else { 
					this.projectionStartCount--;
				}
			} else {
				if (this.projections[1].timer > Angel.maxProjectionsTimer) {
					this.projections.splice(1, 1);
				}
			}
			
			this.timer++;
			
			return false;
		}
	}

	function Soul()
	{
		this.schemeForPlan = createScheme(Soul.schemeForPlanLength, Soul.maxSchemeIndex);
		this.schemeForMemory = createScheme(Soul.memorySize, Soul.maxSchemeIndex);
		this.memory = new SoulMemory();
		this.memory.copyFromArray(createMemory(Soul.memorySize));
		this.suggestedPlan = [];
		
		this.doPlanningCycle = function(anAngel, currentSensor)
		{
			var j;
			var temporarySoulMemory;
			var asuggestedActuators = new SuggestedActuators();
			
			temporarySoulMemory = this.memory.clone();
			calculateAllSchemeExtra(temporarySoulMemory, this.schemeForMemory, currentSensor, this.memory);
			this.memory.copy(temporarySoulMemory);
			for (j = 0; j < Soul.schemeForPlanLength; j++) {
				asuggestedActuators.bitField[j] = calculateScheme(this.schemeForPlan[j], currentSensor, this.memory);
			}
			this.suggestedPlan = asuggestedActuators.getPlan();
			
			return false;
		}
	}
	
	function AbstractBitFieldNumber()
	{
		this.setNumber = function(address, number, capacity)
		{
			var i, j, t;
			
			t = number;
			i = address + capacity - 1;
			for (j = 0; j < capacity; j++) {
				if ((t % 2) == 0) {
					this.bitField[i - j] = false;
				} else {
					this.bitField[i - j] = true;
				}
				t >>= 1;
			}
			
			return false;
		}
		
		this.getNumber = function(address, capacity)
		{
			var j, r;
			
			r = 0;
			for (j = 0; j < capacity - 1; j++) {
				if (this.bitField[address + j]) {
					r++;
				} 
				r <<= 1;
			}
			if (this.bitField[address + j]) {
				r++;
			} 
			
			return r;
		}
	}

	function Sensor()
	{
		this.bitField = new Array(Sensor.sensorSize);
		
		this.clone = function()
		{
			var r = new Sensor();
			var k;
			
			for (k = 0; k < r.bitField.length; k++) {
				r.bitField[k] = this.bitField[k];
			}
			
			return r;
		}
		
		this.setArea = function(area)
		{
			var i, x, y;
			
			i = this.areaAddress;
			for (y = 0; y < area.y; y++) {
				for (x = 0; x < area.x; x++) {
					if (area.board[y][x]) {
						this.bitField[i] = true;
					} else {
						this.bitField[i] = false;
					}
					i++;
				}
			}
			
			return false;
		}
		
		this.setPuzzle = function(puzzle, area)
		{
			var j, x, y;
			
			y = 0;
			if (puzzle.y < 0) { y = -puzzle.y; }
			for ( ; y < puzzle.board.length; y++) {
				for (x = 0; x < puzzle.board[y].length; x++) {
					if (puzzle.board[y][x]) {
						j = this.areaAddress + (puzzle.y + y) * area.x + puzzle.x + x;
						this.bitField[j] = true;
					}
				}
			}
			
			return false;
		}
		
		this.setNextPuzzle = function(nextPuzzleRaw, biggestDimensionY, biggestDimensionX)
		{
			var i, x, y;
			
			i = this.nextPuzzleAddress;
			for (y = 0; y < nextPuzzleRaw.length; y++) {
				for (x = 0; x < nextPuzzleRaw[y].length; x++) {
					if (nextPuzzleRaw[y][x]) {
						this.bitField[i] = true;
					} else {
						this.bitField[i] = false;
					}
					i++;
				}
				for ( ; x < biggestDimensionX; x++) {
					this.bitField[i] = false;
					i++;
				}
			}
			for ( ; y < biggestDimensionY; y++) {
				for (x = 0 ; x < biggestDimensionX; x++) {
					this.bitField[i] = false;
					i++;
				}
			}
			
			return false;
		}
		
		this.setScore = function(score)
		{
			this.setNumber(Sensor.scoreAddress, score, Sensor.scoreSize);
			
			return false;
		}
		
		this.getScore = function()
		{
			var r;
			
			r = this.getNumber(Sensor.scoreAddress, Sensor.scoreSize);
			
			return r;
		}
		
		this.setLines = function(lines)
		{
			this.setNumber(Sensor.linesAddress, lines, Sensor.linesSize);
			
			return false;
		}
		
		this.setAction = function(actionCode)
		{
			this.setNumber(Sensor.actionAddress, actionCode, Sensor.actionSize);
			
			return false;
		}
		
		this.setTimer = function(timer)
		{
			this.setNumber(Sensor.timerAddress, timer, Sensor.timerSize);
			
			return false;
		}
	}
	Sensor.prototype = new AbstractBitFieldNumber();

	function ProjectedSensor()
	{
		this.bitField = new Array(ProjectedSensor.size);
		
		this.getScore = function()
		{
			var r;
			
			r = this.getNumber(ProjectedSensor.scoreAddress, Sensor.scoreSize);
			
			return r;
		}
	}
	ProjectedSensor.prototype = new AbstractBitFieldNumber();
	
	function SuggestedActuators()
	{
		this.bitField = new Array(SuggestedActuators.size);
		
		this.getPlan = function()
		{
			var j, k, z;
			var r = new Plan();
			var act;
			
			for (k = 0; k < this.bitField.length; k += (Sensor.actionSize + SuggestedActuators.timerSize)) {
				act = new ElementOfPlan();
				act.actionCode = this.getNumber(k, Sensor.actionSize);
				act.actionTimer = this.getNumber(k + Sensor.actionSize, SuggestedActuators.timerSize);
				r.actions.push(act);
			}
			for (k = 0; k < r.actions.length; k++) {
				for (j = (r.actions.length - 1); j > k ; j--) {
					if (r.actions[j].actionTimer == r.actions[k].actionTimer) {
						r.actions.splice(j, 1);
					}
				}
			}
			r.actions.sort(compareElementsOfPlan);
			
			return r;
		}
	}
	SuggestedActuators.prototype = new AbstractBitFieldNumber();

	function Projection(parentAngel, startSensor, aplan)
	{
		this.parentAngel = parentAngel;
		this.asensor = startSensor.clone();
		this.memory = parentAngel.memory.clone();
		this.passivePlan = new Plan();
		this.passivePlan = this.passivePlan.concat(aplan);
		this.timer = 0;
		this.aprojectedSensor = new ProjectedSensor();

		this.doProjectionCycle = function(actionCode)
		{
			var k, r, y;
			var hasReject, hasUpdate;
			var temporaryMemory;
			
			hasReject = false;
			hasUpdate = true;
			for (k = 0; k < this.passivePlan.actions.length; k++) {
				if (this.passivePlan.actions[k].actionTimer == this.timer) {
					y = this.passivePlan.actions[k].actionCode;
					if ((y != AIModule.undefinedActionCode1) && (y != AIModule.undefinedActionCode2)) {
						if (y != actionCode) {
							hasReject = true;
						}
					} else {
						hasUpdate = false;
					}
					break;
				}
			}
			if (hasReject) {
				return true;
			}
			this.asensor.setAction(actionCode);
			this.asensor.setTimer(this.timer);
			temporaryMemory = this.memory.clone();
			calculateAllSchemeExtra(temporaryMemory, this.parentAngel.schemeForMemory, this.asensor, this.memory);
			for (k = 0; k < Sensor.scoreSize; k++) {
				this.aprojectedSensor.bitField[ProjectedSensor.scoreAddress + k] = calculateScheme(this.parentAngel.schemeForProjection[Angel.scoreSchemeAddress + k], this.asensor, temporaryMemory);
			}
			if (hasUpdate) {
				this.memory.copy(temporaryMemory);
			}
			
			return false;
		}
	}
	
	function Plan()
	{
		this.actions = [];
		
		this.convergeWith = function(aplan)
		{
			var r = new Plan();
			var act;
			var isCompatible;
			var i, j;
			
			for (i = 0; i < aplan.actions.length; i++) {
				isCompatible = true;
				for (j = 0; j < this.actions.length; j++) {
					if (aplan.actions[i].actionTimer == this.actions[j].actionTimer) {
						isCompatible = false;
						break;
					}
				}
				if (isCompatible) {
					act = new ElementOfPlan();
					act.actionCode = aplan.actions[i].actionCode;
					act.actionTimer = aplan.actions[i].actionTimer;
					r.actions.push(act)
				}
			}
			r = r.concat(this);
			r.actions.sort(compareElementsOfPlan);
			
			return r;
		}
		
		this.getDesirability = function(anAngel, currentSensor)
		{
			var r, k, t;
			var pln = new Plan();
			var prj = new Projection(anAngel, currentSensor, pln);
			
			r = 0;
			for (k = 0; k < this.actions.length; k++) {
				t = this.actions[k].actionTimer
				if (t < anAngel.portfolio.length) {
					prj.timer = t;
					prj.doProjectionCycle(this.actions[k].actionCode);
					r += prj.aprojectedSensor.getScore() * anAngel.portfolio[t].total / anAngel.portfolio[t].count;
				}
			}
			
			return r;
		}
		
		this.update = function()
		{	
			if (this.actions.length == 0) { return true; }
			
			if (this.actions[0].actionTimer == 0) {
				this.actions.splice(0, 1);
			}
			for (var i = 0; i < this.actions.length; i++) {
				this.actions[i].actionTimer--;
			}
			
			return false;
		}
		
		this.clone = function()
		{
			var r = new Plan();
			var act;
			var i;
			
			for (i = 0; i < this.actions.length; i++) {
				act = new ElementOfPlan();
				act.actionCode = this.actions[i].actionCode;
				act.actionTimer = this.actions[i].actionTimer;
				r.actions.push(act)
			}
			
			return r;
		}
		
		this.concat = function(aplan)
		{
			var r = new Plan();
			var act;
			var i;
			
			for (i = 0; i < this.actions.length; i++) {
				act = new ElementOfPlan();
				act.actionCode = this.actions[i].actionCode;
				act.actionTimer = this.actions[i].actionTimer;
				r.actions.push(act)
			}
			for (i = 0; i < aplan.actions.length; i++) {
				act = new ElementOfPlan();
				act.actionCode = aplan.actions[i].actionCode;
				act.actionTimer = aplan.actions[i].actionTimer;
				r.actions.push(act)
			}
			
			return r;
		}
	}
	
	function AbstractMemory()
	{
		this.copy = function(source)
		{
			for (var k = 0; k < source.bitField.length; k++) {
				this.bitField[k] = source.bitField[k];
			}
			
			return false;
		}
		
		this.copyFromArray = function(source)
		{
			for (var k = 0; k < source.length; k++) {
				this.bitField[k] = source[k];
			}
			
			return false;
		}
		
		this.copyPartial = function(source, startFrom, startTo, len)
		{
			for (var k = 0; k < len; k++) {
				this.bitField[startTo + k] = source.bitField[startFrom + k];
			}
			
			return false;
		}
	}

	function AngelMemory()
	{
		this.bitField = new Array(Angel.memorySize);
		
		this.clone = function()
		{
			var r = new AngelMemory();
			
			for (var k = 0; k < r.bitField.length; k++) {
				r.bitField[k] = this.bitField[k];
			}
			
			return r;
		}
		
	}
	AngelMemory.prototype = new AbstractMemory();

	function SoulMemory()
	{
		this.bitField = new Array(Soul.memorySize);
		
		this.clone = function()
		{
			var r = new SoulMemory();
			
			for (var k = 0; k < r.bitField.length; k++) {
				r.bitField[k] = this.bitField[k];
			}
			
			return r;
		}
	}
	SoulMemory.prototype = new AbstractMemory();

	function ElementOfScheme()
	{
		this.number;
		this.negative;
	}

	function ElementOfPortfolio()
	{
		this.total;
		this.count;
	}

	function ElementOfPlan()
	{
		this.actionCode;
		this.actionTimer;
	}
	
	function compareElementsOfPlan(x, y)
	{
		if (x.actionTimer < y.actionTimer) {
			return -1;
		} else {
			if (x.actionTimer == y.actionTimer) {
				return 0;
			} else {
				return 1; 
			}
		}
	}

	function ElementOfMap()
	{
		this.key;
		this.value;
	}
	
	function compareElementsOfMap(x, y)
	{
		if (x.value < y.value) {
			return -1;
		} else {
			if (x.value == y.value) {
				return 0;
			} else {
				return 1; 
			}
		}
	}

	function createScheme(schemeLen, maxi)
	{
		var r = new Array();
		var s, sor, sand;
		var v, w
		
		for (var i = 0; i < schemeLen; i++) {
			s = new Array();
			r.push(s);
			v = Math.round(Math.random() * AIModule.schemeOrSize) + 1;
			for (var j = 0; j < v; j++) {
				sor = new Array();
				r[i].push(sor);
				w = Math.round(Math.random() * AIModule.schemeAndSize) + 1;
				for (var k = 0; k < w; k++) {
					sand = new ElementOfScheme();
					sand.number = Math.round(Math.random() * maxi * 2);
					if ((sand.number % 2) == 1) {
						sand.negative = true;
					} else {
						sand.negative = false;
					}
					sand.number >>= 1;
					r[i][j].push(sand);
				}
			}
		}
		
		return r;
	}

	function calculateScheme(logicalScheme, asensor, anAngelMemory)
	{
		var i, j, ne, nm, nx, r;
		
		r = false;
		for (i = 0; i < logicalScheme.length; i++) {
			r = true;
			for (j = 0; j < logicalScheme[i].length; j++) {
				nm = logicalScheme[i][j].number;
				if (nm < asensor.bitField.length) {
					nx = asensor.bitField[nm];
				} else {
					nm -= asensor.bitField.length;
					nx = anAngelMemory.bitField[nm];
				}
				ne = logicalScheme[i][j].negative;
				if (!(ne || nx)) { r = false; break; }
				if (ne && nx) { r = false; break; }
			}
			if (r) { break; }
		}
		
		return r;
	}

	function calculateAllScheme(destination, logicalSchemes, asensor, anAngelMemory)
	{
		for (var k = 0; k < logicalSchemes.length; k++) {
			destination.bitField[k] = calculateScheme(logicalSchemes[k], asensor, anAngelMemory);
		}
		
		return false;
	}

	function calculateAllSchemeExtra(endAngelMemory, logicalSchemes, asensor, startAngelMemory)
	{
		var i, k;
		var temporaryMemory;
		
		calculateAllScheme(endAngelMemory, logicalSchemes, asensor, startAngelMemory);
		i = endAngelMemory.bitField.length >> 1;
		if (i > 0) {
			temporaryMemory = new AngelMemory();
			do {
				for (k = 0; k < i; k++) {
					temporaryMemory.bitField[k] = calculateScheme(logicalSchemes[k], asensor, endAngelMemory);
				}
				endAngelMemory.copyPartial(temporaryMemory, 0, 0, i)
				i >>= 1;
			} while (i > 0)
		}
		
		return false;
	}

	function createMemory(memoryLen)
	{
		var r = new Array();
		var v;
		
		for (var i = 0; i < memoryLen; i++) {
			v = Math.round(Math.random());
			if (v == 0) {
				r.push(false);
			} else {
				r.push(true);
			}
		}
		
		return r;
	}

	function createSchemeByGeneAlgorithm(firstLogicalSchemeAll, secondLogicalSchemeAll, maxi)
	{
		var r = new Array();
		var crossoverAddresses1 = [];
		var crossoverAddresses2 = [];
		var transferSourceIndex, transferDestinationIndex, transferOffset, transferSize, transferSourceEndIndex, transferDestinationEndIndex;
		var mutationCount;
		var crossoverDirection, crossoverFlag1, crossoverFlag2, transferDirection;
		var s, sor, sand;
		var i, j, k, m, n, t, u;
		
		t = Math.random() * 2;
		if (t <= 1) {  
			crossoverDirection = false;
		} else {
			crossoverDirection = true;
		}
		transferDirection = crossoverDirection;
		t = t - Math.floor(t);
		u = (firstLogicalSchemeAll.length >> 3);
		transferSize = Math.round(t * u) + 1;
		transferSourceIndex = Math.round(Math.random() * (firstLogicalSchemeAll.length - transferSize));
		transferSourceEndIndex = transferSourceIndex + transferSize - 1;
		transferDestinationIndex = Math.round(Math.random() * (firstLogicalSchemeAll.length - 1));
		transferDestinationEndIndex = transferDestinationIndex + transferSize - 1;
		transferOffset = transferDestinationIndex - transferSourceIndex;
		for (i = 0; i < ((transferSize % 7) + 1); i++) {
			t = Math.random() * (firstLogicalSchemeAll.length - 1);
			crossoverAddresses1.push(Math.round(t));
			crossoverAddresses2.push(t - Math.floor(t));
		}
		u = 12;
		mutationCount = Math.round(Math.random() * u);
		
		j = 0; k = 0;
		crossoverFlag2 = false;
		for (i = 0; i < firstLogicalSchemeAll.length; i++) {
			if (crossoverFlag2) {
				i--;
			} else {
				s = new Array();
				r.push(s);
			}
			crossoverFlag1 = false;
			for (t = 0; t < crossoverAddresses1.length; t++) {
				if (crossoverAddresses1[t] != null) {
					if (i == crossoverAddresses1[t]) {
						crossoverFlag1 = true;
						if (!crossoverDirection) {
							if (firstLogicalSchemeAll[i].length > 0 ) {
								m = crossoverAddresses2[t] * (firstLogicalSchemeAll[i].length - 1);
								n = (m - Math.floor(m));
								m = Math.round(m);
								if (firstLogicalSchemeAll[i][m].length > 0 ) {
									n *= (firstLogicalSchemeAll[i][m].length - 1);
									n = Math.round(n);
								}
							}
						} else {
							if (secondLogicalSchemeAll[i].length > 0 ) {
								m = crossoverAddresses2[t] * (secondLogicalSchemeAll[i].length - 1);
								n = (m - Math.floor(m));
								m = Math.round(m);
								if (secondLogicalSchemeAll[i][m].length > 0 ) {
									n *= (secondLogicalSchemeAll[i][m].length - 1);
									n = Math.round(n);
								}
							}
						}
						crossoverAddresses1[t] = null;
						break;
					}
				}
			}
			if ((i >= transferDestinationIndex) && (i <= transferDestinationEndIndex)) {
				t = i - transferOffset;
				for ( ; j < firstLogicalSchemeAll[t].length; j++) {
					sor = new Array();
					r[i].push(sor);
					for ( ; k < firstLogicalSchemeAll[t][j].length; k++) {
						sand = new ElementOfScheme();
						sand.number = firstLogicalSchemeAll[t][j][k].number;
						sand.negative = firstLogicalSchemeAll[t][j][k].negative;
						r[i][j].push(sand);
					}
					k = 0;
				}
				j = 0;
				if (crossoverFlag1) {
					crossoverDirection = !crossoverDirection;
				}
				continue;
			}
			if (!crossoverDirection) {
				for ( ; j < firstLogicalSchemeAll[i].length; j++) {
					if (crossoverFlag2) {
						crossoverFlag2 = false;
					} else {
						sor = new Array();
						r[i].push(sor);
					}	
					for ( ; k < firstLogicalSchemeAll[i][j].length; k++) {
						if (crossoverFlag1 && (m == j) && (n == k)) {
							crossoverFlag2 = true;
							break;
						}
						sand = new ElementOfScheme();
						if (mutationCount == 0) {
							sand.number = Math.round(Math.random() * maxi * 2);
							if ((sand.number % 2) == 0) {
								sand.negative = false;
							} else {
								sand.negative = true;
							}
							sand.number >>= 1;
							mutationCount = Math.round(Math.random() * u);
						} else {
							sand.number = firstLogicalSchemeAll[i][j][k].number;
							if ((sand.number >= transferSourceIndex) && (sand.number <= transferSourceEndIndex) && transferDirection) {
								sand.number += transferOffset;
								transferDirection = !transferDirection;
							}
							sand.negative = firstLogicalSchemeAll[i][j][k].negative;
							mutationCount--;
						}
						r[i][j].push(sand);
					}
					if (crossoverFlag2) {
						break;
					} else {
						k = 0;
					}
				}
				if (crossoverFlag2) {
					crossoverDirection = true;
				} else {
					j = 0;
				}
			} else {
				for ( ; j < secondLogicalSchemeAll[i].length; j++) {
					if (crossoverFlag2) {
						crossoverFlag2 = false;
					} else {
						sor = new Array();
						r[i].push(sor);
					}
					for ( ; k < secondLogicalSchemeAll[i][j].length; k++) {
						if (crossoverFlag1 && (m == j) && (n == k)) {
							crossoverFlag2 = true;
							break;
						}
						sand = new ElementOfScheme();
						if (mutationCount == 0) {
							sand.number = Math.round(Math.random() * maxi * 2);
							if ((sand.number % 2) == 0) {
								sand.negative = false;
							} else {
								sand.negative = true;
							}
							sand.number >>= 1;
							mutationCount = Math.round(Math.random() * u);
						} else {
							sand.number = secondLogicalSchemeAll[i][j][k].number;
							if ((sand.number >= transferSourceIndex) && (sand.number <= transferSourceEndIndex) && transferDirection) {
								sand.number += transferOffset;
								transferDirection = !transferDirection;
							}
							sand.negative = secondLogicalSchemeAll[i][j][k].negative;
							mutationCount--;
						}
						r[i][j].push(sand);
					}
					if (crossoverFlag2) {
						break;
					} else {
						k = 0;
					}
				}
				if (crossoverFlag2) {
					crossoverDirection = false;
				} else {
					j = 0;
				}
			}
		}
		
		u = 8;
		mutationCount = Math.random() * u;
		t = mutationCount - Math.floor(mutationCount);
		mutationCount = Math.round(mutationCount);
		
		for (i = mutationCount; i < r.length; i += mutationCount + 1) {
			if ((i >= transferDestinationIndex) && (i <= transferDestinationEndIndex)) {
				continue;
			}
			if (t < 0.10) {
				if (r[i].length > 0) {
					j = Math.round(t * (r[i].length - 1));
					r[i].splice(j, 1);
				}
			} else {
				if (t < 0.20) {
					sor = new Array();
					sand = new ElementOfScheme();
					sand.number = Math.round(Math.random() * maxi * 2);
					if ((sand.number % 2) == 0) {
						sand.negative = false;
					} else {
						sand.negative = true;
					}
					sand.number >>= 1;
					sor.push(sand);
					r[i].push(sor);
				} else {
					if (t < 0.60) {
						if (r[i].length > 0) {
							j = t * (r[i].length - 1);
							t = j - Math.floor(j);
							j = Math.round(j);
							if (r[i][j].length > 0) {
								k = Math.round(t * (r[i][j].length - 1));
								r[i][j].splice(k, 1);
							}
						}
					} else {
						if (r[i].length > 0) {
							sand = new ElementOfScheme();
							j = Math.round(t * (r[i].length - 1));
							sand.number = Math.round(Math.random() * maxi * 2);
							if ((sand.number % 2) == 0) {
								sand.negative = false;
							} else {
								sand.negative = true;
							}
							sand.number >>= 1;
							r[i][j].push(sand);
						}
					}
				}
			}
			mutationCount = Math.random() * u;
			t = mutationCount - Math.floor(mutationCount);
			mutationCount = Math.round(mutationCount);
		}
		
		return r;
	}

	function createMemoryByGeneAlgorithm(firstMemory, secondMemory)
	{
		var r = new Array();
		var crossoverAddresses = [];
		var mutationCount;
		var crossoverDirection;
		var i, t, u;
		
		t = Math.random() * 2;
		if (t <= 1) {  
			crossoverDirection = false;
		} else {
			crossoverDirection = true;
		}
		t = t - Math.floor(t);
		u = Math.round(t * 7) + 1;
		for (i = 0; i < u; i++) {
			t = Math.random() * (firstMemory.length - 1);
			crossoverAddresses.push(Math.round(t));
		}
		u = 4;
		mutationCount = Math.round(Math.random() * u);

		for (i = 0; i < firstMemory.length; i++) {
			for (t = 0; t < crossoverAddresses.length; t++) {
				if (crossoverAddresses[t] != null) {
					if (i == crossoverAddresses[t]) {
						crossoverDirection = !crossoverDirection;
						crossoverAddresses[t] = null;
						break;
					}
				}
			}
			// TO DO or not to do transfer 
			if (mutationCount == 0) {
				t = Math.round(Math.random());
				if (t == 0) {
					r.push(false);
				} else {
					r.push(true);
				}
				mutationCount = Math.round(Math.random() * u);
			} else {
				if (!crossoverDirection) {
					r.push(firstMemory[i]);
				} else {
					r.push(secondMemory[i]);
				}
				mutationCount--;
			}
		}
		
		return r;
	}

	AIModule.undefinedActionCode1 = 3;
	AIModule.undefinedActionCode2 = 6;
	AIModule.biggestPuzzleXLength = 4;
	AIModule.biggestPuzzleYLength = 4;
	AIModule.schemeOrSize = 4;
	AIModule.schemeAndSize = 8;

	Sensor.areaSize = areaY * areaX;
	Sensor.nextPuzzleSize = AIModule.biggestPuzzleXLength * AIModule.biggestPuzzleYLength;
	Sensor.scoreSize = 8;
	Sensor.linesSize = 4;
	Sensor.actionSize = 3;
	Sensor.timerSize = 16;
	Sensor.size = Sensor.areaSize + Sensor.nextPuzzleSize + Sensor.scoreSize + Sensor.linesSize + Sensor.actionSize + Sensor.timerSize;
	Sensor.areaAddress = 0;
	Sensor.nextPuzzleAddress = Sensor.areaAddress + Sensor.areaSize;
	Sensor.scoreAddress = Sensor.nextPuzzleAddress + Sensor.nextPuzzleSize;
	Sensor.linesAddress = Sensor.scoreAddress + Sensor.scoreSize;
	Sensor.actionAddress = Sensor.linesAddress + Sensor.linesSize;
	Sensor.timerAddress = Sensor.actionAddress + Sensor.actionSize;
	
	Angel.schemeForProjectionLength = Sensor.scoreSize;
	Angel.scoreSchemeAddress = 0;
	Angel.memorySize = 32;
	Angel.maxSchemeIndex = Sensor.size + Angel.memorySize - 1;
	Angel.hugeTimer = 24;
	Angel.bigTimer = Math.round(0.8 * Angel.hugeTimer);
	Angel.maxProjectionsTimer = 24;
	Angel.portfolioLength = 12;
	Angel.projectionsLength = 8;	
	Angel.maxProjectionCreatingInterval = 2;	
	Angel.portfolioInheritance = 1;
	ProjectedSensor.size = Sensor.scoreSize;
	ProjectedSensor.scoreAddress = 0;

	AIModule.angelsNumber = 128;
	AIModule.newAngelsNumber = Math.floor(AIModule.angelsNumber / Angel.hugeTimer + 1);

	this.angels = new Array();
	for (var i = 0; i < AIModule.angelsNumber; i++) {
		this.angels.push(new Angel());
	}

	Soul.planLength = 16;
	SuggestedActuators.timerSize = 5;
	SuggestedActuators.size = Soul.planLength * (SuggestedActuators.timerSize + Sensor.actionSize);
	Soul.schemeForPlanLength = Soul.planLength * (Sensor.actionSize + SuggestedActuators.timerSize);
	Soul.memorySize = 32;
	Soul.maxSchemeIndex = Sensor.size - Sensor.actionSize - Sensor.timerSize + Soul.memorySize - 1;

	AIModule.soulsNumber = 8;
	AIModule.newSoulsNumber = 16;

	this.souls = new Array();
	for (var i = 0; i < AIModule.soulsNumber; i++) {
		this.souls.push(new Soul());
	}

	this.activePlan = new Plan();
	this.activeConvergedPlan = new Plan();

	this.doAICycle = function(currentArea, currentPuzzle, currentStats, doneAction)
	{
		var asensor = new Sensor();
		var grd;
		var ratingTable = [];
		var firstBestAngel, secondBestAngel, worstAngel;
		var firstBestSoul, secondBestSoul, worstSoul;
		var firstBestDesirability, activeDesirability;
		var r, i;
		
		asensor.setArea(currentArea);
		asensor.setPuzzle(currentPuzzle, currentArea);
		asensor.setNextPuzzle(currentPuzzle.puzzles[currentPuzzle.nextType], self.biggestPuzzleYLength, self.biggestPuzzleXLength);
		asensor.setScore(currentStats.getScore());
		asensor.setLines(currentStats.getLines());
		
		for (i = 0; i < AIModule.angelsNumber; i++) {
			this.angels[i].doProjectionCycle(doneAction, asensor);
			grd = new ElementOfMap();
			grd.value = this.angels[i].getOverallAdequacy();
			grd.key = i;
			ratingTable.push(grd);
		}
		
		ratingTable.sort(compareElementsOfMap);
		firstBestAngel = ratingTable[ratingTable.length - 1].key;
		secondBestAngel = ratingTable[ratingTable.length - 2].key;
		for (i = 0; i < AIModule.newAngelsNumber; i++) {
			worstAngel = ratingTable[i].key;
			this.angels[worstAngel].schemeForProjection = createSchemeByGeneAlgorithm(this.angels[firstBestAngel].schemeForProjection, this.angels[secondBestAngel].schemeForProjection, Angel.maxSchemeIndex);
			this.angels[worstAngel].schemeForMemory = createSchemeByGeneAlgorithm(this.angels[firstBestAngel].schemeForMemory, this.angels[secondBestAngel].schemeForMemory, Angel.maxSchemeIndex);
			this.angels[worstAngel].memory.copyFromArray(createMemoryByGeneAlgorithm(this.angels[firstBestAngel].memory, this.angels[secondBestAngel].memory));
			this.angels[worstAngel].timer = 0;
			this.angels[worstAngel].projections = [];
			this.angels[worstAngel].projectionStartCount = 0;
			this.angels[worstAngel].copyPortfolio(this.angels[firstBestAngel]);
		}
		
		ratingTable = [];
		for (i = 0; i < AIModule.soulsNumber; i++) {
			this.souls[i].doPlanningCycle(this.angels[firstBestAngel], asensor);
			grd = new ElementOfMap();
			grd.value = this.souls[i].suggestedPlan.getDesirability(this.angels[firstBestAngel], asensor);
			grd.key = i;
			ratingTable.push(grd);
		}
		
		for (i = 0; i < AIModule.newSoulsNumber; i++) {
			ratingTable.sort(compareElementsOfMap);
			firstBestSoul = ratingTable[ratingTable.length - 1].key;
			secondBestSoul = ratingTable[ratingTable.length - 2].key;
			worstSoul = ratingTable[0].key;
			this.souls[worstSoul].schemeForPlan = createSchemeByGeneAlgorithm(this.souls[firstBestSoul].schemeForPlan, this.souls[secondBestSoul].schemeForPlan, Soul.maxSchemeIndex);
			this.souls[worstSoul].schemeForMemory = createSchemeByGeneAlgorithm(this.souls[firstBestSoul].schemeForMemory, this.souls[secondBestSoul].schemeForMemory, Soul.maxSchemeIndex);
			this.souls[worstSoul].memory.copyFromArray(createMemoryByGeneAlgorithm(this.souls[firstBestSoul].memory, this.souls[secondBestSoul].memory));
			this.souls[worstSoul].doPlanningCycle(this.angels[firstBestAngel], asensor);
			grd = new ElementOfMap();
			grd.value = this.souls[worstSoul].suggestedPlan.getDesirability(this.angels[firstBestAngel], asensor);
			grd.key = worstSoul;
			ratingTable.splice(0, 1);
			ratingTable.push(grd);
		}
		
		this.activePlan.update();
		this.activeConvergedPlan.update();
		activeDesirability = this.activePlan.getDesirability(this.angels[firstBestAngel], asensor);
		firstBestDesirability = ratingTable[ratingTable.length - 1].value;
		if (firstBestDesirability > activeDesirability) {
			this.activePlan = this.souls[firstBestSoul].suggestedPlan.clone();
			this.activeConvergedPlan = this.souls[firstBestSoul].suggestedPlan.convergeWith(this.activeConvergedPlan);
		} else {
			this.activeConvergedPlan = this.activeConvergedPlan.convergeWith(this.souls[firstBestSoul].suggestedPlan);
		}
		
		for (i = 0; i < this.angels.length; i++) {
			this.angels[i].update(asensor, this.activePlan);
		}
		
		if (this.activeConvergedPlan.actions[0].actionTimer == 0) {
			r = this.activeConvergedPlan.actions[0].actionCode;
		} else {
			r = AIModule.undefinedActionCode1;
		}
		
		return r;
	}

	this.prepareForANewGame = function()
	{
		var i;
		
		this.activePlan = new Plan();
		this.activeConvergedPlan = new Plan();
		for (i = 0; i < this.angels.length; i++) {
			this.angels[i].projections = [];
			this.angels[i].projectionStartCount = 0;
		}
		
		return false;
	}
}