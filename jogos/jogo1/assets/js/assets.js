const ASSET_PATHS = {
  pequi: '../../assets/img/pequi.png',
  buriti: '../../assets/img/buriti.png',
  jatoba: '../../assets/img/jatoba.png',
  pedra: '../../assets/img/pedra.png',
  folha: '../../assets/img/folha.png',
  cabeca: '../../assets/img/cabeca.png',
  corpo: '../../assets/img/corpo.png'
};

const loadedAssets = {};

export function preloadAssets(onComplete) {
  const keys = Object.keys(ASSET_PATHS);
  let loadedCount = 0;
  
  if (keys.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  keys.forEach(key => {
    const img = new Image();
    // Resolving paths assuming index.html is in jogos/jogo1/
    img.src = ASSET_PATHS[key].replace('../../', ''); // adjust path relative to root if needed, or keep it.
    // Wait, the prompt says "assets/img/pequi.png". We are in `jogos/jogo1/assets/js/assets.js`.
    // The HTML is in `jogos/jogo1/index.html`. 
    // Relative to HTML: `assets/img/pequi.png`
    img.src = `assets/img/${key}.png`;
    
    img.onload = () => {
      loadedAssets[key] = img;
      loadedCount++;
      if (loadedCount === keys.length && onComplete) {
        onComplete();
      }
    };
    
    img.onerror = () => {
      console.warn(`Failed to load asset: ${key}`);
      loadedCount++; // Count as processed even if failed
      if (loadedCount === keys.length && onComplete) {
        onComplete();
      }
    };
  });
}

export function getAsset(key) {
  return loadedAssets[key] || null;
}
