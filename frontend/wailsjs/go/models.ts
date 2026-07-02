export namespace game {
	
	export class BoardView {
	    size: number;
	    cells: string[][];
	
	    static createFrom(source: any = {}) {
	        return new BoardView(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.size = source["size"];
	        this.cells = source["cells"];
	    }
	}
	export class Coordinate {
	    x: number;
	    y: number;
	
	    static createFrom(source: any = {}) {
	        return new Coordinate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}
	export class FireResult {
	    coordinate: Coordinate;
	    hit: boolean;
	    sunk: boolean;
	    shipName?: string;
	    shipSize?: number;
	    alreadyFired: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FireResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.coordinate = this.convertValues(source["coordinate"], Coordinate);
	        this.hit = source["hit"];
	        this.sunk = source["sunk"];
	        this.shipName = source["shipName"];
	        this.shipSize = source["shipSize"];
	        this.alreadyFired = source["alreadyFired"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ShipInfo {
	    index: number;
	    name: string;
	    size: number;
	    placed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ShipInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.index = source["index"];
	        this.name = source["name"];
	        this.size = source["size"];
	        this.placed = source["placed"];
	    }
	}
	export class SessionState {
	    phase: string;
	    playerBoard: BoardView;
	    cpuBoard: BoardView;
	    currentTurn: string;
	    winner: string;
	    fleet: ShipInfo[];
	    lastPlayerShot?: FireResult;
	    lastCPUShot?: FireResult;
	
	    static createFrom(source: any = {}) {
	        return new SessionState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.phase = source["phase"];
	        this.playerBoard = this.convertValues(source["playerBoard"], BoardView);
	        this.cpuBoard = this.convertValues(source["cpuBoard"], BoardView);
	        this.currentTurn = source["currentTurn"];
	        this.winner = source["winner"];
	        this.fleet = this.convertValues(source["fleet"], ShipInfo);
	        this.lastPlayerShot = this.convertValues(source["lastPlayerShot"], FireResult);
	        this.lastCPUShot = this.convertValues(source["lastCPUShot"], FireResult);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

