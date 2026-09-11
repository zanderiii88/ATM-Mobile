(function(root){
  function nonempty(values){ return values.filter(v => v !== null && v !== undefined && v !== '' && v !== 0); }
  function ratioOverlap(candidate, selected){
    selected=nonempty(selected); candidate=nonempty(candidate); if(!selected.length) return 0;
    const cand=new Set(candidate.map(x=>String(x).toLocaleLowerCase()));
    return selected.filter(x=>cand.has(String(x).toLocaleLowerCase())).length/Math.max(1,selected.length);
  }
  function close(a,b,span=9,fallback=.5){ if(a===null||a===undefined||b===null||b===undefined) return fallback; return Math.max(0,1-Math.abs(Number(a)-Number(b))/span); }
  function moodRoot(m){ return m ? String(m).split(' /')[0].trim().toLocaleLowerCase() : ''; }
  function fingerprint(a,b){
    const ta=[1,2,3,4].map(i=>a['tag'+i]), tb=[1,2,3,4].map(i=>b['tag'+i]);
    const fa=[1,2,3].map(i=>a['family'+i]), fb=[1,2,3].map(i=>b['family'+i]);
    const sonicCols=['energy','aggression','darkness','experimental','organic_electronic','accessibility','rhythm','studio'];
    const sonic=sonicCols.reduce((s,c)=>s+close(a[c],b[c]),0)/sonicCols.length;
    const genre=!!(a.primary_genre && a.primary_genre===b.primary_genre);
    const era=close(a.era_mid,b.era_mid,35);
    const mr=moodRoot(a.mood), mood=!!mr && mr===moodRoot(b.mood);
    return {tag:ratioOverlap(ta,tb),family:ratioOverlap(fa,fb),sonic,genre,era,mood,
      texture:close(a.texture,b.texture),dissonance:close(a.dissonance,b.dissonance),production:close(a.production,b.production)};
  }
  function scores(candidate,selected,fp){
    const spec=Number(candidate.specificity||.70), selectedSpec=Number(selected.specificity||.70), group=Number(candidate.profile_group_size||1);
    const sr=(32*fp.tag+18*fp.family+22*fp.sonic+8*(fp.genre?1:0)+6*fp.era+4*(fp.mood?1:0)+4*fp.texture+4*fp.dissonance+4*fp.production)/102;
    const ps=Math.max(.72,1-Math.min(group-1,70)*.004);
    const similar=Math.min(.58+.36*Math.min(spec,selectedSpec), sr*(.84+.16*spec)*ps);
    const ar=(22*fp.tag+22*fp.family+26*fp.sonic+2*(fp.genre?1:0)+2*fp.era+6*(fp.mood?1:0)+7*fp.texture+7*fp.dissonance+6*fp.production)/100;
    const pa=Math.max(.76,Math.max(.72,1-Math.min(group-1,70)*.004));
    const adjacent=Math.min(.60+.32*Math.min(spec,selectedSpec), ar*(.86+.14*spec)*pa);
    const wildcard=Math.max(0,Math.min(.82,.78-Math.abs(adjacent-.58)*1.05-.07*(fp.genre?1:0)-.05*fp.family));
    return {similar,adjacent,wildcard};
  }
  function reason(candidate,selected,fp){
    const ctags=new Set([1,2,3,4].map(i=>candidate['tag'+i]).filter(Boolean).map(x=>String(x).toLocaleLowerCase()));
    const shared=[1,2,3,4].map(i=>selected['tag'+i]).filter(t=>t&&ctags.has(String(t).toLocaleLowerCase()));
    const bits=[];
    if(shared.length>=2) bits.push('Strong overlap in '+shared.slice(0,3).join(', ')); else if(shared.length) bits.push('Shared '+shared[0]+' DNA');
    else if(fp.family>=.5) bits.push('Closely related scene/style family'); else if(fp.sonic>=.78) bits.push('Very similar sonic shape');
    if(fp.sonic>=.78) bits.push('similar energy and texture'); else if(fp.texture>=.85&&fp.production>=.8) bits.push('comparable texture and production');
    if(fp.era>=.8) bits.push('nearby era'); if(fp.mood) bits.push('matching mood'); if(!fp.genre&&fp.sonic>=.72) bits.push('a useful cross-genre connection');
    if(!bits.length) bits.push('An adjacent match across mood, era and sonic profile');
    let t=bits.slice(0,3).join('; '); return t.charAt(0).toUpperCase()+t.slice(1)+'.';
  }
  function recommend(selected,catalog,mode='Similar',reach=20,limit=12,disliked=new Set()){
    const mk=mode.toLocaleLowerCase(), r=Math.max(0,Math.min(1,reach/100));
    const results=[];
    for(const candidate of catalog){
      if(candidate.artist===selected.artist||disliked.has(candidate.artist)) continue;
      const fp=fingerprint(candidate,selected), sc=scores(candidate,selected,fp); let base,score;
      if(mk==='adjacent'){
        base=sc.adjacent; const novelty=.55*(1-fp.tag)+.30*(1-fp.family)+.15*(fp.genre?0:1);
        score=base*(1-.10*r)+sc.wildcard*(.08*r)+novelty*(.04*r);
      } else if(mk==='wildcard'){ base=sc.wildcard; score=base; }
      else { base=sc.similar; const novelty=.50*(1-fp.tag)+.30*(1-fp.family)+.20*(fp.genre?0:1); score=base*(1-.08*r)+sc.adjacent*(.05*r)+novelty*(.025*r); }
      results.push({artist:candidate,score:Math.max(0,Math.min(1,score)),base_score:base,tag_overlap:fp.tag,family_overlap:fp.family,sonic_similarity:fp.sonic,why:reason(candidate,selected,fp)});
    }
    results.sort((x,y)=> (y.score-x.score) || (Number(y.artist.specificity||0)-Number(x.artist.specificity||0)) || (y.tag_overlap-x.tag_overlap) || (y.family_overlap-x.family_overlap) || (y.sonic_similarity-x.sonic_similarity));
    return results.slice(0,limit);
  }
  const api={recommend,fingerprint,scores,reason}; root.ATMEngine=api; if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);