(function(root){
  function createSeededRng(seed){let value=0;for(const ch of String(seed))value=(value*31+ch.charCodeAt(0))>>>0;return{seed:String(seed),next(){value=(value+0x6D2B79F5)>>>0;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;},int(max){return Math.floor(this.next()*max);}};}
  root.SootSeedLevelLabRng={createSeededRng};
})(globalThis);
