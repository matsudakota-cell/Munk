// Pure acting values. Awareness changes the joke, never the player's controls.
export function neighborPose(npc,kind,t,celebrating){
  const reacting=npc.reaction>0,level=npc.attention[npc.target]||0;
  const beat=2.4-npc.reaction;
  return {
    lean:celebrating?Math.sin(t*9)*.2:reacting?Math.sin(beat*8)*.13*level:Math.sin(t*1.8)*.04,
    hop:celebrating?Math.abs(Math.sin(t*7))*.3:0,
    arms:celebrating?[-1.9,-2.3]:reacting?(kind===0?[-.9,-1.6]:[-1.5,-.8]):[Math.sin(t*2)*.12,-.1],
    tilt:reacting?Math.sin(beat*10)*.15:Math.sin(t)*.05,
    eyes:reacting?1.3:Math.sin(t*2.1)>.985?.12:1,
    mouth:reacting||celebrating?1:.18,
    facing:reacting,
  };
}
